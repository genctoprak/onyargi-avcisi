import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/security";

export async function GET(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const dataMode = req.nextUrl.searchParams.get("dataMode") === "demo" ? "demo" : "real";
  const isDemo = dataMode === "demo";

  const participants = await prisma.studyParticipant.findMany({
    where: { isDemo },
    include: {
      sessions: {
        orderBy: { startedAt: "asc" },
        select: {
          id: true,
          phase: true,
          testForm: true,
          currentIndex: true,
          completionStatus: true,
          startedAt: true,
          completedAt: true,
        },
      },
      _count: {
        select: { responses: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({
    dataMode,
    isDemoData: isDemo,
    participants,
  });
}
