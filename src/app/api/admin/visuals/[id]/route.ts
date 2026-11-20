import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, guardMutation } from "@/lib/security";
import { adminVisualUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const blocked = guardMutation(req, "admin-visual-update", 60);
  if (blocked) return blocked;

  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = adminVisualUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz görsel güncelleme isteği." }, { status: 400 });
    }

    const updated = await prisma.characterVisualPair.update({
      where: { id },
      data: {
        ...parsed.data,
        ...(parsed.data.approvedForResearch === true
          ? {
              isDemoMaterial: false,
              approvedBy: admin.username,
              approvedAt: new Date(),
            }
          : parsed.data.approvedForResearch === false
            ? {
                isDemoMaterial: true,
                approvedBy: null,
                approvedAt: null,
              }
            : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        adminUsername: admin.username,
        action: "VISUAL_UPDATED",
        details: `Görsel çifti güncellendi: ${id} (approvedForResearch=${updated.approvedForResearch})`,
      },
    });

    return NextResponse.json({ visual: updated });
  } catch (err) {
    console.error("PATCH /api/admin/visuals/[id] error:", err);
    return NextResponse.json({ error: "Görsel bilgisi güncellenemedi." }, { status: 500 });
  }
}
