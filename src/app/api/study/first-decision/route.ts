import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStudyCookie, guardMutation } from "@/lib/security";
import { studyFirstDecisionSchema } from "@/lib/validation";
import {
  displayedToCanonicalChoice,
  resolveClueText,
  type ChoiceValue,
  type ScenarioPresentationAssignment,
} from "@/lib/study-engine";

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req, "study-first", 120);
  if (blocked) return blocked;

  try {
    const cookie = await getStudyCookie();
    if (!cookie) {
      return NextResponse.json({ error: "Aktif araştırma oturumu bulunamadı." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = studyFirstDecisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Lütfen tüm ilk karar alanlarını eksiksiz doldurun.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const session = await prisma.studySession.findUnique({
      where: { id: parsed.data.sessionId },
      include: { participant: true },
    });

    if (!session || session.participantId !== cookie.participantId) {
      return NextResponse.json({ error: "Araştırma oturumu bulunamadı." }, { status: 404 });
    }
    if (session.participant.currentPhase === "WITHDRAWN") {
      return NextResponse.json({ error: "Çalışmadan ayrılmış oturumda veri kaydedilemez." }, { status: 403 });
    }
    if (session.completionStatus === "COMPLETED") {
      return NextResponse.json({ error: "Bu aşama zaten tamamlandı." }, { status: 409 });
    }

    const assignments = JSON.parse(session.scenarioOrderJson) as ScenarioPresentationAssignment[];
    const currentAssignment = assignments[session.currentIndex];
    if (!currentAssignment || currentAssignment.scenarioId !== parsed.data.scenarioId) {
      return NextResponse.json(
        { error: "Gönderilen madde aktif sıra ile eşleşmiyor." },
        { status: 409 },
      );
    }

    // Prevent duplicate submission
    const existing = await prisma.studyResponse.findUnique({
      where: {
        sessionId_scenarioId: {
          sessionId: session.id,
          scenarioId: parsed.data.scenarioId,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Bu madde için ilk karar zaten kaydedildi." },
        { status: 409 },
      );
    }

    const scenario = await prisma.scenario.findUnique({
      where: { id: parsed.data.scenarioId },
    });
    if (!scenario) {
      return NextResponse.json({ error: "Senaryo bulunamadı." }, { status: 404 });
    }

    const canonicalFirstChoice = displayedToCanonicalChoice(
      parsed.data.displayedChoice,
      currentAssignment.displayedCharacterOrder,
    );

    const isTestPhase =
      session.phase === "PRETEST" ||
      session.phase === "POSTTEST" ||
      session.phase === "FOLLOWUP";

    // In test phases, B (uncertainty) scenarios do NOT show unnecessary clues and complete immediately.
    const needsClue =
      isTestPhase
        ? scenario.scenarioType !== "B" && Boolean(scenario.clue1)
        : Boolean(scenario.clue1);

    const now = new Date();
    const startedAt = parsed.data.scenarioStartedAt
      ? new Date(parsed.data.scenarioStartedAt)
      : now;

    await prisma.studyResponse.create({
      data: {
        participantId: session.participantId,
        anonymousParticipantId: session.participant.anonymousParticipantId,
        sessionId: session.id,
        isDemo: session.isDemo,
        studyVersion: session.studyVersion,
        scenarioVersion: scenario.version,
        groupAssignment: session.participant.groupAssignment,
        testForm: session.testForm,
        phase: session.phase,
        scenarioId: scenario.id,
        visualVariantId: currentAssignment.visualVariantId,
        displayedCharacterOrder: currentAssignment.displayedCharacterOrder,
        scenarioStartedAt: startedAt,
        firstChoice: canonicalFirstChoice,
        firstConfidence: parsed.data.confidence,
        firstReason: parsed.data.reason,
        firstReasonOther: parsed.data.reasonOther ?? null,
        firstSubmittedAt: now,
        clueViewedAt: needsClue ? now : null,
        interpretationBefore: parsed.data.interpretationBefore ?? null,
        completionStatus: needsClue ? "CLUE_VIEWED" : "COMPLETED",
      },
    });

    if (!needsClue) {
      const nextIndex = session.currentIndex + 1;
      const phaseCompleted = nextIndex >= assignments.length;

      await prisma.studySession.update({
        where: { id: session.id },
        data: {
          currentIndex: nextIndex,
          completionStatus: phaseCompleted ? "COMPLETED" : "IN_PROGRESS",
          completedAt: phaseCompleted ? now : null,
        },
      });

      let nextPhase = session.participant.currentPhase;
      if (phaseCompleted) {
        if (session.phase === "PRETEST") nextPhase = "INTERVENTION";
        else if (session.phase === "INTERVENTION") nextPhase = "POSTTEST";
        else if (session.phase === "POSTTEST") nextPhase = "COMPLETED";
        else if (session.phase === "FOLLOWUP") nextPhase = "COMPLETED";

        await prisma.studyParticipant.update({
          where: { id: session.participantId },
          data: { currentPhase: nextPhase },
        });
      }

      // IMPORTANT: Zero feedback, zero verifiedActor, zero teachingMessage returned in test phases!
      return NextResponse.json({
        saved: true,
        stage: "NEXT",
        clue1: null,
        hasSecondClue: false,
        phaseCompleted,
        nextPhase,
        nextIndex,
      });
    }

    const clue1 = resolveClueText(
      scenario.clue1,
      scenario.verifiedActor as ChoiceValue,
      currentAssignment.displayedCharacterOrder,
    );

    return NextResponse.json({
      saved: true,
      stage: "CLUE1",
      clue1,
      hasSecondClue: scenario.scenarioType === "Y" && Boolean(scenario.clue2),
    });
  } catch (err) {
    console.error("POST /api/study/first-decision error:", err);
    return NextResponse.json({ error: "İlk karar kaydedilemedi." }, { status: 500 });
  }
}
