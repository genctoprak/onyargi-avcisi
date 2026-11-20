import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStudyCookie } from "@/lib/security";
import { getStudyConfig } from "@/lib/study-config";
import { getFormsForGroup, type StudyGroup } from "@/lib/study-engine";

export async function GET() {
  try {
    const readiness = await getStudyConfig();
    const cookie = await getStudyCookie();

    let participant = null;
    if (cookie) {
      const found = await prisma.studyParticipant.findUnique({
        where: { id: cookie.participantId },
        include: {
          sessions: {
            select: {
              phase: true,
              testForm: true,
              currentIndex: true,
              completionStatus: true,
            },
          },
        },
      });
      if (found) {
        const { armType } = getFormsForGroup(found.groupAssignment as StudyGroup);
        participant = {
          anonymousParticipantId: found.anonymousParticipantId,
          isDemo: found.isDemo,
          studyVersion: found.studyVersion,
          groupAssignment: found.groupAssignment,
          armType,
          pretestForm: found.pretestForm,
          posttestForm: found.posttestForm,
          currentPhase: found.currentPhase,
          withdrawnAt: found.withdrawnAt,
          deletionRequestedAt: found.deletionRequestedAt,
          sessions: found.sessions,
        };
      }
    }

    const followupScenarioCount = await prisma.scenario.count({
      where: { formId: "FOLLOWUP", isActive: true },
    });

    return NextResponse.json({
      studyVersion: readiness.config.studyVersion,
      canCollectRealResearchData: readiness.canCollectRealResearchData,
      readinessIssues: readiness.readinessIssues,
      followupEnabled: readiness.config.followupEnabled,
      followupReady: readiness.config.followupEnabled && followupScenarioCount > 0,
      followupDelayDays: readiness.config.followupDelayDays,
      demoDataEnabled: readiness.config.demoDataEnabled,
      participant,
    });
  } catch (err) {
    console.error("GET /api/study/status error:", err);
    return NextResponse.json({ error: "Araştırma durumu alınamadı." }, { status: 500 });
  }
}
