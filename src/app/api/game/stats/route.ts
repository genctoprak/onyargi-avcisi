import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreatePlayerToken } from "@/lib/security";
import { GAME_BADGES } from "@/lib/scoring";

export async function GET() {
  try {
    const { token } = await getOrCreatePlayerToken();

    const sessions = await prisma.gameSession.findMany({
      where: { playerToken: token },
      include: {
        responses: {
          where: { completed: true },
          include: { scenario: true },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    const completedSessions = sessions.filter((s) => s.status === "COMPLETED");
    const earnedBadgeSet = new Set<string>();
    let totalScore = 0;
    let completedScenarios = 0;
    let evidenceTotal = 0;
    let evidenceAligned = 0;
    let uncertaintyTotal = 0;
    let uncertaintyRecognized = 0;
    let changedAfterClue = 0;
    let clueDecisionTotal = 0;

    for (const s of sessions) {
      totalScore += s.totalScore;
      try {
        const list = JSON.parse(s.badgesEarnedJson) as string[];
        list.forEach((b) => earnedBadgeSet.add(b));
      } catch {
        // ignore
      }
      for (const r of s.responses) {
        completedScenarios++;
        if (r.scenario.scenarioType === "B") {
          uncertaintyTotal++;
          if (r.firstChoice === "UNKNOWN" || r.secondChoice === "UNKNOWN") {
            uncertaintyRecognized++;
          }
        } else {
          evidenceTotal++;
          if (r.secondChoice === r.scenario.verifiedActor) {
            evidenceAligned++;
          }
          if (r.secondChoice) {
            clueDecisionTotal++;
            if (r.secondChoice !== r.firstChoice) {
              changedAfterClue++;
            }
          }
        }
      }
    }

    const latestCompleted = completedSessions[0] ?? null;

    return NextResponse.json({
      totals: {
        totalScore,
        completedSessionsCount: completedSessions.length,
        completedScenariosCount: completedScenarios,
        evidenceSuccessRate:
          evidenceTotal > 0 ? Math.round((evidenceAligned / evidenceTotal) * 100) : null,
        uncertaintyRecognitionRate:
          uncertaintyTotal > 0 ? Math.round((uncertaintyRecognized / uncertaintyTotal) * 100) : null,
        evidenceAligned,
        evidenceTotal,
        uncertaintyRecognized,
        uncertaintyTotal,
        changedAfterClue,
        clueDecisionTotal,
      },
      earnedBadgeIds: Array.from(earnedBadgeSet),
      allBadges: GAME_BADGES,
      latestSession: latestCompleted
        ? {
            id: latestCompleted.id,
            mode: latestCompleted.mode,
            totalScore: latestCompleted.totalScore,
            evidenceScoreCount: latestCompleted.evidenceScoreCount,
            uncertaintyRecognizedCount: latestCompleted.uncertaintyRecognizedCount,
            timedOutCount: latestCompleted.timedOutCount,
            completedScenarios: latestCompleted.responses.length,
            badgesEarned: JSON.parse(latestCompleted.badgesEarnedJson) as string[],
            completedAt: latestCompleted.completedAt,
          }
        : null,
      recentSessions: sessions.slice(0, 10).map((s) => ({
        id: s.id,
        mode: s.mode,
        status: s.status,
        totalScore: s.totalScore,
        completedScenarios: s.responses.length,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
      })),
    });
  } catch (err) {
    console.error("GET /api/game/stats error:", err);
    return NextResponse.json({ error: "İstatistikler yüklenemedi." }, { status: 500 });
  }
}
