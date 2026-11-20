import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/security";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }
  return NextResponse.json({
    admin: {
      username: session.username,
      displayName: session.displayName,
      role: session.role,
    },
  });
}
