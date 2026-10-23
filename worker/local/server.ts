/**
 * MAP HOLDING — BUSINESS AGENT: LOCAL DEVELOPMENT SERVER (dev-only).
 *
 * What this is:
 *   A loopback-only Node HTTP server that drives the EXISTING production
 *   request pipeline (`handleAgentRequest` + the shared access contract in
 *   `src/lib/access`). It exists so the Business Agent is usable locally
 *   WITHOUT Cloudflare Access: instead of the edge-verified `ctx.access`
 *   object, the server synthesizes one from a server-verified local session
 *   (HMAC cookie, see session.ts).
 *
 * What it never does:
 *   - bind any interface but 127.0.0.1 (by default);
 *   - start when NODE_ENV=production (assertDevOnly);
 *   - trust any browser-supplied e-mail or role: identities come ONLY from
 *     the signed session, whose contents were established at sign-in by
 *     matching the server-side roster file (config.ts);
 *   - log or transmit the session secret;
 *   - add any business capability: the agent surface is exactly the
 *     production handler — advisory chat (model-gated) and read-only
 *     projects-list through the shared policy.
 *
 * Cookie: `mh-agent-dev-session` — HttpOnly, SameSite=Lax (Secure when
 * MH_AGENT_DEV_SECURE_COOKIES=1), 12 h life, path /, value = signed token.
 * CSRF posture: SameSite=Lax blocks cross-site cookie carriage on POSTs;
 * in addition, any request carrying an Origin header must match the
 * configured origin allow-list (MH_AGENT_DEV_ORIGINS); preflight responses
 * are fail-closed exactly like production.
 *
 * Sign-out invalidates: every session carries a per-sign-in `jti`; the
 * server keeps a revocation registry and a revoked jti yields 401 even
 * while the token's signature and expiry are still intact.
 *
 * Browser sign-in: `/dev/signin` (GET/POST) serves a local HTML form that
 * checks the address against the roster, sets the session cookie and
 * redirects the browser back to the validated return URL (the site
 * workspace), so a refresh there restores the session. This page exists
 * ONLY on the local server; the production Cloudflare surface has no such
 * endpoint.
 */

import { randomBytes } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { assertDevOnly, loadLocalDevConfig, type LocalDevConfig } from "./config.ts";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "./session.ts";
import {
  handleAgentRequest,
  CONFIRMED_WEBSITE_ORIGIN,
  type AgentHandlerOptions,
} from "../handler.ts";
import type { AgentEnv } from "../env.ts";
import type { AccessCtx } from "../identity.ts";

export interface DevServer {
  /** The loopback base URL (http://127.0.0.1:<port>). */
  readonly url: string;
  readonly port: number;
  close(): Promise<void>;
}

const MAX_BODY_BYTES = 64 * 1024;

/** Builds the env the production handler expects, translated from local
 * config. Agnes credentials come from process env — server side only. */
function handlerEnv(cfg: LocalDevConfig): AgentEnv {
  return {
    OWNERS: cfg.owners.join(" "),
    STAFF: cfg.staff.join(" "),
    CLIENTS: cfg.clients.join(" "),
    ALLOWED_ORIGINS: cfg.origins.join(" "),
    AGNES_API_KEY: process.env.AGNES_API_KEY,
    AGNES_BASE_URL: process.env.AGNES_BASE_URL,
    AGNES_MODEL: process.env.AGNES_MODEL,
  };
}

/** jti → session expiry. A jti present here means that session was
 * signed out; the revocation lives only in this process (a restart
 * regenerates the token secret, so all sessions die with it anyway). */
export type Revocations = Map<string, number>;

function rememberRevocation(revoked: Revocations, jti: string, exp: number): void {
  const now = Math.floor(Date.now() / 1000);
  for (const [key, expires] of revoked) if (expires <= now) revoked.delete(key);
  revoked.set(jti, exp);
}

/** The local stand-in for the edge-verified identity: ONLY built from a
 * session that passed signature + expiry + revocation checks. */
function localAccess(session: SessionPayload | null): AccessCtx | undefined {
  if (session === null) return undefined;
  const email = session.email;
  return {
    aud: "local-dev",
    getIdentity: async () => ({ email }),
  };
}

function sessionFromRequest(
  req: IncomingMessage,
  cfg: LocalDevConfig,
  revoked: Revocations,
): SessionPayload | null {
  const cookieHeader = req.headers.cookie;
  if (typeof cookieHeader !== "string" || cookieHeader.length === 0) return null;
  let value: string | null = null;
  for (const part of cookieHeader.split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    if (part.slice(0, i).trim() === SESSION_COOKIE) value = part.slice(i + 1).trim();
  }
  if (value === null || value.length === 0) return null;
  const payload = verifySessionToken(value, cfg.secret);
  if (payload === null) return null;
  if (payload.jti !== undefined && revoked.has(payload.jti)) return null; // signed out
  return payload;
}

function writeJson(res: ServerResponse, status: number, body: unknown, extraHeaders: Record<string, string> = {}): void {
  res.writeHead(status, { "content-type": "application/json", ...extraHeaders });
  res.end(JSON.stringify(body));
}

function writeHtml(res: ServerResponse, status: number, html: string, extraHeaders: Record<string, string> = {}): void {
  res.writeHead(status, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    ...extraHeaders,
  });
  res.end(html);
}

/** Validates the post-sign-in return URL. Only http(s) URLs may be used,
 * only the configured site origins (or loopback when none are configured),
 * and never this very service (a sign-in loop). Anything else falls back
 * to the first configured origin — the default local site URL. */
function sanitizeNext(raw: string | null, cfg: LocalDevConfig): string {
  // Prefer a 127.0.0.1 return when one is configured: the local session
  // cookie lives on the 127.0.0.1 host, and browsers do not carry
  // SameSite=Lax cookies from a localhost page to a 127.0.0.1 service.
  const configured = cfg.origins.find((o) => o.includes("127.0.0.1"));
  const fallback =
    (configured ?? (cfg.origins.length > 0 ? cfg.origins[0] : null))
      ? `${configured ?? cfg.origins[0]}/internal`
      : "http://127.0.0.1:3000/internal";
  if (raw === null || raw.length === 0) return fallback;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return fallback;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;
  if (cfg.origins.length > 0) {
    // Configured origins double as the return-URL allow-list: anything not a
    // known site origin (including this service itself) is rejected.
    if (!cfg.origins.includes(url.origin)) return fallback;
  } else if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost") {
    // No configured origins: keep it loopback-only.
    return fallback;
  }
  return url.toString();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** The local browser sign-in page. Lists the rostered addresses so a
 * developer can sign in without opening a terminal — development only. */
function signInPageHtml(next: string, error: string | null, cfg: LocalDevConfig): string {
  const roster = [...cfg.owners, ...cfg.staff, ...cfg.clients];
  const rosterHtml =
    roster.length > 0
      ? `<ul class="roster">${roster
          .map((address) => {
            const kind = cfg.owners.includes(address)
              ? "owner"
              : cfg.staff.includes(address)
                ? "staff"
                : "client";
            return `<li><code>${escapeHtml(address)}</code> — synthetic ${kind}</li>`;
          })
          .join("")}</ul>`
      : `<p class="empty">No roster entries: copy <code>worker/local/dev-users.example.json</code> to <code>worker/local/dev-users.json</code> and restart the service.</p>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Local development sign-in — MAP Holding Business Agent</title>
<style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; background: #081f3f; color: #f4f7fb;
         display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  main { background: #102a4c; border: 1px solid #2c4a72; border-radius: 12px; padding: 2rem; max-width: 26rem; }
  h1 { font-size: 1.1rem; margin: 0 0 0.4rem; }
  p { color: #a9bcd4; font-size: 0.85rem; line-height: 1.5; margin: 0 0 1rem; }
  label { display: block; font-size: 0.8rem; margin-bottom: 0.6rem; color: #a9bcd4; }
  input[type=email] { width: 100%; box-sizing: border-box; padding: 0.5rem; border-radius: 8px;
    border: 1px solid #2c4a72; background: #081f3f; color: #f4f7fb; font-size: 0.9rem; }
  button { margin-top: 1rem; padding: 0.55rem 1rem; border: 0; border-radius: 8px;
    background: #0f6fff; color: #ffffff; font-size: 0.9rem; font-weight: 600; cursor: pointer; }
  .error { color: #ff9c9c; font-size: 0.8rem; margin: 0 0 0.8rem; }
  .roster { margin: 0.4rem 0 1rem; padding-left: 1.1rem; color: #a9bcd4; font-size: 0.78rem; line-height: 1.7; }
  .roster code { color: #d5e2f2; }
  .empty { color: #a9bcd4; }
</style>
</head>
<body>
<main>
  <h1>Local development sign-in</h1>
  <p>Development only. The address is checked against the local roster file; no real
  credentials are involved. After sign-in you are returned to the workspace.</p>
  ${error ? `<p class="error" role="alert">${escapeHtml(error)}</p>` : ""}
  <form method="post" action="/dev/signin">
    <input type="hidden" name="next" value="${escapeHtml(next)}">
    <label for="email">Rostered e-mail address</label>
    <input id="email" name="email" type="email" autocomplete="off" placeholder="e.g. a rostered address below">
    <button type="submit">Sign in</button>
  </form>
  ${rosterHtml}
</main>
</body>
</html>`;
}

async function readBody(req: IncomingMessage): Promise<Buffer | null> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const c = chunk as Buffer;
    size += c.length;
    if (size > MAX_BODY_BYTES) return null; // over cap: caller 413s
    chunks.push(c);
  }
  return Buffer.concat(chunks);
}

/** No Origin header (curl, same-origin fetches, tests) passes the gate; a
 * present Origin must match the configured allow-list. The agent surface
 * additionally accepts the CONFIRMED_WEBSITE_ORIGIN — the exact origin the
 * production handler allows by default — so the live site keeps working
 * against a local check-out even when MH_AGENT_DEV_ORIGINS is unset. */
function originAllowed(req: IncomingMessage, cfg: LocalDevConfig, agentPath: boolean): boolean {
  const origin = req.headers.origin;
  if (typeof origin !== "string" || origin.length === 0) return true;
  const normalized = origin.replace(/\/+$/, "");
  if (cfg.origins.includes(normalized)) return true;
  return agentPath && normalized === CONFIRMED_WEBSITE_ORIGIN;
}

function corsHeaders(req: IncomingMessage, cfg: LocalDevConfig): Record<string, string> {
  const origin = req.headers.origin;
  if (typeof origin === "string" && cfg.origins.includes(origin.replace(/\/+$/, ""))) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      Vary: "Origin",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    };
  }
  return {};
}

/** Bridges a Web Response (from the production handler) to a Node response. */
async function bridgeWebResponse(res: ServerResponse, web: Response): Promise<void> {
  const headers: Record<string, string> = {};
  web.headers.forEach((value, key) => {
    headers[key] = value;
  });
  const text = await web.text();
  res.writeHead(web.status, headers);
  res.end(text);
}

export async function startLocalAgentServer(
  config: Partial<LocalDevConfig> = {},
  handlerOpts?: AgentHandlerOptions,
): Promise<DevServer> {
  assertDevOnly();
  const loaded = loadLocalDevConfig();
  // undefined ⇒ fall back to env/roster-file config; an explicit value
  // (including an EMPTY array — "no roster") always wins.
  const cfg: LocalDevConfig = {
    host: config.host ?? loaded.host,
    port: config.port ?? 0, // 0 = ephemeral (tests); the CLI main below uses 3300
    secureCookies: config.secureCookies ?? loaded.secureCookies,
    secret: config.secret ?? loaded.secret,
    owners: config.owners ?? loaded.owners,
    staff: config.staff ?? loaded.staff,
    clients: config.clients ?? loaded.clients,
    origins: config.origins ?? loaded.origins,
    usersFile: config.usersFile ?? loaded.usersFile,
  };

  // Per-process session revocations (sign-out); lost on restart, which
  // also regenerates the token secret — so no session survives a restart.
  const revoked: Revocations = new Map();

  const server: Server = createServer(async (req, res) => {
    try {
      await route(req, res, cfg, handlerOpts, revoked);
    } catch {
      writeJson(res, 500, { error: "internal" });
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(cfg.port, cfg.host, () => resolve());
  });
  const address = server.address();
  const port = typeof address === "object" && address !== null ? address.port : cfg.port;
  return {
    url: `http://${cfg.host}:${port}`,
    port,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

async function route(
  req: IncomingMessage,
  res: ServerResponse,
  cfg: LocalDevConfig,
  handlerOpts: AgentHandlerOptions | undefined,
  revoked: Revocations,
): Promise<void> {
  const method = (req.method ?? "GET").toUpperCase();
  const pathname = (req.url ?? "/").split("?")[0];
  const cors = corsHeaders(req, cfg);

  const isAgent =
    pathname === "/agent" ||
    pathname.startsWith("/agent/") ||
    pathname === "/client-agent" ||
    pathname.startsWith("/client-agent/");

  // ---- Preflight: /agent + /client-agent + /health are handled by the
  // production handler (its own allow-list CORS, incl. the compiled
  // site-origin default); only the local /dev/auth surface gets a local
  // preflight here. Fail closed.
  if (method === "OPTIONS" && !isAgent && pathname !== "/health") {
    res.writeHead(204, { Allow: "GET, HEAD, POST, OPTIONS", ...cors });
    res.end();
    return;
  }

  // ---- CSRF gate on state-changing requests ------------------------------
  if (method === "POST" && !originAllowed(req, cfg, isAgent)) {
    writeJson(res, 403, { error: "origin-not-allowed" }, cors);
    return;
  }

  // ---- Local authentication surface (dev-only endpoints) ---------------
  if (pathname === "/dev/signin") {
    if (method === "GET" || method === "HEAD") {
      const next = sanitizeNext(new URL(req.url ?? "/dev/signin", "http://local").searchParams.get("next"), cfg);
      writeHtml(res, 200, signInPageHtml(next, null, cfg), cors);
      return;
    }
    if (method !== "POST") {
      res.writeHead(405, { Allow: "GET, HEAD, POST, OPTIONS", ...cors });
      res.end();
      return;
    }
    const rawBody = await readBody(req);
    if (rawBody === null) {
      res.writeHead(413, { "content-type": "text/plain; charset=utf-8", ...cors });
      res.end("payload too large");
      return;
    }
    const fields = new URLSearchParams(rawBody.toString("utf8"));
    const email = (fields.get("email") ?? "").trim().toLowerCase();
    const next = sanitizeNext(fields.get("next"), cfg);
    const kind = cfg.owners.includes(email)
      ? ("owner" as const)
      : cfg.staff.includes(email)
        ? ("staff" as const)
        : cfg.clients.includes(email)
          ? ("client" as const)
          : null;
    if (kind === null || email.length === 0) {
      writeHtml(res, 401, signInPageHtml(next, "That address is not in the local development roster.", cfg), cors);
      return;
    }
    const token = signSessionToken(
      {
        email,
        exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
        jti: randomBytes(16).toString("hex"),
      },
      cfg.secret,
    );
    const cookie = [
      `${SESSION_COOKIE}=${token}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${SESSION_TTL_SECONDS}`,
      cfg.secureCookies ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");
    // Set the cookie, then send the browser back to the site workspace —
    // the page's own identity check on load will find the session there.
    res.writeHead(302, { Location: next, "Set-Cookie": cookie, ...cors });
    res.end();
    return;
  }

  if (pathname === "/dev/auth/login") {
    if (method !== "POST") {
      writeJson(res, 405, { error: "method-not-allowed" }, { Allow: "POST, OPTIONS", ...cors });
      return;
    }
    const raw = await readBody(req);
    if (raw === null) {
      writeJson(res, 413, { error: "payload-too-large" }, cors);
      return;
    }
    let email = "";
    try {
      const data: unknown = raw.length > 0 ? JSON.parse(raw.toString("utf8")) : null;
      email = String((data as { email?: unknown } | null)?.email ?? "").trim().toLowerCase();
    } catch {
      email = "";
    }
    const kind = cfg.owners.includes(email)
      ? ("owner" as const)
      : cfg.staff.includes(email)
        ? ("staff" as const)
        : cfg.clients.includes(email)
          ? ("client" as const)
          : null;
    if (kind === null || email.length === 0) {
      // Deliberately generic: does not reveal which roster holds whom.
      writeJson(
        res,
        401,
        {
          error: "invalid-credentials",
          message: "The supplied identity is not in the local development roster.",
        },
        cors,
      );
      return;
    }
    const token = signSessionToken(
      {
        email,
        exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
        jti: randomBytes(16).toString("hex"),
      },
      cfg.secret,
    );
    const cookie = [
      `${SESSION_COOKIE}=${token}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${SESSION_TTL_SECONDS}`,
      cfg.secureCookies ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");
    res.writeHead(204, { "Set-Cookie": cookie, ...cors });
    res.end();
    return;
  }

  if (pathname === "/dev/auth/logout") {
    // Invalidate the session SERVER-side, not just in this browser: a
    // signed-out jti is refused from now on (even though the token itself
    // would still verify until its 12 h expiry).
    const session = sessionFromRequest(req, cfg, revoked);
    if (session !== null && session.jti !== undefined) {
      rememberRevocation(revoked, session.jti, session.exp);
    }
    const cleared = `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
    res.writeHead(204, { "Set-Cookie": cleared, ...cors });
    res.end();
    return;
  }

  if (pathname === "/dev/auth/me") {
    if (method !== "GET" && method !== "HEAD") {
      writeJson(res, 405, { error: "method-not-allowed" }, { Allow: "GET, HEAD, OPTIONS", ...cors });
      return;
    }
    const session = sessionFromRequest(req, cfg, revoked);
    if (session === null) {
      writeJson(res, 401, { error: "no-session" }, cors);
      return;
    }
    // A session stops working as soon as its roster entry disappears —
    // revocation is "edit the file", and the shared policy is untouched.
    const kind = cfg.owners.includes(session.email)
      ? ("owner" as const)
      : cfg.staff.includes(session.email)
        ? ("staff" as const)
        : cfg.clients.includes(session.email)
          ? ("client" as const)
          : null;
    if (kind === null) {
      writeJson(res, 401, { error: "no-session" }, cors);
      return;
    }
    writeJson(res, 200, { email: session.email, kind, source: "local-development" }, cors);
    return;
  }

  // ---- Health + the agent surface: delegate to the SAME production handler
  if (pathname === "/health" || isAgent) {
    const session = sessionFromRequest(req, cfg, revoked);
    const access = localAccess(session);
    const needsBody = method !== "GET" && method !== "HEAD";
    let body: Buffer | null | undefined = undefined;
    if (needsBody) {
      body = await readBody(req);
      if (body === null) {
        writeJson(res, 413, { error: "payload-too-large" }, cors);
        return;
      }
    }
    const request = new Request(
      `http://${req.headers.host ?? "127.0.0.1:3300"}${req.url ?? "/"}`,
      {
        method,
        headers: {
          ...(req.headers["content-type"] ? { "content-type": String(req.headers["content-type"]) } : {}),
          ...(req.headers.origin ? { origin: String(req.headers.origin) } : {}),
          ...(req.headers.referer ? { referer: String(req.headers.referer) } : {}),
        },
        body: body && body.length > 0 ? (body as unknown as BodyInit) : undefined,
      },
    );
    const web = await handleAgentRequest(request, handlerEnv(cfg), access, handlerOpts);
    await bridgeWebResponse(res, web);
    return;
  }

  writeJson(res, 404, { error: "not-found" }, cors);
}

/** CLI entry: `npm run dev:agent` (or `node worker/local/server.ts`). */
if (typeof process !== "undefined" && process.argv[1]?.endsWith("server.ts")) {
  const cfg = loadLocalDevConfig();
  startLocalAgentServer({
    host: cfg.host,
    port: parseCliPort(),
    secureCookies: cfg.secureCookies,
    secret: cfg.secret,
    owners: cfg.owners,
    staff: cfg.staff,
    clients: cfg.clients,
    origins: cfg.origins,
    usersFile: cfg.usersFile,
  })
    .then((s) => {
      console.log("MAP Holding Business Agent — local development server");
      console.log(`  listening:   ${s.url} (loopback only)`);
      console.log(
        `  roster file: ${cfg.usersFile} (${cfg.owners.length} owner(s), ${cfg.staff.length} staff, ${cfg.clients.length} client)`,
      );
      if (cfg.owners.length + cfg.staff.length + cfg.clients.length === 0) {
        console.log("  no roster entries: nobody can sign in. Copy the template:");
        console.log("    cp worker/local/dev-users.example.json worker/local/dev-users.json");
      }
      console.log(`  sign in:     POST ${s.url}/dev/auth/login {"email":"<rostered address>"}`);
      console.log(
        `  sign in page: ${s.url}/dev/signin (browser flow — returns to the site workspace)`,
      );
      console.log(
        `  agnes:       ${process.env.AGNES_API_KEY && process.env.AGNES_BASE_URL ? "configured — live replies possible" : "NOT configured — chat reports the unconfigured state honestly"}`,
      );
      console.log("  development only — this server refuses to run with NODE_ENV=production.");
    })
    .catch((err: unknown) => {
      console.error("local agent server failed to start:", err instanceof Error ? err.message : String(err));
      process.exitCode = 1;
    });
}

function parseCliPort(): number {
  const value = process.env.MH_AGENT_DEV_PORT;
  const n = value ? Number.parseInt(value, 10) : NaN;
  return Number.isInteger(n) && n > 0 && n < 65536 ? n : 3300;
}
