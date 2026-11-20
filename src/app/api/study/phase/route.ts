import { NextRequest, NextResponse } from "next/server";
import { getStudyCookie } from "@/lib/security";
import { getOrCreateStudySessionForPhase, type StudyPhase } from "@/lib/study-service";

const VALID_PHASES: StudyPhase[] = ["PRETEST", "INTERVENTION", "POSTTEST", "FOLLOWUP"];

export async function GET(req: NextRequest) {
  try {
    const cookie = await getStudyCookie();
    if (!cookie) {
      return NextResponse.json(
        { error: "Aktif araştırma oturumu bulunamadı. Lütfen katılım ekranından giriş yapın." },
        { status: 401 },
      );
    }

    const phaseParam = (req.nextUrl.searchParams.get("phase") || "").toUpperCase() as StudyPhase;
    if (!VALID_PHASES.includes(phaseParam)) {
      return NextResponse.json({ error: "Geçersiz araştırma aşaması." }, { status: 400 });
    }

    const result = await getOrCreateStudySessionForPhase(cookie.participantId, phaseParam);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data);
  } catch (err) {
    console.error("GET /api/study/phase error:", err);
    return NextResponse.json({ error: "Aşama verisi yüklenemedi." }, { status: 500 });
  }
}
