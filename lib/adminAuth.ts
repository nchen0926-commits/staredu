import crypto from "crypto";

/**
 * Shared admin-session logic used by both the local dev server (server.ts)
 * and the Netlify Functions that will replace it in production.
 *
 * There is no user database — this project has exactly one admin role — so a
 * signed, expiring token is enough. The token is never trusted on its own;
 * it must verify against ADMIN_SESSION_SECRET, which only the server knows.
 */

export const SESSION_COOKIE_NAME = "staredu_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET is not set. Generate one (e.g. `openssl rand -hex 32`) and set it as an environment variable before enabling admin login."
    );
  }
  return secret;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error(
      "ADMIN_PASSWORD is not set. Set it as an environment variable before enabling admin login."
    );
  }
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  // Constant-time comparison so response timing can't leak the password.
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function createSessionToken(): string {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${expiresAt}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const sigMatches =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!sigMatches) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return true;
}

export function parseCookies(cookieHeader: string | undefined | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const pair of cookieHeader.split(";")) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

export function buildSessionCookie(token: string, secure: boolean): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function buildClearSessionCookie(secure: boolean): string {
  const parts = [`${SESSION_COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Strict", "Max-Age=0"];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
