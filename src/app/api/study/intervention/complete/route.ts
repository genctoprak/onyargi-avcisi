import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStudyCookie, guardMutation } from "@/lib/security";
import { studyInterventionCompleteSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req, "study-intervention-complete", 40);
  if (blocked) return blocked;

  try {
    const cookie = await getStudyCookie();
    if (!cookie) {
      return NextResponse.json({ error: "Aktif araştırma oturumu bulunamadı." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = studyInterventionCompleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz tamamlanma bilgisi." }, { status: 400 });
    }

    const participant = await prisma.studyParticipant.findUnique({
      where: { id: cookie.participantId },
    });
    if (!participant || participant.currentPhase !== "INTERVENTION") {
      return NextResponse.json(
        { error: "Bu işlem yalnızca etkinlik aşamasındayken yapılabilir." },
        { status: 409 },
      );
    }

    const session = await prisma.studySession.findUnique({
      where: {
        participantId_phase: {
          participantId: participant.id,
          phase: "INTERVENTION",
        },
      },
    });
    if (!session || session.testForm !== "CONTROL") {
      return NextResponse.json({ error: "Kontrol grubu oturumu bulunamadı." }, { status: 404 });
    }

    const now = new Date();
    await prisma.studySession.update({
      where: { id: session.id },
      data: {
        currentIndex: parsed.data.completedItems,
        completionStatus: "COMPLETED",
        completedAt: now,
      },
    });

    await prisma.studyParticipant.update({
      where: { id: participant.id },
      data: { currentPhase: "POSTTEST" },
    });

    return NextResponse.json({
      completed: true,
      nextPhase: "POSTTEST",
    });
  } catch (err) {
    console.error("POST /api/study/intervention/complete error:", err);
    return NextResponse.json({ error: "Etkinlik tamamlanamadı." }, { status: 500 });
  }
}
