import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStudyCookie, guardMutation } from "@/lib/security";
import { studySecondDecisionSchema } from "@/lib/validation";
import {
  canonicalToDisplayedChoice,
  displayedToCanonicalChoice,
  resolveClueText,
  type ChoiceValue,
  type ScenarioPresentationAssignment,
} from "@/lib/study-engine";

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req, "study-second", 120);
  if (blocked) return blocked;

  try {
    const cookie = await getStudyCookie();
    if (!cookie) {
      return NextResponse.json({ error: "Aktif araştırma oturumu bulunamadı." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = studySecondDecisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Lütfen son karar alanlarını eksiksiz doldurun.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const session = await prisma.studySession.findUnique({
      where: { id: parsed.data.sessionId },
      include: { participant: true },
    });
    if (!session || session.participantId !== cookie.participantId) {
      return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 404 });
    }
    if (session.participant.currentPhase === "WITHDRAWN") {
      return NextResponse.json({ error: "Çalışmadan ayrılmış oturum." }, { status: 403 });
    }

    const existing = await prisma.studyResponse.findUnique({
      where: {
        sessionId_scenarioId: {
          sessionId: session.id,
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
    if (existing.completionStatus === "COMPLETED") {
      return NextResponse.json(
        { error: "Tamamlanan madde yanıtı sonradan değiştirilemez." },
        { status: 409 },
      );
    }

    const assignments = JSON.parse(session.scenarioOrderJson) as ScenarioPresentationAssignment[];
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

    const now = new Date();
    await prisma.studyResponse.update({
      where: { id: existing.id },
      data: {
        secondDecisionMode: parsed.data.decisionMode,
        secondChoice: canonicalSecondChoice,
        secondConfidence: parsed.data.confidence,
        secondSubmittedAt: now,
        interpretationAfter: parsed.data.interpretationAfter ?? null,
        completionStatus: "COMPLETED",
      },
    });

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

    // ONLY experimental INTERVENTION stage receives educational explanation.
    // PRETEST / POSTTEST / FOLLOWUP strictly receive ZERO feedback and ZERO answer keys!
    if (session.phase === "INTERVENTION") {
      const displayedVerifiedActor = canonicalToDisplayedChoice(
        scenario.verifiedActor as ChoiceValue,
        currentAssignment.displayedCharacterOrder,
      );
      const contextExplanation = resolveClueText(
        scenario.contextExplanation,
        scenario.verifiedActor as ChoiceValue,
        currentAssignment.displayedCharacterOrder,
      );
      return NextResponse.json({
        saved: true,
        phaseCompleted,
        nextPhase,
        nextIndex,
        interventionFeedback: {
          verifiedActorLabel:
            displayedVerifiedActor === "UNKNOWN"
              ? "Belirsiz — Yeterli kanıt yok"
              : `Karakter ${displayedVerifiedActor}`,
          contextExplanation,
          teachingMessage: scenario.teachingMessage,
        },
      });
    }

    return NextResponse.json({
      saved: true,
      phaseCompleted,
      nextPhase,
      nextIndex,
    });
  } catch (err) {
    console.error("POST /api/study/second-decision error:", err);
    return NextResponse.json({ error: "Son karar kaydedilemedi." }, { status: 500 });
  }
}
