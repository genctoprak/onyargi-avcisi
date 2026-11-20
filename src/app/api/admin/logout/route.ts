import { NextRequest, NextResponse } from "next/server";
import { clearAdminSessionCookie, guardMutation } from "@/lib/security";

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req, "admin-logout", 30);
  if (blocked) return blocked;

  const res = NextResponse.json({ ok: true });
  clearAdminSessionCookie(res);
  return res;
}
