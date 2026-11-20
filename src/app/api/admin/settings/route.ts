import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, guardMutation } from "@/lib/security";
import { adminStudyConfigSchema } from "@/lib/validation";
import { getStudyConfig } from "@/lib/study-config";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const readiness = await getStudyConfig();
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return NextResponse.json({
    ...readiness,
    auditLogs,
  });
}

export async function PATCH(req: NextRequest) {
  const blocked = guardMutation(req, "admin-settings-update", 40);
  if (blocked) return blocked;

  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = adminStudyConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz ayar değerleri.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const current = await getStudyConfig();
    const nextData = { ...parsed.data } as Record<string, unknown>;

    // Automatically freeze scenarios when real collection is turned on
    if (parsed.data.studyCollectionEnabled === true) {
      if (current.unapprovedResearchVisuals > 0) {
        return NextResponse.json(
          {
            error:
              "Araştırmacı onayından geçmemiş görsel materyalleri varken gerçek veri toplama başlatılamaz.",
          },
          { status: 409 },
        );
      }
      nextData.scenariosFrozen = true;
      nextData.frozenScenarioVersion =
        parsed.data.studyVersion ?? current.config.studyVersion;
    }

    if (parsed.data.scenariosFrozen === true && !current.config.frozenScenarioVersion) {
      nextData.frozenScenarioVersion =
        parsed.data.studyVersion ?? current.config.studyVersion;
    }

    await prisma.studyConfig.update({
      where: { id: "default" },
      data: nextData,
    });

    await prisma.auditLog.create({
      data: {
        adminUsername: admin.username,
        action: "STUDY_CONFIG_UPDATED",
        details: `Araştırma ayarları güncellendi: ${JSON.stringify(parsed.data)}`,
      },
    });

    const refreshed = await getStudyConfig();
    return NextResponse.json(refreshed);
  } catch (err) {
    console.error("PATCH /api/admin/settings error:", err);
    return NextResponse.json({ error: "Ayarlar güncellenemedi." }, { status: 500 });
  }
}
