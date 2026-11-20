import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStudyCookie, guardMutation } from "@/lib/security";
import {
  resolveClueText,
  type ChoiceValue,
  type ScenarioPresentationAssignment,
} from "@/lib/study-engine";
import { z } from "zod";

const unlockSchema = z.object({
  sessionId: z.string().min(1),
  scenarioId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req, "study-clue2", 120);
  if (blocked) return blocked;

  try {
    const cookie = await getStudyCookie();
    if (!cookie) {
      return NextResponse.json({ error: "Aktif araştırma oturumu bulunamadı." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = unlockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    const session = await prisma.studySession.findUnique({
      where: { id: parsed.data.sessionId },
    });
    if (!session || session.participantId !== cookie.participantId) {
      return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 404 });
    }

    // MUST have saved first choice before any clue can be viewed!
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
        { error: "İlk karar kaydedilmeden ipucu görüntülenemez." },
        { status: 409 },
      );
    }

    const scenario = await prisma.scenario.findUnique({
      where: { id: parsed.data.scenarioId },
    });
    if (!scenario || !scenario.clue2) {
      return NextResponse.json({ error: "Bu maddede ikinci ipucu bulunmuyor." }, { status: 404 });
    }

    const assignments = JSON.parse(session.scenarioOrderJson) as ScenarioPresentationAssignment[];
    const assignment = assignments.find((a) => a.scenarioId === scenario.id);
    if (!assignment) {
      return NextResponse.json({ error: "Senaryo ataması bulunamadı." }, { status: 404 });
    }

    await prisma.studyResponse.update({
      where: { id: existing.id },
      data: { clue2ViewedAt: existing.clue2ViewedAt ?? new Date() },
    });

    const clue2 = resolveClueText(
      scenario.clue2,
      scenario.verifiedActor as ChoiceValue,
      assignment.displayedCharacterOrder,
    );

    return NextResponse.json({ clue2 });
  } catch (err) {
    console.error("POST /api/study/unlock-clue2 error:", err);
    return NextResponse.json({ error: "İkinci ipucu açılamadı." }, { status: 500 });
  }
}
