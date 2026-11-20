import { NextRequest, NextResponse } from "next/server";
import { buildGameSessionState } from "@/lib/game-service";
import { getOrCreatePlayerToken } from "@/lib/security";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    const { token } = await getOrCreatePlayerToken();

    if (!sessionId) {
      // Return latest in-progress session for this player if any
      const latest = await prisma.gameSession.findFirst({
        where: { playerToken: token },
        orderBy: { startedAt: "desc" },
      });
      if (!latest) {
        return NextResponse.json({ session: null, currentScenario: null });
      }
      const state = await buildGameSessionState(latest.id);
      return NextResponse.json(state);
    }

    const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
    if (!session || session.playerToken !== token) {
      return NextResponse.json({ error: "Oyun oturumu bulunamadı." }, { status: 404 });
    }

    const state = await buildGameSessionState(sessionId);
    return NextResponse.json(state);
  } catch (err) {
    console.error("GET /api/game/session error:", err);
    return NextResponse.json({ error: "Oturum bilgisi alınamadı." }, { status: 500 });
  }
}
