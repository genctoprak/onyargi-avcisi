import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, guardMutation } from "@/lib/security";
import { z } from "zod";

const patchNoteSchema = z.object({
  status: z.enum(["OPEN", "RESOLVED"]),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const blocked = guardMutation(req, "admin-note-update", 40);
  if (blocked) return blocked;

  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = patchNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz durum değeri." }, { status: 400 });
    }

    const updated = await prisma.expertReviewNote.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json({ note: updated });
  } catch (err) {
    console.error("PATCH /api/admin/notes/[id] error:", err);
    return NextResponse.json({ error: "Not güncellenemedi." }, { status: 500 });
  }
}
