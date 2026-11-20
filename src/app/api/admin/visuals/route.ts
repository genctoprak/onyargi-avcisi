import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/security";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const visuals = await prisma.characterVisualPair.findMany({
    orderBy: [{ systemType: "asc" }, { id: "asc" }],
    include: {
      _count: { select: { scenarios: true } },
    },
  });

  return NextResponse.json({ visuals });
}
