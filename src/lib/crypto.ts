import crypto from "node:crypto";

const DEFAULT_SECRET = "onyargi-avcisi-gelistirme-gizli-anahtar-2026-degistirin";

function getSecret(): string {
  return process.env.SESSION_SECRET || DEFAULT_SECRET;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

export function signToken(payload: Record<string, unknown>, maxAgeSeconds = 60 * 60 * 24 * 7): string {
  const data = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyToken<T extends Record<string, unknown>>(token: string | undefined | null): T | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto.createHmac("sha256", getSecret()).update(encoded).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as T & { exp?: number };
    if (typeof parsed.exp === "number" && parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function generateAnonymousCode(prefix = "KAT"): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return `${prefix}-${code}`;
}

export function deterministicHashInt(seed: string): number {
  const hash = crypto.createHash("sha256").update(seed).digest();
  return hash.readUInt32BE(0);
}
