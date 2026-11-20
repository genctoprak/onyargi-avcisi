import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, guardMutation } from "@/lib/security";
import { adminExpertNoteSchema } from "@/lib/validation";
import { getStudyConfig } from "@/lib/study-config";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const notes = await prisma.expertReviewNote.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req, "admin-note-create", 40);
  if (blocked) return blocked;

  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = adminExpertNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Not bilgilerini kontrol edin.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { config } = await getStudyConfig();
    const created = await prisma.expertReviewNote.create({
      data: {
        authorName: parsed.data.authorName,
        authorRole: parsed.data.authorRole,
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId ?? null,
        studyVersion: config.studyVersion,
        rating: parsed.data.rating ?? null,
        note: parsed.data.note,
        status: parsed.data.status ?? "OPEN",
      },
    });

    return NextResponse.json({ note: created }, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/notes error:", err);
    return NextResponse.json({ error: "Uzman değerlendirme notu eklenemedi." }, { status: 500 });
  }
}
