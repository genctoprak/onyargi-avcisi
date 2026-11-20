import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/security";
import { buildAnonymousCsv, type CsvExportRow } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const params = req.nextUrl.searchParams;
    const dataMode = params.get("dataMode") === "demo" ? "demo" : "real";
    const isDemo = dataMode === "demo";
    const includeBom = params.get("bom") !== "0"; // default UTF-8 BOM for Excel Turkish compatibility
    const filterForm = params.get("form") || "ALL";
    const filterPhase = params.get("phase") || "ALL";
    const filterGroup = params.get("group") || "ALL";

    const responses = await prisma.studyResponse.findMany({
      where: {
        isDemo,
        ...(filterForm !== "ALL" ? { testForm: filterForm } : {}),
        ...(filterPhase !== "ALL" ? { phase: filterPhase } : {}),
        ...(filterGroup !== "ALL" ? { groupAssignment: filterGroup } : {}),
      },
      include: {
        scenario: { select: { scenarioType: true } },
      },
      orderBy: [{ firstSubmittedAt: "asc" }],
    });

    const rows: CsvExportRow[] = responses.map((r) => ({
      anonymousParticipantId: r.anonymousParticipantId,
      dataType: r.isDemo ? "DEMO VERİSİ" : "ARAŞTIRMA VERİSİ",
      studyVersion: r.studyVersion,
      scenarioVersion: r.scenarioVersion,
      sessionId: r.sessionId,
      groupAssignment: r.groupAssignment,
      testForm: r.testForm,
      phase: r.phase,
      scenarioId: r.scenarioId,
      scenarioType: r.scenario.scenarioType,
      visualVariantId: r.visualVariantId,
      displayedCharacterOrder: r.displayedCharacterOrder,
      scenarioStartedAt: r.scenarioStartedAt.toISOString(),
      firstChoice: r.firstChoice,
      firstConfidence: r.firstConfidence,
      firstReason: r.firstReason,
      firstSubmittedAt: r.firstSubmittedAt.toISOString(),
      clueViewedAt: r.clueViewedAt ? r.clueViewedAt.toISOString() : "",
      secondDecisionMode: r.secondDecisionMode ?? "",
      secondChoice: r.secondChoice ?? "",
      secondConfidence: r.secondConfidence ?? "",
      secondSubmittedAt: r.secondSubmittedAt ? r.secondSubmittedAt.toISOString() : "",
      interpretationBefore: r.interpretationBefore ?? "",
      interpretationAfter: r.interpretationAfter ?? "",
      completionStatus: r.completionStatus,
    }));

    const csv = buildAnonymousCsv(rows, { includeBom });
    const fileTag = isDemo ? "demo-verisi" : "arastirma-verisi";
    const dateTag = new Date().toISOString().slice(0, 10);

    await prisma.auditLog.create({
      data: {
        adminUsername: admin.username,
        action: "CSV_EXPORTED",
        details: `CSV dışa aktarıldı (${fileTag}, ${rows.length} satır, bom=${includeBom})`,
      },
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="onyargi-avcisi-${fileTag}-${dateTag}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("GET /api/admin/export error:", err);
    return NextResponse.json({ error: "CSV dışa aktarma başarısız oldu." }, { status: 500 });
  }
}
