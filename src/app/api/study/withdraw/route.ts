import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearStudyCookie, getStudyCookie, guardMutation } from "@/lib/security";
import { studyWithdrawSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req, "study-withdraw", 20);
  if (blocked) return blocked;

  try {
    const cookie = await getStudyCookie();
    if (!cookie) {
      return NextResponse.json({ error: "Aktif araştırma oturumu bulunamadı." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = studyWithdrawSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz ayrılma talebi." }, { status: 400 });
    }

    const now = new Date();
    await prisma.studyParticipant.update({
      where: { id: cookie.participantId },
      data: {
        currentPhase: "WITHDRAWN",
        withdrawnAt: now,
        deletionRequestedAt: parsed.data.requestDataDeletion ? now : null,
        deletionNote: parsed.data.note ?? null,
      },
    });

    await prisma.studySession.updateMany({
      where: {
        participantId: cookie.participantId,
        completionStatus: "IN_PROGRESS",
      },
      data: { completionStatus: "WITHDRAWN" },
    });

    const res = NextResponse.json({
      withdrawn: true,
      deletionRequested: parsed.data.requestDataDeletion,
      message:
        "Çalışmadan ayrılma talebiniz kaydedildi. Veri silme talebi işaretlendiyse araştırmacı yönetim panelinde onaylanarak verileriniz kalıcı olarak kaldırılacaktır.",
    });
    clearStudyCookie(res);
    return res;
  } catch (err) {
    console.error("POST /api/study/withdraw error:", err);
    return NextResponse.json({ error: "Ayrılma talebi kaydedilemedi." }, { status: 500 });
  }
}
