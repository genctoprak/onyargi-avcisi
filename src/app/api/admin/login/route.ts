import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/crypto";
import { guardMutation, setAdminSessionCookie } from "@/lib/security";
import { adminLoginSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req, "admin-login", 20);
  if (blocked) return blocked;

  try {
    const body = await req.json();
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Kullanıcı adı ve parola gereklidir." },
        { status: 400 },
      );
    }

    const admin = await prisma.adminUser.findUnique({
      where: { username: parsed.data.username },
    });

    if (!admin || !verifyPassword(parsed.data.password, admin.passwordHash)) {
      return NextResponse.json(
        { error: "Kullanıcı adı veya parola hatalı." },
        { status: 401 },
      );
    }

    await prisma.auditLog.create({
      data: {
        adminUsername: admin.username,
        action: "ADMIN_LOGIN",
        details: "Yönetici paneline giriş yapıldı.",
      },
    });

    const res = NextResponse.json({
      admin: {
        username: admin.username,
        displayName: admin.displayName,
        role: admin.role,
      },
    });

    setAdminSessionCookie(res, {
      adminId: admin.id,
      username: admin.username,
      displayName: admin.displayName,
      role: admin.role,
    });

    return res;
  } catch (err) {
    console.error("POST /api/admin/login error:", err);
    return NextResponse.json({ error: "Giriş işlemi başarısız oldu." }, { status: 500 });
  }
}
