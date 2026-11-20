import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreatePlayerToken, guardMutation } from "@/lib/security";
import { gameSecondDecisionSchema } from "@/lib/validation";
import {
  canonicalToDisplayedChoice,
  displayedToCanonicalChoice,
  resolveClueText,
  type ChoiceValue,
} from "@/lib/study-engine";
import { calculateGameScenarioScore, evaluateEarnedBadges } from "@/lib/scoring";
import type { StoredGameOrderEntry } from "@/lib/game-service";

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req, "game-second", 120);
  if (blocked) return blocked;

  try {
    const body = await req.json();
    const parsed = gameSecondDecisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Lütfen son karar alanlarını eksiksiz doldurun.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { token } = await getOrCreatePlayerToken();
    const session = await prisma.gameSession.findUnique({
      where: { id: parsed.data.sessionId },
      include: { responses: true },
    });
    if (!session || session.playerToken !== token) {
      return NextResponse.json({ error: "Oyun oturumu bulunamadı." }, { status: 404 });
    }

    const existing = await prisma.gameResponse.findUnique({
      where: {
        gameSessionId_scenarioId: {
          gameSessionId: session.id,
          scenarioId: parsed.data.scenarioId,
        },
      },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Önce ilk karar kaydedilmelidir. İpucu aşamasına atlanamaz." },
        { status: 409 },
      );
    }
    if (existing.completed) {
      return NextResponse.json(
        { error: "Bu olay dosyası zaten tamamlandı ve değiştirilemez." },
        { status: 409 },
      );
    }

    const assignments = JSON.parse(session.scenarioIdsJson) as StoredGameOrderEntry[];
    const currentAssignment = assignments[session.currentIndex];
    if (!currentAssignment || currentAssignment.scenarioId !== parsed.data.scenarioId) {
      return NextResponse.json({ error: "Aktif senaryo uyuşmuyor." }, { status: 409 });
    }

    const scenario = await prisma.scenario.findUnique({
      where: { id: parsed.data.scenarioId },
    });
    if (!scenario) {
      return NextResponse.json({ error: "Senaryo bulunamadı." }, { status: 404 });
    }

    const canonicalSecondChoice =
      parsed.data.decisionMode === "STILL_UNKNOWN"
        ? "UNKNOWN"
        : displayedToCanonicalChoice(
            parsed.data.displayedChoice,
            currentAssignment.displayedCharacterOrder,
          );

    const scoreResult = calculateGameScenarioScore({
      scenarioType: scenario.scenarioType as "B" | "K" | "Y",
      verifiedActor: scenario.verifiedActor as ChoiceValue,
      firstChoice: existing.firstChoice as ChoiceValue,
      secondChoice: canonicalSecondChoice,
      interpretationBefore: existing.interpretationBefore,
      interpretationAfter: parsed.data.interpretationAfter ?? null,
      expertAnswer: parsed.data.expertAnswer ?? null,
      expertCorrectOption: scenario.expertCorrectOption,
      mode: session.mode as "CLASSIC" | "TIMED" | "EXPERT",
      timedOut: existing.timedOut,
    });

    await prisma.gameResponse.update({
      where: { id: existing.id },
      data: {
        secondDecisionMode: parsed.data.decisionMode,
        secondChoice: canonicalSecondChoice,
        secondConfidence: parsed.data.confidence,
        secondSubmittedAt: new Date(),
        interpretationAfter: parsed.data.interpretationAfter ?? null,
        expertAnswer: parsed.data.expertAnswer ?? null,
        pointsAwarded: scoreResult.points,
        scoringBreakdownJson: JSON.stringify(scoreResult.breakdown),
        completed: true,
      },
    });

    const nextIndex = session.currentIndex + 1;
    const isSessionCompleted = nextIndex >= assignments.length;

    const allCompletedResponses = await prisma.gameResponse.findMany({
      where: { gameSessionId: session.id, completed: true },
      include: { scenario: true },
    });

    let evidenceAlignedCount = 0;
    let uncertaintyRecognizedCount = 0;
    let updatedWithEvidenceCount = 0;
    let contextScenariosCompleted = 0;
    let totalScore = 0;

    for (const r of allCompletedResponses) {
      totalScore += r.pointsAwarded;
      const scType = r.scenario.scenarioType as "B" | "K" | "Y";
      if (scType === "B" && (r.firstChoice === "UNKNOWN" || r.secondChoice === "UNKNOWN")) {
        uncertaintyRecognizedCount++;
      }
      if ((scType === "K" || scType === "Y") && r.secondChoice === r.scenario.verifiedActor) {
        evidenceAlignedCount++;
      }
      if (r.secondChoice && r.secondChoice !== r.firstChoice) {
        updatedWithEvidenceCount++;
      }
      if (scType === "Y") {
        contextScenariosCompleted++;
      }
    }

    const badgesEarned = evaluateEarnedBadges({
      evidenceAlignedCount,
      uncertaintyRecognizedCount,
      updatedWithEvidenceCount,
      contextScenariosCompleted,
      sessionCompleted: isSessionCompleted,
      mode: session.mode as "CLASSIC" | "TIMED" | "EXPERT",
    });

    await prisma.gameSession.update({
      where: { id: session.id },
      data: {
        currentIndex: nextIndex,
        totalScore,
        evidenceScoreCount: evidenceAlignedCount,
        uncertaintyRecognizedCount,
        badgesEarnedJson: JSON.stringify(badgesEarned),
        status: isSessionCompleted ? "COMPLETED" : "IN_PROGRESS",
        completedAt: isSessionCompleted ? new Date() : null,
      },
    });

    const displayedVerifiedActor = canonicalToDisplayedChoice(
      scenario.verifiedActor as ChoiceValue,
      currentAssignment.displayedCharacterOrder,
    );

    const resolvedContext = resolveClueText(
      scenario.contextExplanation,
      scenario.verifiedActor as ChoiceValue,
      currentAssignment.displayedCharacterOrder,
    );

    return NextResponse.json({
      result: {
        scenarioId: scenario.id,
        scenarioType: scenario.scenarioType,
        verifiedActorLabel:
          displayedVerifiedActor === "UNKNOWN"
            ? "Belirsiz — Yeterli kanıt yok"
            : `Karakter ${displayedVerifiedActor}`,
        isUncertaintyScenario: scenario.scenarioType === "B",
        behaviorIntent: scenario.behaviorIntent,
        contextExplanation: resolvedContext,
        teachingMessage: scenario.teachingMessage,
        pointsAwarded: scoreResult.points,
        stars: scoreResult.stars,
        breakdown: scoreResult.breakdown,
        evidenceAligned: scoreResult.evidenceAligned,
        uncertaintyRecognized: scoreResult.uncertaintyRecognized,
        expertCorrectOption: session.mode === "EXPERT" ? scenario.expertCorrectOption : null,
      },
      sessionSummary: {
        sessionId: session.id,
        totalScore,
        badgesEarned,
        isSessionCompleted,
        nextIndex,
        totalScenarios: assignments.length,
      },
    });
  } catch (err) {
    console.error("POST /api/game/second-decision error:", err);
    return NextResponse.json({ error: "Son karar kaydedilemedi." }, { status: 500 });
  }
}
