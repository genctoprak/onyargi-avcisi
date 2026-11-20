import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, guardMutation } from "@/lib/security";
import { adminScenarioCreateSchema } from "@/lib/validation";
import { getStudyConfig } from "@/lib/study-config";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const [scenarios, readiness] = await Promise.all([
    prisma.scenario.findMany({
      include: { characterPair: true },
      orderBy: [{ formId: "asc" }, { orderIndex: "asc" }],
    }),
    getStudyConfig(),
  ]);

  return NextResponse.json({
    scenarios,
    scenariosFrozen: readiness.config.scenariosFrozen,
    frozenScenarioVersion: readiness.config.frozenScenarioVersion,
  });
}

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req, "admin-scenario-create", 30);
  if (blocked) return blocked;

  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = adminScenarioCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Senaryo bilgilerini kontrol edin.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { config } = await getStudyConfig();
    if (config.scenariosFrozen && parsed.data.formId !== "FOLLOWUP") {
      return NextResponse.json(
        {
          error:
            "Aktif araştırma senaryo sürümleri dondurulmuştur. Yalnızca yeni İzleme Testi (FOLLOWUP) senaryoları eklenebilir.",
        },
        { status: 409 },
      );
    }

    // Enforce scientific rule: B (Belirsizlik) scenarios MUST have verifiedActor = UNKNOWN
    if (parsed.data.scenarioType === "B" && parsed.data.verifiedActor !== "UNKNOWN") {
      return NextResponse.json(
        { error: "Belirsizlik (B) senaryolarında doğru sonuç yalnızca UNKNOWN olabilir." },
        { status: 400 },
      );
    }

    const countInForm = await prisma.scenario.count({
      where: { formId: parsed.data.formId },
    });

    const created = await prisma.scenario.create({
      data: {
        id: parsed.data.id,
        version: config.studyVersion,
        formId: parsed.data.formId,
        orderIndex: countInForm + 1,
        title: parsed.data.title,
        valueCategory: parsed.data.valueCategory,
        scenarioType: parsed.data.scenarioType,
        eventText: parsed.data.eventText,
        characterPairId: parsed.data.characterPairId,
        clue1: parsed.data.clue1 ?? null,
        clue2: parsed.data.clue2 ?? null,
        verifiedActor: parsed.data.verifiedActor,
        behaviorIntent: parsed.data.behaviorIntent,
        contextExplanation: parsed.data.contextExplanation,
        teachingMessage: parsed.data.teachingMessage,
        researchQuestion: parsed.data.researchQuestion,
        isActive: true,
        approvedForResearch: false,
        expertReviewStatus: "PENDING",
      },
    });

    await prisma.auditLog.create({
      data: {
        adminUsername: admin.username,
        action: "SCENARIO_CREATED",
        details: `Yeni senaryo eklendi: ${created.id} (${created.formId})`,
      },
    });

    return NextResponse.json({ scenario: created }, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/scenarios error:", err);
    return NextResponse.json({ error: "Senaryo oluşturulamadı (kimlik zaten kullanılıyor olabilir)." }, { status: 409 });
  }
}
