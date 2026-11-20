import { NextRequest, NextResponse } from "next/server";
import { attachPlayerTokenCookie, getOrCreatePlayerToken, guardMutation } from "@/lib/security";
import { gameStartSchema } from "@/lib/validation";
import { createGameSessionForPlayer } from "@/lib/game-service";

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req, "game-start", 60);
  if (blocked) return blocked;

  try {
    const body = await req.json();
    const parsed = gameStartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz oyun modu seçimi.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { token, isNew } = await getOrCreatePlayerToken();
    const state = await createGameSessionForPlayer(token, parsed.data.mode);

    const res = NextResponse.json(state, { status: 201 });
    if (isNew) {
      attachPlayerTokenCookie(res, token);
    }
    return res;
  } catch (err) {
    console.error("POST /api/game/start error:", err);
    return NextResponse.json(
      { error: "Oyun oturumu başlatılamadı." },
      { status: 500 },
    );
  }
}
