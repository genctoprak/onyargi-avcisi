import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { signToken, verifyToken } from "@/lib/crypto";
import crypto from "node:crypto";

export const ADMIN_COOKIE_NAME = "oa_admin_session";
export const STUDY_COOKIE_NAME = "oa_study_session";
export const PLAYER_COOKIE_NAME = "oa_player_token";

// Basic in-memory sliding-window rate limiter
const rateBuckets = new Map<string, number[]>();

export function checkRateLimit(key: string, limit = 120, windowMs = 60_000): boolean {
  const now = Date.now();
  const existing = rateBuckets.get(key) ?? [];
  const fresh = existing.filter((ts) => now - ts < windowMs);
  if (fresh.length >= limit) {
    rateBuckets.set(key, fresh);
    return false;
  }
  fresh.push(now);
  rateBuckets.set(key, fresh);
  return true;
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

/**
 * Basic CSRF / Same-Origin protection for mutating requests.
 * Rejects requests whose Origin header does not match the request Host.
 */
export function verifySameOrigin(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return true;
  const origin = req.headers.get("origin");
  if (!origin) return true; // Non-browser / server-side fetch / same-origin form without Origin
  const host = req.headers.get("host");
  if (!host) return false;
  try {
    const parsed = new URL(origin);
    return parsed.host === host;
  } catch {
    return false;
  }
}

export function guardMutation(req: NextRequest, bucketPrefix: string, limit = 90): NextResponse | null {
  if (!verifySameOrigin(req)) {
    return NextResponse.json(
      { error: "Güvenlik doğrulaması başarısız (geçersiz kaynak)." },
      { status: 403 },
    );
  }
  const ip = getClientIp(req);
  if (!checkRateLimit(`${bucketPrefix}:${ip}`, limit, 60_000)) {
    return NextResponse.json(
      { error: "Çok fazla istek gönderildi. Lütfen kısa bir süre sonra tekrar deneyin." },
      { status: 429 },
    );
  }
  return null;
}

export interface AdminSessionPayload extends Record<string, unknown> {
  adminId: string;
  username: string;
  displayName: string;
  role: string;
}

export interface StudySessionCookiePayload extends Record<string, unknown> {
  participantId: string;
  anonymousParticipantId: string;
  isDemo: boolean;
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE_NAME)?.value;
  return verifyToken<AdminSessionPayload>(token);
}

export function setAdminSessionCookie(res: NextResponse, payload: AdminSessionPayload): void {
  const token = signToken(payload, 60 * 60 * 12);
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export function clearAdminSessionCookie(res: NextResponse): void {
  res.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getStudyCookie(): Promise<StudySessionCookiePayload | null> {
  const jar = await cookies();
  const token = jar.get(STUDY_COOKIE_NAME)?.value;
  return verifyToken<StudySessionCookiePayload>(token);
}

export function setStudyCookie(res: NextResponse, payload: StudySessionCookiePayload): void {
  const token = signToken(payload, 60 * 60 * 24 * 30);
  res.cookies.set(STUDY_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearStudyCookie(res: NextResponse): void {
  res.cookies.set(STUDY_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getOrCreatePlayerToken(): Promise<{ token: string; isNew: boolean }> {
  const jar = await cookies();
  const existing = jar.get(PLAYER_COOKIE_NAME)?.value;
  if (existing && /^[a-zA-Z0-9_-]{12,64}$/.test(existing)) {
    return { token: existing, isNew: false };
  }
  return { token: `plr_${crypto.randomBytes(12).toString("hex")}`, isNew: true };
}

export function attachPlayerTokenCookie(res: NextResponse, token: string): void {
  res.cookies.set(PLAYER_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
}
