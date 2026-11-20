import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreatePlayerToken, guardMutation } from "@/lib/security";
import { gameFirstDecisionSchema } from "@/lib/validation";
import {
  displayedToCanonicalChoice,
  resolveClueText,
  type ChoiceValue,
} from "@/lib/study-engine";
import type { StoredGameOrderEntry } from "@/lib/game-service";

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req, "game-first", 120);
  if (blocked) return blocked;

  try {
    const body = await req.json();
    const parsed = gameFirstDecisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Lütfen tüm ilk karar alanlarını geçerli şekilde doldurun.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { token } = await getOrCreatePlayerToken();
    const session = await prisma.gameSession.findUnique({
      where: { id: parsed.data.sessionId },
    });

    if (!session || session.playerToken !== token) {
      return NextResponse.json({ error: "Oyun oturumu bulunamadı." }, { status: 404 });
    }
    if (session.status !== "IN_PROGRESS") {
      return NextResponse.json({ error: "Bu oyun oturumu zaten tamamlandı." }, { status: 409 });
    }

    const assignments = JSON.parse(session.scenarioIdsJson) as StoredGameOrderEntry[];
    const currentAssignment = assignments[session.currentIndex];
    if (!currentAssignment || currentAssignment.scenarioId !== parsed.data.scenarioId) {
      return NextResponse.json(
        { error: "Gönderilen senaryo aktif adım ile eşleşmiyor." },
        { status: 409 },
      );
    }

    const existing = await prisma.gameResponse.findUnique({
      where: {
        gameSessionId_scenarioId: {
          gameSessionId: session.id,
          scenarioId: parsed.data.scenarioId,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Bu senaryo için ilk karar zaten kaydedildi." },
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

    const now = new Date();
    await prisma.gameResponse.create({
      data: {
        gameSessionId: session.id,
        scenarioId: scenario.id,
        scenarioVersion: scenario.version,
        visualVariantId: currentAssignment.visualVariantId,
        displayedCharacterOrder: currentAssignment.displayedCharacterOrder,
        firstChoice: canonicalFirstChoice,
        firstConfidence: parsed.data.confidence,
        firstReason: parsed.data.reason,
        firstReasonOther: parsed.data.reasonOther ?? null,
        timedOut: Boolean(parsed.data.timedOut),
        firstSubmittedAt: now,
        clue1ViewedAt: scenario.clue1 ? now : null,
        clue2ViewedAt: scenario.clue2 ? now : null,
        interpretationBefore: parsed.data.interpretationBefore ?? null,
        completed: false,
      },
    });

    if (parsed.data.timedOut) {
      await prisma.gameSession.update({
        where: { id: session.id },
        data: { timedOutCount: { increment: 1 } },
      });
    }

    // İlk karar sunucuya kaydedildi — artık ipucu aşamaları açılabilir!
    const clue1 = resolveClueText(
      scenario.clue1,
      scenario.verifiedActor as ChoiceValue,
      currentAssignment.displayedCharacterOrder,
    );
    const clue2 = resolveClueText(
      scenario.clue2,
      scenario.verifiedActor as ChoiceValue,
      currentAssignment.displayedCharacterOrder,
    );

    return NextResponse.json({
      saved: true,
      clue1,
      clue2,
      hasClue2: Boolean(clue2),
    });
  } catch (err) {
    console.error("POST /api/game/first-decision error:", err);
    return NextResponse.json({ error: "İlk karar kaydedilemedi." }, { status: 500 });
  }
}
