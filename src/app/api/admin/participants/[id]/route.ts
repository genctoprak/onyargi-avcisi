import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, guardMutation } from "@/lib/security";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const blocked = guardMutation(req, "admin-participant-delete", 30);
  if (blocked) return blocked;

  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const participant = await prisma.studyParticipant.findUnique({
      where: { id },
    });

    if (!participant) {
      return NextResponse.json({ error: "Katılımcı kaydı bulunamadı." }, { status: 404 });
    }

    // For real research records, require withdrawal or explicit deletion request first (data integrity safeguard)
    if (!participant.isDemo && !participant.withdrawnAt && !participant.deletionRequestedAt) {
      return NextResponse.json(
        {
          error:
            "Gerçek araştırma katılımcı kayıtları yalnızca çalışmadan ayrılma veya veri silme talebi bulunduğunda silinebilir.",
        },
        { status: 409 },
      );
    }

    await prisma.studyParticipant.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        adminUsername: admin.username,
        action: "PARTICIPANT_DATA_DELETED",
        details: `Katılımcı verileri silindi: ${participant.anonymousParticipantId} (isDemo=${participant.isDemo})`,
      },
    });

    return NextResponse.json({ deleted: true, anonymousParticipantId: participant.anonymousParticipantId });
  } catch (err) {
    console.error("DELETE /api/admin/participants/[id] error:", err);
    return NextResponse.json({ error: "Katılımcı verisi silinemedi." }, { status: 500 });
  }
}
