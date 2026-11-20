import { NextRequest, NextResponse } from "next/server";
import { clearStudyCookie, guardMutation } from "@/lib/security";

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req, "study-logout", 40);
  if (blocked) return blocked;

  const res = NextResponse.json({ ok: true });
  clearStudyCookie(res);
  return res;
}
