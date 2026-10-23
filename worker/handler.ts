/**
 * ============================================================================
 * MAP HOLDING — BUSINESS AGENT WORKER: REQUEST HANDLER  (Phase 1 + 2)
 * ============================================================================
 *
 * A pure request router with no data access, no tools, no model calls and no
 * credential handling. The exact same code runs under the Cloudflare Workers
 * runtime and under plain Node in the test suite.
 *
 * Identity (Phase 2):
 *   - Identity is derived ONLY from the native Cloudflare Access context
 *     (`ctx.access`, see worker/identity.ts). It is a runtime object set by
 *     Cloudflare after edge-side Access authentication — it is NOT an HTTP
 *     header, and client-supplied headers cannot forge it.
 *   - E-mail, role, entitlement or user-id values supplied in request bodies
 *     or ordinary client headers are NEVER read: this handler accepts no
 *     input of any kind, and a Bearer/Authorization header changes nothing.
 *
 * Endpoints:
 *   - GET /health       → 200 minimal status JSON. No secrets, no roster
 *                         state, no company data.
 *   - GET /agent/identity → 401 unauthenticated · 403 signed-in-unapproved ·
 *                         200 approved (principal descriptor; operations:
 *                         advisory-chat only).
 *   - POST /agent/chat  → the single registered capability (`advisory-chat`):
 *                         approved principals only; validated body; the
 *                         model call happens server-side (worker/model.ts) —
 *                         no credentials, upstream error bodies or internal
 *                         details ever reach the client. Unconfigured model
 *                         ⇒ 503 "model-unconfigured".
 *   - GET  /client-agent/identity · POST /client-agent/chat → the CLIENT
 *                         assistant surface. Same edge-verified identity,
 *                         but the CLIENTS roster and a structurally smaller
 *                         principal: no organisation, no internal clearance,
 *                         no internal data of any kind. Advisory-only chat
 *                         with the client-scoped system prompt; unconfigured
 *                         model ⇒ the same honest 503 state.
 *   - other /agent/*    → same 401/403 when identity is missing or unapproved;
 *                         404 "operation-unavailable" for approved callers
 *                         (no other operations are registered).
 *   - OPTIONS           → 204 preflight, same origin gate as simple requests.
 *   - everything else   → 404. Non-GET/HEAD on /health → 405.
 *
 * CORS — fail closed, exact-match allow-list only, credentials-capable:
 *   - The confirmed website origin is https://map-holding.vercel.app
 *     (owner-confirmed, Phase 2); it is the compiled DEFAULT allow-list.
 *   - `ALLOWED_ORIGINS` (when set) replaces the default. `*` entries are
 *     filtered: a wildcard is never honoured and never emitted.
 *   - Listed origins additionally get `Access-Control-Allow-Credentials:
 *     true` so a Cloudflare Access session (cookie scoped to the worker's
 *     hostname) can ride cross-origin requests from the website.
 *
 * Request bodies: only `POST /agent/chat` reads one, and it is hard-capped
 * (64 KB payload, bounded message count/length, restricted roles) before any
 * parsing. No other endpoint accepts input.
 */

import type { AgentEnv } from "./env.ts";
import {
  resolveClientPrincipal,
  resolvePrincipal,
  type AccessCtx,
  type ResolvedClientPrincipal,
  type ResolvedPrincipal,
} from "./identity.ts";
import {
  authorizeAgentAction,
  CLIENT_AGENT_OPERATIONS,
  principal,
  type AccessContext,
  type AccessControlledResource,
  type Principal,
} from "./policy.ts";
import { liveModelClient, type ChatMessage, type ModelClient } from "./model.ts";
import { PROJECTS } from "../src/content/projects.ts";

const SERVICE = "map-holding-business-agent";
const METHOD_ALLOW = "GET, HEAD, OPTIONS";
const PREFLIGHT_METHODS = "GET, HEAD, POST, OPTIONS";

/** Hard caps for the single chat payload. Bounded before parsing. */
const MAX_BODY_BYTES = 64 * 1024;
const MAX_CHAT_MESSAGES = 60;
const MAX_CHAT_MESSAGE_CHARS = 4000;

/** Owner-confirmed production origin of the public MAP Holding website.
 * Applied as the compiled CORS default when `ALLOWED_ORIGINS` is unset. */
export const CONFIRMED_WEBSITE_ORIGIN = "https://map-holding.vercel.app";

/** Parses the space-separated exact-origin allow-list. Unset ⇒ the confirmed
 * default; wildcard entries are always dropped. Empty result ⇒ nobody. */
function allowedOrigins(env: AgentEnv): readonly string[] {
  const raw = (env.ALLOWED_ORIGINS ?? "").trim();
  const list = raw.length > 0 ? raw.split(/\s+/) : [CONFIRMED_WEBSITE_ORIGIN];
  return list.filter((o) => o.length > 0 && o !== "*");
}

/**
 * CORS headers for one request. Only an origin that is EXACTLY listed in
 * `ALLOWED_ORIGINS` gets them; anything else gets none (fail closed).
 */
function corsHeaders(request: Request, env: AgentEnv): Record<string, string> {
  const origin = request.headers.get("origin");
  if (origin !== null && allowedOrigins(env).includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      // Credentials-capable: lets the Cloudflare Access session cookie
      // (scoped to the worker's hostname) ride cross-origin requests from
      // the website. Wildcards are impossible here, so this is safe.
      "Access-Control-Allow-Credentials": "true",
      Vary: "Origin",
      "Access-Control-Allow-Methods": PREFLIGHT_METHODS,
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    };
  }
  return {};
}

function json(body: unknown, status: number, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...extraHeaders },
  });
}

export interface AgentHandlerOptions {
  /** Injectable model client for tests. Defaults to the live Agnes client. */
  readonly modelClient?: ModelClient;
}

export async function handleAgentRequest(
  request: Request,
  env: AgentEnv,
  access?: AccessCtx | null,
  opts?: AgentHandlerOptions,
): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  // Preflight. Same origin gate as a simple request: an unknown origin gets a
  // plain 204 with no CORS headers, so the browser's preflight fails closed.
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { Allow: PREFLIGHT_METHODS, ...corsHeaders(request, env) },
    });
  }

  if (url.pathname === "/health") {
    if (method === "GET" || method === "HEAD") {
      // Deliberately minimal: service identity + phase + what is NOT wired.
      // No binding names, no secret values, no roster state, no company info.
      return json(
        {
          service: SERVICE,
          status: "ok",
          phase: "first-capability",
          authentication: "cloudflare-access-pending",
          agent: "advisory-chat",
          business_operations: ["advisory-chat", "projects-list"],
        },
        200,
        corsHeaders(request, env),
      );
    }
    return json({ error: "method-not-allowed" }, 405, {
      Allow: METHOD_ALLOW,
      ...corsHeaders(request, env),
    });
  }

  // CLIENT assistant surface. Verified by the SAME edge Access context, but
  // a different roster (CLIENTS) and a structurally smaller principal: no
  // organisation mapping, no internal clearance — and this surface exposes
  // no internal data of any kind (no project records, no rosters, no env
  // values). Listing on the CLIENTS roster never changes the /agent tiers.
  if (url.pathname === "/client-agent" || url.pathname.startsWith("/client-agent/")) {
    const cors = corsHeaders(request, env);
    const resolved: ResolvedClientPrincipal = await resolveClientPrincipal(
      access ?? undefined,
      env,
    );

    if (resolved.status === "unauthenticated") {
      return json(
        {
          error: "authentication-required",
          reason: "no-access-identity",
          message:
            "This service verifies identity through Cloudflare Access at the edge. No credentials, e-mails or roles supplied in headers or bodies are read.",
        },
        401,
        cors,
      );
    }

    if (resolved.status === "signed-in-unapproved") {
      return json(
        {
          error: "identity-not-approved",
          reason: "no-mapped-role",
          id: resolved.id,
          message:
            "You are signed in through Cloudflare Access, but your identity is not on an approved client roster. Signing in grants no role and no data access.",
        },
        403,
        cors,
      );
    }

    if (url.pathname === "/client-agent/identity") {
      if (method !== "GET" && method !== "HEAD") {
        return json({ error: "method-not-allowed" }, 405, {
          Allow: "GET, HEAD, OPTIONS",
          ...cors,
        });
      }
      return json(
        {
          kind: resolved.kind,
          id: resolved.id,
          approved: true,
          granted_operations: [...CLIENT_AGENT_OPERATIONS],
        },
        200,
        cors,
      );
    }

    if (url.pathname === "/client-agent/chat") {
      // Same hard caps and validation as the internal chat; client-scoped
      // prompt; identical honest outcome states. No company data is bound,
      // so there is nothing for this scope to leak.
      if (method !== "POST") {
        return json({ error: "method-not-allowed" }, 405, {
          Allow: "POST, OPTIONS",
          ...cors,
        });
      }

      const raw = await request.text();
      if (raw.length > MAX_BODY_BYTES) {
        return json({ error: "payload-too-large" }, 413, cors);
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return json({ error: "invalid-json" }, 400, cors);
      }

      const messages = validateChatMessages(parsed);
      if (messages === null) {
        return json(
          {
            error: "invalid-messages",
            reason:
              "expected { messages: [ { role: 'user'|'assistant', content: string } ] } — " +
              `at most ${MAX_CHAT_MESSAGES} messages, ${MAX_CHAT_MESSAGE_CHARS} characters each, ending with a user message`,
          },
          400,
          cors,
        );
      }

      const outcome = await (opts?.modelClient ?? liveModelClient)(env, messages, "client");
      if (outcome.ok) {
        return json({ ok: true, model: outcome.model, reply: outcome.reply }, 200, cors);
      }
      if (outcome.reason === "model-unconfigured") {
        return json(
          {
            error: "agent-unavailable",
            reason: "model-unconfigured",
            message:
              "The agent service is reachable, but its model credential and endpoint are not configured on the server yet. No response can be generated until the owner completes that setup.",
          },
          503,
          cors,
        );
      }
      return json(
        {
          error: "agent-unavailable",
          reason: outcome.reason,
          detail: outcome.detail,
          message:
            outcome.reason === "model-timeout"
              ? "The model did not answer within the time limit. Try again."
              : "The model provider request failed. Your message was not lost — resend it.",
        },
        outcome.reason === "model-timeout" ? 504 : 502,
        cors,
      );
    }

    return json(
      {
        error: "operation-unavailable",
        reason: "no-operations-registered",
        message: "No operation is registered for this path. Registered operations: client-advisory-chat.",
      },
      404,
      cors,
    );
  }

  // Protected surface. Identity comes ONLY from the native Cloudflare Access
  // context (edge-verified, unforgeable from client headers); see identity.ts.
  // Three tiers, in order:
  //   unauthenticated            → 401 authentication-required
  //   signed in, not on a roster → 403 identity-not-approved (signing in
  //                                 grants no role; rosters default empty)
  //   approved (owner|staff)     → /agent/identity 200 descriptor; any other
  //                                 /agent/* 404 operation-unavailable (no
  //                                 operations are registered in this phase)
  if (url.pathname === "/agent" || url.pathname.startsWith("/agent/")) {
    const cors = corsHeaders(request, env);
    const resolved: ResolvedPrincipal = await resolvePrincipal(access ?? undefined, env);

    if (resolved.status === "unauthenticated") {
      return json(
        {
          error: "authentication-required",
          reason: "no-access-identity",
          message:
            "This service verifies identity through Cloudflare Access at the edge. No credentials, e-mails or roles supplied in headers or bodies are read.",
        },
        401,
        cors,
      );
    }

    if (resolved.status === "signed-in-unapproved") {
      // `id` is the requester's own verified e-mail claim: it tells the
      // signed-in person WHICH address is not approved, without disclosing
      // anything about anyone else or about the rosters.
      return json(
        {
          error: "identity-not-approved",
          reason: "no-mapped-role",
          id: resolved.id,
          message:
            "You are signed in through Cloudflare Access, but your identity is not on an approved roster. Signing in grants no role and no data access.",
        },
        403,
        cors,
      );
    }

    if (url.pathname === "/agent/identity") {
      // Least-possible success payload: who you are, mapped to what.
      // Never roster contents, never other identities.
      return json(
        {
          kind: resolved.kind,
          id: resolved.id,
          organisation: resolved.organisationId,
          approved: true,
          granted_operations: ["advisory-chat", "projects-list"],
        },
        200,
        cors,
      );
    }

    if (url.pathname === "/agent/projects") {
      // Read-only `projects-list` capability. The roster tiers above already
      // enforced 401/403. Records come from the single authoritative source
      // (`src/content/projects.ts`, imported — never duplicated), and every
      // record decision runs through the shared policy chokepoint below:
      // only resources the policy allows are serialized; nothing else — no
      // filesystem paths, no env values, no unrelated content.
      if (method !== "GET" && method !== "HEAD") {
        return json({ error: "method-not-allowed" }, 405, {
          Allow: "GET, HEAD, OPTIONS",
          ...cors,
        });
      }

      const context: AccessContext = { now: new Date().toISOString() };
      const who = principal(resolved.kind, resolved.id, {
        organisationId: resolved.organisationId,
      });
      const projects = authorizedProjectRecords(who, context);

      return json(
        { ok: true, operation: "projects-list", count: projects.length, projects },
        200,
        cors,
      );
    }

    if (url.pathname === "/agent/chat") {
      // The single registered capability: advisory chat. Approved principals
      // only (the tiers above already enforced 401/403). Everything the
      // model may know comes from this validated payload and the fixed
      // system prompt — never from company data (none is bound) and never
      // from the environment (credentials stay inside the model client).
      if (method !== "POST") {
        return json({ error: "method-not-allowed" }, 405, {
          Allow: "POST, OPTIONS",
          ...cors,
        });
      }

      const raw = await request.text();
      if (raw.length > MAX_BODY_BYTES) {
        return json({ error: "payload-too-large" }, 413, cors);
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return json({ error: "invalid-json" }, 400, cors);
      }

      const messages = validateChatMessages(parsed);
      if (messages === null) {
        return json(
          {
            error: "invalid-messages",
            reason:
              "expected { messages: [ { role: 'user'|'assistant', content: string } ] } — " +
              `at most ${MAX_CHAT_MESSAGES} messages, ${MAX_CHAT_MESSAGE_CHARS} characters each, ending with a user message`,
          },
          400,
          cors,
        );
      }

      // Internal chat retrieves the authorized records through the SAME
      // policy-gated helper the /agent/projects endpoint uses: the model may
      // state only what the shared access policy allows this principal to
      // see. The client surface never builds or receives this context.
      const context: AccessContext = { now: new Date().toISOString() };
      const who = principal(resolved.kind, resolved.id, {
        organisationId: resolved.organisationId,
      });
      const projectContext = projectContextBlock(authorizedProjectRecords(who, context));

      const outcome = await (opts?.modelClient ?? liveModelClient)(env, messages, "owner", projectContext);
      if (outcome.ok) {
        return json({ ok: true, model: outcome.model, reply: outcome.reply }, 200, cors);
      }
      if (outcome.reason === "model-unconfigured") {
        return json(
          {
            error: "agent-unavailable",
            reason: "model-unconfigured",
            message:
              "The agent service is reachable, but its model credential and endpoint are not configured on the server yet. No response can be generated until the owner completes that setup.",
          },
          503,
          cors,
        );
      }
      return json(
        {
          error: "agent-unavailable",
          reason: outcome.reason,
          detail: outcome.detail,
          message:
            outcome.reason === "model-timeout"
              ? "The model did not answer within the time limit. Try again."
              : "The model provider request failed. Your message was not lost — resend it.",
        },
        outcome.reason === "model-timeout" ? 504 : 502,
        cors,
      );
    }

    return json(
      {
        error: "operation-unavailable",
        reason: "no-operations-registered",
        message:
          "No operation is registered for this path. Registered operations: advisory-chat, projects-list.",
      },
      404,
      cors,
    );
  }

  // Never echo the requested path back: least-information responses only.
  return json({ error: "not-found" }, 404, corsHeaders(request, env));
}

/** Exactly the published fields of one record — the single projection the
 * worker may serialize. No description key unless one exists. */
export interface ApprovedProjectRecord {
  readonly ref: string;
  readonly name: string;
  readonly location: string;
  readonly sector: string;
  readonly status: string;
  readonly description?: string;
}

/**
 * The one place the approved-records read happens: source records from
 * `src/content/projects.ts` (imported, never duplicated) filtered through the
 * shared policy (`authorizeAgentAction`), projected to exactly the published
 * fields. Both the `/agent/projects` endpoint AND the internal chat context
 * use this helper, so the two can never drift apart or widen.
 */
export function authorizedProjectRecords(
  who: Principal,
  context: AccessContext,
): ApprovedProjectRecord[] {
  const out: ApprovedProjectRecord[] = [];
  for (const record of PROJECTS) {
    const resource: AccessControlledResource = {
      kind: "project",
      id: record.ref,
      visibility: "public",
      ownerOrganisationId: "map-holding",
    };
    if (!authorizeAgentAction(who, resource, context).allowed) continue;
    const base: ApprovedProjectRecord = {
      ref: record.ref,
      name: record.name,
      location: record.location,
      sector: record.sector,
      status: record.status,
    };
    const item: ApprovedProjectRecord =
      record.description && record.description.length > 0
        ? { ...base, description: record.description }
        : base;
    out.push(item);
  }
  return out;
}

/** Renders the authorized records as the deterministic context block the
 * internal chat model receives. Trusted local source only — never user
 * input. The client surface never calls this. */
export function projectContextBlock(records: readonly ApprovedProjectRecord[]): string {
  if (records.length === 0) {
    return "No project records are currently authorized for this principal.";
  }
  const lines = records.map(
    (r) =>
      `- ${r.ref} — ${r.name} · ${r.sector} · ${r.location} · ${r.status}` +
      (r.description ? ` · ${r.description}` : ""),
  );
  return (
    "APPROVED PROJECT RECORDS (read-only; the only project facts you may state):\n" +
    lines.join("\n") +
    "\nState only what these records contain. Where a record has no detail, say none is " +
    "supplied. Never invent projects, figures, dates or other details."
  );
}

/** Strict validation of a chat payload. Returns the cleaned messages, or
 * null when the shape is not exactly what the model boundary accepts. */
function validateChatMessages(parsed: unknown): ChatMessage[] | null {
  if (typeof parsed !== "object" || parsed === null) return null;
  const candidate = (parsed as { messages?: unknown }).messages;
  if (!Array.isArray(candidate) || candidate.length === 0) return null;
  if (candidate.length > MAX_CHAT_MESSAGES) return null;

  const out: ChatMessage[] = [];
  for (const item of candidate) {
    if (typeof item !== "object" || item === null) return null;
    const entry = item as { role?: unknown; content?: unknown };
    if (entry.role !== "user" && entry.role !== "assistant") return null;
    if (typeof entry.content !== "string") return null;
    const content = entry.content.trim();
    if (content.length === 0) return null;
    out.push({ role: entry.role, content: content.slice(0, MAX_CHAT_MESSAGE_CHARS) });
  }
  // A conversation must end with something to answer.
  if (out[out.length - 1].role !== "user") return null;
  return out;
}
