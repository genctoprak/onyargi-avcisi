import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, guardMutation } from "@/lib/security";
import { adminScenarioUpdateSchema } from "@/lib/validation";
import { getStudyConfig } from "@/lib/study-config";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const blocked = guardMutation(req, "admin-scenario-update", 60);
  if (blocked) return blocked;

  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = adminScenarioUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz senaryo güncelleme verisi.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.scenario.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Senaryo bulunamadı." }, { status: 404 });
    }

    const { config } = await getStudyConfig();
    if (config.scenariosFrozen && (existing.formId === "A" || existing.formId === "B")) {
      return NextResponse.json(
        {
          error:
            "Gerçek araştırma başladığı için ölçüm formu senaryoları dondurulmuştur ve düzenlenemez.",
        },
        { status: 409 },
      );
    }

    const updated = await prisma.scenario.update({
      where: { id },
      data: parsed.data,
    });

    await prisma.auditLog.create({
      data: {
        adminUsername: admin.username,
        action: "SCENARIO_UPDATED",
        details: `Senaryo güncellendi: ${id}`,
      },
    });

    return NextResponse.json({ scenario: updated });
  } catch (err) {
    console.error("PATCH /api/admin/scenarios/[id] error:", err);
    return NextResponse.json({ error: "Senaryo güncellenemedi." }, { status: 500 });
  }
}
