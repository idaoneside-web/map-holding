/**
 * MAP HOLDING — BUSINESS AGENT: service client (Phase 3).
 *
 * A thin, typed client for the Business Agent Worker. Rules it enforces:
 *
 *   - The worker origin is NEVER invented: it comes from the static
 *     `public/agent-config.json` shipped with the site. While that file says
 *     `null`, no request to the worker is ever made and the UI shows the
 *     not-configured state.
 *   - Development-only local override: `public/agent-config.local.json`
 *     (gitignored, so it is NEVER present in production builds) wins when
 *     it exists and carries a valid origin. This is the sanctioned way to
 *     point the local site at `http://127.0.0.1:3300` without touching the
 *     committed production configuration.
 *   - `credentials: "include"` so a Cloudflare Access session (cookie scoped
 *     to the worker's hostname) can ride cross-origin requests; the worker's
 *     CORS gate already answers credentials-capable for the confirmed
 *     website origin and fail-closed for everyone else.
 *   - Only structured results are returned. Upstream bodies, headers and
 *     error objects never surface; the UI renders friendly states from the
 *     codes below. No response here ever proves identity on its own —
 *     identity is whatever the worker's Access-verified boundary reported.
 */

import type { ChatRole } from "@/lib/agent/conversations";
import type { ProjectStatus } from "@/content/projects";

/** Mirrors exactly the fields the worker serializes for a record — nothing
 * more, nothing invented. */
export interface AgentProjectRecord {
  readonly ref: string;
  readonly name: string;
  readonly location: string;
  readonly sector: string;
  readonly status: ProjectStatus;
  readonly description?: string;
}

export interface AgentServiceConfig {
  readonly workerBaseUrl: string | null;
  /** True when a dev-only local override file supplied the origin. */
  readonly fromLocalOverride?: boolean;
}

/** Reads one static config file and returns its raw `workerBaseUrl` (or null). */
async function readConfigFile(path: string): Promise<string | null> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) return null;
  const data: unknown = await res.json();
  const base =
    typeof data === "object" && data !== null ? (data as { workerBaseUrl?: unknown }).workerBaseUrl : null;
  if (typeof base !== "string" || base.length === 0) return null;
  return base;
}

/** Validates + normalises a candidate origin. Returns null when the origin
 * is not one the UI is allowed to talk to. */
function normaliseOrigin(raw: string): string | null {
  const origin = raw.replace(/\/+$/, "");
  // Production: an https origin only.
  if (origin.startsWith("https://")) return origin;
  // Local-development exception, explicit and narrow: the loopback local
  // authentication/agent server (`npm run dev:agent`) is http-only by
  // design. Nothing else is accepted — no arbitrary http URL ever gets
  // configured, and the committed config value stays null unless the
  // developer deliberately sets one locally.
  if (/^http:\/\/(127\.0\.0\.1|localhost)(:\d{2,5})?$/.test(origin)) {
    return origin;
  }
  return null;
}

/** The static deployment-time configuration, with a dev-only local override. */
export async function loadAgentServiceConfig(): Promise<AgentServiceConfig> {
  try {
    // Development-only: a gitignored override file, if present, wins. In a
    // production build the file cannot exist (it is not committed), so the
    // request is skipped entirely — production never 404s on it and the
    // committed configuration below applies.
    if (process.env.NODE_ENV !== "production") {
      try {
        const localRaw = await readConfigFile("/agent-config.local.json");
        if (localRaw !== null) {
          const localOrigin = normaliseOrigin(localRaw);
          if (localOrigin !== null) {
            return { workerBaseUrl: localOrigin, fromLocalOverride: true };
          }
        }
      } catch {
        /* no local override available — fall through to the committed config */
      }
    }

    const committedRaw = await readConfigFile("/agent-config.json");
    if (committedRaw === null) return { workerBaseUrl: null };
    return { workerBaseUrl: normaliseOrigin(committedRaw) };
  } catch {
    return { workerBaseUrl: null };
  }
}

export type IdentityStatus =
  | { state: "unauthenticated" }
  | { state: "unapproved"; id: string }
  | { state: "authenticated"; kind: "owner" | "staff"; id: string; organisation: string }
  | { state: "network" };

/** GET /agent/identity on the worker. Maps worker codes, nothing more. */
export async function checkAgentIdentity(baseUrl: string): Promise<IdentityStatus> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/agent/identity`, {
      method: "GET",
      credentials: "include",
      headers: { accept: "application/json" },
    });
  } catch {
    return { state: "network" };
  }
  if (res.status === 401) return { state: "unauthenticated" };
  if (res.status === 403) {
    let id = "";
    try {
      const body: unknown = await res.json();
      id = typeof (body as { id?: unknown })?.id === "string" ? (body as { id: string }).id : "";
    } catch {
      /* body optional: the 403 stands on its own */
    }
    return { state: "unapproved", id };
  }
  if (res.status === 200) {
    const body: unknown = await res.json().catch(() => null);
    const b = body as { kind?: unknown; id?: unknown; organisation?: unknown } | null;
    if (b && (b.kind === "owner" || b.kind === "staff") && typeof b.id === "string") {
      return {
        state: "authenticated",
        kind: b.kind,
        id: b.id,
        organisation: String(b.organisation ?? "map-holding"),
      };
    }
    return { state: "network" };
  }
  return { state: "network" };
}

export type ChatError =
  "model-unconfigured" | "model-error" | "model-timeout" | "authentication" | "network";

export type SendResult =
  { ok: true; reply: string; model: string } | { ok: false; error: ChatError; detail?: string };

/** POST /agent/chat. `messages` must end with a user message. */
export async function sendAgentChat(
  baseUrl: string,
  messages: Array<{ role: ChatRole; content: string }>,
): Promise<SendResult> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/agent/chat`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ messages }),
    });
  } catch {
    return { ok: false, error: "network" };
  }
  const body: unknown = await res.json().catch(() => null);
  const b = body as {
    ok?: unknown;
    reply?: unknown;
    model?: unknown;
    error?: unknown;
    reason?: unknown;
    detail?: unknown;
  } | null;
  if (res.status === 200 && b && b.ok === true && typeof b.reply === "string") {
    return { ok: true, reply: b.reply, model: String(b.model ?? "") };
  }
  if (res.status === 401) return { ok: false, error: "authentication" };
  if (res.status === 503 && b?.reason === "model-unconfigured") {
    return { ok: false, error: "model-unconfigured" };
  }
  if (res.status === 504)
    return { ok: false, error: "model-timeout", detail: String(b?.detail ?? "") };
  if (res.status === 502)
    return { ok: false, error: "model-error", detail: String(b?.detail ?? "") };
  return { ok: false, error: "network", detail: `http-${res.status}` };
}

/* --- Sign-in / sign-out ---------------------------------------------------- */

/** True for the narrow local-development loopback origin only. */
export function isLoopbackAgentBase(baseUrl: string): boolean {
  return /^http:\/\/(127\.0\.0\.1|localhost)(:\d{2,5})?$/.test(baseUrl);
}

/** Where the local sign-in flow returns the browser after success.
 * The local session cookie lives on the 127.0.0.1 host, and browsers do
 * not carry a SameSite=Lax cookie from a localhost page to a
 * 127.0.0.1 service — so the return URL always uses 127.0.0.1 with the
 * site's current port. */
function loopbackSignInReturn(): string {
  if (typeof window === "undefined") return "http://127.0.0.1:3000/internal";
  const port = window.location.port || "3000";
  const hash = window.location.hash === "#agent" ? "#agent" : "";
  return `http://127.0.0.1:${port}/internal${hash}`;
}

/** The sign-in URL for the configured service. Local (loopback) services
 * have a real browser sign-in page; production (https) services are signed
 * in through Cloudflare Access at the edge, so the service root is opened. */
export function buildAgentSignInUrl(baseUrl: string | null): string | null {
  if (baseUrl === null || baseUrl.length === 0) return null;
  if (!isLoopbackAgentBase(baseUrl)) return baseUrl;
  return `${baseUrl}/dev/signin?next=${encodeURIComponent(loopbackSignInReturn())}`;
}

/** Signs out of the LOCAL session: the service revokes the session on its
 * side and the browser cookie is cleared, so the next identity check must
 * report "not signed in". Production (https) services sign out through
 * Cloudflare Access instead, so this only applies to the loopback origin. */
export async function agentSignOut(baseUrl: string | null): Promise<void> {
  if (baseUrl === null || !isLoopbackAgentBase(baseUrl)) return;
  try {
    await fetch(`${baseUrl}/dev/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Unreachable service: the session will simply not be found on the
    // next check; there is nothing to invalidate here.
  }
}

/* --- Read-only Projects capability ---------------------------------------- */

export type ProjectsResult =
  | { readonly ok: true; readonly projects: readonly AgentProjectRecord[] }
  | {
      readonly ok: false;
      readonly code: "authentication" | "unapproved" | "http" | "network";
      readonly detail?: string;
    };

const KNOWN_STATUSES: ReadonlySet<string> = new Set(["AVAILABLE", "UNDER REVIEW", "COMING SOON"]);

/** GET /agent/projects. Only well-formed records (exactly the serialized
 * fields, known status values) are accepted; anything else degrades to an
 * http failure rather than rendering unknown content. */
export async function loadAgentProjects(baseUrl: string): Promise<ProjectsResult> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/agent/projects`, {
      method: "GET",
      credentials: "include",
      headers: { accept: "application/json" },
    });
  } catch {
    return { ok: false, code: "network" };
  }
  if (res.status === 401) return { ok: false, code: "authentication" };
  if (res.status === 403) return { ok: false, code: "unapproved" };
  if (res.status !== 200) return { ok: false, code: "http", detail: `http-${res.status}` };

  const body: unknown = await res.json().catch(() => null);
  const list = (body as { projects?: unknown } | null)?.projects;
  if (!Array.isArray(list)) return { ok: false, code: "http", detail: "unexpected-response-shape" };

  const projects: AgentProjectRecord[] = [];
  for (const item of list) {
    if (typeof item !== "object" || item === null) {
      return { ok: false, code: "http", detail: "malformed-record" };
    }
    const r = item as Record<string, unknown>;
    const status = r.status;
    if (
      typeof r.ref !== "string" ||
      typeof r.name !== "string" ||
      typeof r.location !== "string" ||
      typeof r.sector !== "string" ||
      typeof status !== "string" ||
      !KNOWN_STATUSES.has(status)
    ) {
      return { ok: false, code: "http", detail: "malformed-record" };
    }
    const base: AgentProjectRecord = {
      ref: r.ref,
      name: r.name,
      location: r.location,
      sector: r.sector,
      status: status as ProjectStatus,
    };
    const record: AgentProjectRecord =
      typeof r.description === "string" && r.description.length > 0
        ? { ...base, description: r.description }
        : base;
    projects.push(record);
  }
  return { ok: true, projects };
}
