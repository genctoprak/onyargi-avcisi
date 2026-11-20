import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/security";
import {
  calculateScientificIndicators,
  extractChosenStyleFromVariant,
  type MetricResponseRow,
} from "@/lib/metrics";
import { getStudyConfig } from "@/lib/study-config";

export async function GET(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const params = req.nextUrl.searchParams;
    // Strictly separate real research data from demo data (defaults to real!)
    const dataMode = params.get("dataMode") === "demo" ? "demo" : "real";
    const isDemo = dataMode === "demo";
    const filterForm = params.get("form") || "ALL";
    const filterPhase = params.get("phase") || "ALL";
    const filterGroup = params.get("group") || "ALL";

    const [readiness, participants, sessions, responses, gameSessionCount] = await Promise.all([
      getStudyConfig(),
      prisma.studyParticipant.findMany({ where: { isDemo } }),
      prisma.studySession.findMany({ where: { isDemo } }),
      prisma.studyResponse.findMany({
        where: {
          isDemo,
          ...(filterForm !== "ALL" ? { testForm: filterForm } : {}),
          ...(filterPhase !== "ALL" ? { phase: filterPhase } : {}),
          ...(filterGroup !== "ALL" ? { groupAssignment: filterGroup } : {}),
        },
        include: {
          scenario: {
            select: {
              id: true,
              title: true,
              scenarioType: true,
              verifiedActor: true,
              formId: true,
            },
          },
        },
      }),
      prisma.gameSession.count(),
    ]);

    const expCount = participants.filter((p) => p.groupAssignment.startsWith("EXP")).length;
    const ctrlCount = participants.filter((p) => p.groupAssignment.startsWith("CTRL")).length;
    const formACount = participants.filter((p) => p.pretestForm === "A").length;
    const formBCount = participants.filter((p) => p.pretestForm === "B").length;
    const completedPretests = sessions.filter(
      (s) => s.phase === "PRETEST" && s.completionStatus === "COMPLETED",
    ).length;
    const completedPosttests = sessions.filter(
      (s) => s.phase === "POSTTEST" && s.completionStatus === "COMPLETED",
    ).length;
    const incompleteSessions = sessions.filter(
      (s) => s.completionStatus === "IN_PROGRESS" || s.completionStatus === "ABANDONED",
    ).length;
    const withdrawnCount = participants.filter((p) => p.currentPhase === "WITHDRAWN").length;
    const deletionRequestsCount = participants.filter((p) => Boolean(p.deletionRequestedAt)).length;

    const metricRows: MetricResponseRow[] = responses.map((r) => ({
      scenarioId: r.scenarioId,
      scenarioType: r.scenario.scenarioType,
      verifiedActor: r.scenario.verifiedActor,
      testForm: r.testForm,
      phase: r.phase,
      groupAssignment: r.groupAssignment,
      visualVariantId: r.visualVariantId,
      displayedCharacterOrder: r.displayedCharacterOrder,
      firstChoice: r.firstChoice,
      firstConfidence: r.firstConfidence,
      secondChoice: r.secondChoice,
      secondConfidence: r.secondConfidence,
      interpretationBefore: r.interpretationBefore,
      interpretationAfter: r.interpretationAfter,
      completionStatus: r.completionStatus,
    }));

    const overallIndicators = calculateScientificIndicators(metricRows);
    const pretestIndicators = calculateScientificIndicators(
      metricRows.filter((r) => r.phase === "PRETEST"),
    );
    const posttestIndicators = calculateScientificIndicators(
      metricRows.filter((r) => r.phase === "POSTTEST"),
    );

    // Scenario-level answer distribution & appearance variant comparison
    const byScenarioMap = new Map<
      string,
      {
        scenarioId: string;
        title: string;
        formId: string;
        scenarioType: string;
        total: number;
        firstA: number;
        firstB: number;
        firstUnknown: number;
        secondA: number;
        secondB: number;
        secondUnknown: number;
        sweatshirtChosen: number;
        collaredChosen: number;
      }
    >();

    for (const r of responses) {
      if (r.completionStatus !== "COMPLETED") continue;
      let entry = byScenarioMap.get(r.scenarioId);
      if (!entry) {
        entry = {
          scenarioId: r.scenarioId,
          title: r.scenario.title,
          formId: r.scenario.formId,
          scenarioType: r.scenario.scenarioType,
          total: 0,
          firstA: 0,
          firstB: 0,
          firstUnknown: 0,
          secondA: 0,
          secondB: 0,
          secondUnknown: 0,
          sweatshirtChosen: 0,
          collaredChosen: 0,
        };
        byScenarioMap.set(r.scenarioId, entry);
      }
      entry.total++;
      if (r.firstChoice === "A") entry.firstA++;
      else if (r.firstChoice === "B") entry.firstB++;
      else entry.firstUnknown++;

      if (r.secondChoice === "A") entry.secondA++;
      else if (r.secondChoice === "B") entry.secondB++;
      else if (r.secondChoice === "UNKNOWN") entry.secondUnknown++;

      const style = extractChosenStyleFromVariant(r.visualVariantId, r.firstChoice);
      if (style === "sweatshirt") entry.sweatshirtChosen++;
      else if (style === "collared") entry.collaredChosen++;
    }

    const scenarioDistributions = Array.from(byScenarioMap.values()).sort((a, b) =>
      a.scenarioId.localeCompare(b.scenarioId),
    );

    const realParticipantCount = await prisma.studyParticipant.count({ where: { isDemo: false } });
    const demoParticipantCount = await prisma.studyParticipant.count({ where: { isDemo: true } });

    return NextResponse.json({
      dataMode,
      isDemoData: isDemo,
      readiness: {
        canCollectRealResearchData: readiness.canCollectRealResearchData,
        readinessIssues: readiness.readinessIssues,
        studyVersion: readiness.config.studyVersion,
        scenariosFrozen: readiness.config.scenariosFrozen,
        followupEnabled: readiness.config.followupEnabled,
      },
      summary: {
        totalParticipants: participants.length,
        realParticipantCount,
        demoParticipantCount,
        expCount,
        ctrlCount,
        formACount,
        formBCount,
        completedPretests,
        completedPosttests,
        incompleteSessions,
        withdrawnCount,
        deletionRequestsCount,
        standaloneGameSessionCount: gameSessionCount,
      },
      indicators: {
        overall: overallIndicators,
        pretest: pretestIndicators,
        posttest: posttestIndicators,
      },
      scenarioDistributions,
    });
  } catch (err) {
    console.error("GET /api/admin/overview error:", err);
    return NextResponse.json({ error: "Genel durum verileri yüklenemedi." }, { status: 500 });
  }
}
