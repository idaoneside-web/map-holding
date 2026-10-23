/**
 * MAP HOLDING — BUSINESS AGENT: LOCAL DEVELOPMENT SESSION TOKENS.
 *
 * Development-only infrastructure for `npm run dev:agent`. This module is
 * NEVER imported by the production worker entry (worker/index.ts) or by any
 * site code: the Cloudflare Access (`ctx.access`) path in production is
 * unaffected by anything in this directory.
 *
 * Model: a stateless token, HMAC-SHA256 signed with a server-held secret.
 *   token = base64url(JSON { email, exp }) . base64url(HMAC(secret, data))
 * Verification is constant-time on the signature; expiry is enforced.
 * The secret is either per-boot (random 32 bytes, memory only) or supplied
 * by the developer via MH_AGENT_DEV_SECRET (base64, 32 bytes). It is never
 * logged, never written to disk, never shipped to the browser.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "mh-agent-dev-session";

/** 12 hours — the life of a local development session. */
export const SESSION_TTL_SECONDS = 12 * 60 * 60;

export interface SessionPayload {
  /** The roster-approved e-mail this session stands for (lower-cased). */
  readonly email: string;
  /** Unix-seconds expiry. */
  readonly exp: number;
  /** Per-sign-in identifier; the server revokes these at sign-out. */
  readonly jti?: string;
}

/** A fresh per-boot secret. Memory only; regenerated on every start. */
export function createSessionSecret(): string {
  return randomBytes(32).toString("base64");
}

function keyOf(secret: string): Buffer {
  const key = Buffer.from(secret, "base64");
  if (key.length === 0) throw new Error("session secret is empty");
  return key;
}

/** Signs a payload. `exp` is in unix seconds. */
export function signSessionToken(payload: SessionPayload, secret: string): string {
  const data = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", keyOf(secret)).update(data).digest("base64url");
  return `${data}.${sig}`;
}

/** Verifies signature AND expiry AND shape. Returns null on ANY defect. */
export function verifySessionToken(
  token: string,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): SessionPayload | null {
  const sep = token.lastIndexOf(".");
  if (sep <= 0 || sep === token.length - 1) return null;
  const data = token.slice(0, sep);
  const sig = token.slice(sep + 1);

  let sigBuf: Buffer;
  let expected: Buffer;
  try {
    sigBuf = Buffer.from(sig, "base64url");
    expected = createHmac("sha256", keyOf(secret)).update(data).digest();
  } catch {
    return null;
  }
  if (sigBuf.length !== expected.length || !timingSafeEqual(sigBuf, expected)) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const p = parsed as { email?: unknown; exp?: unknown; jti?: unknown };
  if (typeof p.email !== "string" || p.email.length === 0) return null;
  if (typeof p.exp !== "number" || !Number.isFinite(p.exp)) return null;
  if (p.exp <= nowSeconds) return null; // expired or in the past
  const jti = typeof p.jti === "string" && p.jti.length > 0 ? p.jti : undefined;
  return { email: p.email.toLowerCase(), exp: p.exp, ...(jti ? { jti } : {}) };
}
