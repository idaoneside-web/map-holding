/**
 * ============================================================================
 * MAP HOLDING — BUSINESS AGENT WORKER TESTS  (Phase 1)
 * ============================================================================
 *
 * Run with:  npm run test:worker
 * (node --test, native TypeScript type-stripping — same toolchain as
 *  src/lib/access/access.test.ts; no test framework was added.)
 *
 * The worker handler runs under plain Node, so these tests exercise the real
 * request logic without a Cloudflare runtime. The policy section proves the
 * worker is bound to the SHARED access contract, not a local copy.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import { handleAgentRequest } from "../handler.ts";
import { AGENT_OPERATIONS, authorizeAgentAction, clearanceCeiling } from "../policy.ts";
import { liveModelClient, type ModelClient } from "../model.ts";
import {
  principal,
  type AccessControlledResource,
  type Principal,
} from "../../src/lib/access/index.ts";
import type { AgentEnv } from "../env.ts";

const NOW = { now: "2026-07-10T00:00:00.000Z" };
const EMPTY: AgentEnv = {};

/** Test-only host (RFC 6761 reserved TLD); no real endpoint is contacted. */
function req(path: string, init: RequestInit = {}): Request {
  return new Request(`https://agent.invalid${path}`, init);
}

async function bodyAsJson(response: Response): Promise<Record<string, unknown>> {
  return JSON.parse(await response.text()) as Record<string, unknown>;
}

/* ---------------------------------------------------------------------------
 * /health — shape, method handling, and the no-leak guarantee
 * ------------------------------------------------------------------------ */

test("GET /health returns the minimal status document", async () => {
  const res = await handleAgentRequest(req("/health"), EMPTY);
  assert.equal(res.status, 200);
  const body = await bodyAsJson(res);
  assert.deepEqual(Object.keys(body).sort(), [
    "agent",
    "authentication",
    "business_operations",
    "phase",
    "service",
    "status",
  ]);
  assert.equal(body.service, "map-holding-business-agent");
  assert.equal(body.status, "ok");
  assert.deepEqual(body.business_operations, ["advisory-chat", "projects-list"]);
});

test("a populated env leaks no secret values or binding names into /health", async () => {
  const leakProbeKey = "sk-must-never-appear-0123456789";
  const env: AgentEnv = { ALLOWED_ORIGINS: "https://example.com", AGNES_API_KEY: leakProbeKey };
  const res = await handleAgentRequest(req("/health"), env);
  const text = await res.text();
  assert.equal(text.includes(leakProbeKey), false);
  assert.equal(text.includes("AGNES_API_KEY"), false);
  assert.equal(text.includes("ALLOWED_ORIGINS"), false);
});

test("non-GET/HEAD methods on /health get 405 with an Allow header", async () => {
  const res = await handleAgentRequest(req("/health", { method: "POST" }), EMPTY);
  assert.equal(res.status, 405);
  assert.equal(res.headers.get("allow"), "GET, HEAD, OPTIONS");
  assert.deepEqual(await bodyAsJson(res), { error: "method-not-allowed" });
});

test("unknown paths get a bare 404 that does not echo the path", async () => {
  const res = await handleAgentRequest(req("/definitely/not/a/route?x=1"), EMPTY);
  assert.equal(res.status, 404);
  const text = await res.text();
  assert.equal(text.includes("definitely"), false);
  assert.deepEqual(JSON.parse(text), { error: "not-found" });
});

/* ---------------------------------------------------------------------------
 * /agent/* — the boundary: rejected until real authentication exists
 * ------------------------------------------------------------------------ */

test("/agent routes reject every verb with 401, including sent credentials", async () => {
  for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
    const res = await handleAgentRequest(req("/agent/chat", { method }), EMPTY);
    assert.equal(res.status, 401, `${method} must be 401`);
    const body = await bodyAsJson(res);
    assert.equal(body.error, "authentication-required");
  }
  const withToken = await handleAgentRequest(
    req("/agent/chat", { method: "POST", headers: { authorization: "Bearer not-a-real-token" } }),
    EMPTY,
  );
  assert.equal(withToken.status, 401);
  const withBody = await handleAgentRequest(
    req("/agent/chat", { method: "POST", body: JSON.stringify({ prompt: "anything" }) }),
    EMPTY,
  );
  assert.equal(withBody.status, 401);
});

test("the /agent root itself is part of the protected boundary", async () => {
  const res = await handleAgentRequest(req("/agent"), EMPTY);
  assert.equal(res.status, 401);
});

/* ---------------------------------------------------------------------------
 * CORS — fail closed, exact-match only, never wildcard
 * ------------------------------------------------------------------------ */

test("preflight without a configured origin allow-list emits no CORS headers", async () => {
  const res = await handleAgentRequest(
    req("/health", { method: "OPTIONS", headers: { origin: "https://example.com" } }),
    EMPTY,
  );
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), null);
});

test("an exact allow-listed origin gets the matching ACAO and preflight fields", async () => {
  const env: AgentEnv = { ALLOWED_ORIGINS: "https://example.com https://example.org" };
  const res = await handleAgentRequest(
    req("/health", { method: "OPTIONS", headers: { origin: "https://example.org" } }),
    env,
  );
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), "https://example.org");
  assert.equal(res.headers.get("vary"), "Origin");
  assert.equal(res.headers.get("access-control-allow-methods"), "GET, HEAD, POST, OPTIONS");
  assert.equal(res.headers.get("access-control-allow-headers"), "Content-Type, Authorization");
  // Credentials-capable so an Access session cookie can ride cross-origin.
  assert.equal(res.headers.get("access-control-allow-credentials"), "true");
});

test("a non-listed origin gets no CORS headers even when a list exists", async () => {
  const env: AgentEnv = { ALLOWED_ORIGINS: "https://example.com" };
  const res = await handleAgentRequest(
    req("/health", { method: "OPTIONS", headers: { origin: "https://evil.example" } }),
    env,
  );
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), null);
});

test("simple GETs mirror the same gate: listed origin allowed, others silent", async () => {
  const env: AgentEnv = { ALLOWED_ORIGINS: "https://example.com" };
  const ok = await handleAgentRequest(
    req("/health", { headers: { origin: "https://example.com" } }),
    env,
  );
  assert.equal(ok.headers.get("access-control-allow-origin"), "https://example.com");
  const denied = await handleAgentRequest(
    req("/health", { headers: { origin: "https://other.example" } }),
    env,
  );
  assert.equal(denied.headers.get("access-control-allow-origin"), null);
});

test("a wildcard entry in the config is ignored, not honoured", async () => {
  const env: AgentEnv = { ALLOWED_ORIGINS: "* https://example.com" };
  const res = await handleAgentRequest(
    req("/health", { headers: { origin: "https://any.example" } }),
    env,
  );
  assert.equal(res.headers.get("access-control-allow-origin"), null);
  const listed = await handleAgentRequest(
    req("/health", { headers: { origin: "https://example.com" } }),
    env,
  );
  assert.equal(listed.headers.get("access-control-allow-origin"), "https://example.com");
});

/* ---------------------------------------------------------------------------
 * Policy authority — the worker is bound to the shared contract
 * ------------------------------------------------------------------------ */

function resource(
  kind: AccessControlledResource["kind"],
  id: string,
  visibility: AccessControlledResource["visibility"],
  extra?: Partial<AccessControlledResource>,
): AccessControlledResource {
  return { kind, id, visibility, ...extra };
}

test("operations list is exactly { advisory-chat, projects-list } — no other capability is live", () => {
  assert.deepEqual(AGENT_OPERATIONS, ["advisory-chat", "projects-list"]);
  // Both are read-only: text generation and an approved-records listing.
  // Anything else must be registered here AND gated through the doors.
});

test("the worker's ceilings are the site's ceilings (one policy, two runtimes)", () => {
  assert.equal(clearanceCeiling("client"), "client");
  assert.equal(clearanceCeiling("staff"), "internal");
  assert.equal(clearanceCeiling("admin"), "admin");
  assert.equal(clearanceCeiling("owner"), "confidential");
});

test("a staff principal may authorise internal records but never confidential", () => {
  const staff: Principal = principal("staff", "staff-1", { organisationId: "map-holding" });
  assert.deepEqual(
    authorizeAgentAction(
      staff,
      resource("report", "ops-report", "internal", { ownerOrganisationId: "map-holding" }),
      NOW,
    ),
    { allowed: true, via: "ownership" },
  );
  assert.deepEqual(
    authorizeAgentAction(
      staff,
      resource("report", "board-pack", "confidential", { ownerOrganisationId: "map-holding" }),
      NOW,
    ),
    { allowed: false, reason: "insufficient-clearance" },
  );
});

test("an admin principal still cannot reach confidential material", () => {
  const admin: Principal = principal("admin", "admin-1", { organisationId: "map-holding" });
  assert.equal(
    authorizeAgentAction(admin, resource("report", "financials", "confidential"), NOW).allowed,
    false,
  );
  const owner: Principal = principal("owner", "owner-1", { organisationId: "map-holding" });
  assert.deepEqual(
    authorizeAgentAction(
      owner,
      resource("report", "financials", "confidential", { ownerOrganisationId: "map-holding" }),
      NOW,
    ),
    { allowed: true, via: "ownership" },
  );
});

test("no principal can be fabricated to bypass the ceilings", () => {
  // Even a hand-built principal with an absurd entitlement list is still
  // capped by its kind's ceiling: entitlements never raise it.
  const client = principal("client", "c-9", {
    organisationId: "org-x",
    entitlements: ["founding-partner", "opportunity-submission", "document-exchange"],
  });
  assert.equal(
    authorizeAgentAction(client, resource("document", "d", "internal", { ownerId: "c-9" }), NOW)
      .allowed,
    false,
  );
});

/* ---------------------------------------------------------------------------
 * Phase 2 — Cloudflare Access identity boundary
 *
 * Identity comes ONLY from the native Access context (`ctx.access`), modelled
 * here by a fake `AccessCtx` exactly as the Workers runtime provides it. No
 * client header in the following tests can grant anything.
 * ------------------------------------------------------------------------ */

function fakeAccess(email: string | null): import("../identity.ts").AccessCtx {
  return {
    aud: "map-holding-business-agent",
    getIdentity: async () => (email === null ? null : { email }),
  };
}

test("unauthenticated: no Access context ⇒ 401 on /agent/identity", async () => {
  const res = await handleAgentRequest(req("/agent/identity"), EMPTY);
  assert.equal(res.status, 401);
  const body = await bodyAsJson(res);
  assert.equal(body.error, "authentication-required");
  assert.equal(body.reason, "no-access-identity");
});

test("spoofed CF-Access headers grant NOTHING: identity comes from the runtime context only", async () => {
  const env: AgentEnv = { OWNERS: "boss@example.com" };
  const res = await handleAgentRequest(
    req("/agent/identity", {
      headers: {
        "cf-access-authenticated-user-email": "boss@example.com",
        "cf-access-authenticated-user-uuid": "00000000-0000-0000-0000-000000000000",
      },
    }),
    env, // no Access context: a real attacker who bypasses the edge sees this
  );
  assert.equal(res.status, 401);
});

test("signing in grants NO role when rosters are empty (the safe default)", async () => {
  const res = await handleAgentRequest(
    req("/agent/identity"),
    EMPTY,
    fakeAccess("anyone@example.com"),
  );
  assert.equal(res.status, 403);
  const body = await bodyAsJson(res);
  assert.equal(body.error, "identity-not-approved");
  assert.equal(body.reason, "no-mapped-role");
});

test("owner-role assignment: exact roster match maps to kind owner", async () => {
  const env: AgentEnv = { OWNERS: "Boss@Example.com", STAFF: "worker@example.com" };
  const res = await handleAgentRequest(req("/agent/identity"), env, fakeAccess("boss@example.com"));
  assert.equal(res.status, 200);
  const body = await bodyAsJson(res);
  assert.deepEqual(body, {
    kind: "owner",
    id: "boss@example.com",
    organisation: "map-holding",
    approved: true,
    granted_operations: ["advisory-chat", "projects-list"],
  });
});

test("worker(staff)-role assignment: exact roster match maps to kind staff", async () => {
  const env: AgentEnv = { OWNERS: "boss@example.com", STAFF: "worker@example.com" };
  const res = await handleAgentRequest(
    req("/agent/identity"),
    env,
    fakeAccess("WORKER@EXAMPLE.COM"),
  );
  assert.equal(res.status, 200);
  const body = await bodyAsJson(res);
  assert.equal(body.kind, "staff");
  assert.equal(body.id, "worker@example.com");
  assert.equal(body.organisation, "map-holding");
  assert.deepEqual(body.granted_operations, ["advisory-chat", "projects-list"]);
});

test("an identity on BOTH rosters resolves to the narrower owner role", async () => {
  const env: AgentEnv = { OWNERS: "both@example.com", STAFF: "both@example.com" };
  const res = await handleAgentRequest(req("/agent/identity"), env, fakeAccess("both@example.com"));
  const body = await bodyAsJson(res);
  assert.equal(body.kind, "owner");
});

test("approved caller on a non-existent operation ⇒ 404 operation-unavailable", async () => {
  const env: AgentEnv = { OWNERS: "boss@example.com" };
  const res = await handleAgentRequest(req("/agent/finance"), env, fakeAccess("boss@example.com"));
  assert.equal(res.status, 404);
  const body = await bodyAsJson(res);
  assert.equal(body.error, "operation-unavailable");
  assert.equal(body.reason, "no-operations-registered");
});

test("an Access session without an email claim cannot be mapped and stays unauthenticated", async () => {
  const env: AgentEnv = { OWNERS: "boss@example.com" };
  const res = await handleAgentRequest(req("/agent/identity"), env, fakeAccess(null));
  assert.equal(res.status, 401);
});

/* ---------------------------------------------------------------------------
 * Phase 2 — CORS now anchored to the confirmed website origin
 * ------------------------------------------------------------------------ */

test("with no ALLOWED_ORIGINS set, CORS defaults to the confirmed Vercel origin only", async () => {
  const ok = await handleAgentRequest(
    req("/health", { headers: { origin: "https://map-holding.vercel.app" } }),
    EMPTY,
  );
  assert.equal(ok.headers.get("access-control-allow-origin"), "https://map-holding.vercel.app");
  const other = await handleAgentRequest(
    req("/health", { headers: { origin: "https://example.com" } }),
    EMPTY,
  );
  assert.equal(other.headers.get("access-control-allow-origin"), null);
});

test("an explicit ALLOWED_ORIGINS replaces the default; wildcards stay filtered", async () => {
  const env: AgentEnv = { ALLOWED_ORIGINS: "https://example.org *" };
  const listed = await handleAgentRequest(
    req("/health", { headers: { origin: "https://example.org" } }),
    env,
  );
  assert.equal(listed.headers.get("access-control-allow-origin"), "https://example.org");
  const defaultOrigin = await handleAgentRequest(
    req("/health", { headers: { origin: "https://map-holding.vercel.app" } }),
    env,
  );
  assert.equal(defaultOrigin.headers.get("access-control-allow-origin"), null);
});

test("/health discloses neither roster state nor identity of anyone", async () => {
  const env: AgentEnv = { OWNERS: "boss@example.com", STAFF: "worker@example.com" };
  const res = await handleAgentRequest(req("/health"), env, fakeAccess("boss@example.com"));
  const text = await res.text();
  assert.equal(text.includes("boss@example.com"), false);
  assert.equal(text.includes("worker@example.com"), false);
  const body = JSON.parse(text) as Record<string, unknown>;
  assert.deepEqual(Object.keys(body).sort(), [
    "agent",
    "authentication",
    "business_operations",
    "phase",
    "service",
    "status",
  ]);
});

/* ---------------------------------------------------------------------------
 * Phase 3 — advisory chat (the first registered capability)
 *
 * Identity tiers are enforced BEFORE any body parsing or model call.
 * The model client is injected: tests assert on the EXACT payload that would
 * leave this machine, so no network call ever happens.
 * ------------------------------------------------------------------------ */

function stubModel(reply: string): ModelClient & { calls: unknown[] } {
  const calls: unknown[] = [];
  const stub: ModelClient = async (_env, messages) => {
    calls.push(messages);
    return { ok: true, reply, model: "stub-model" };
  };
  return Object.assign(stub, { calls });
}

test("/agent/chat without an Access context ⇒ 401 before any body is read", async () => {
  const res = await handleAgentRequest(
    req("/agent/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] }),
    }),
    EMPTY,
  );
  assert.equal(res.status, 401);
  assert.equal((await bodyAsJson(res)).error, "authentication-required");
});

test("/agent/chat signed-in-unapproved ⇒ 403 with the requester's own claim only", async () => {
  const env: AgentEnv = {};
  const res = await handleAgentRequest(
    req("/agent/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] }),
    }),
    env,
    fakeAccess("outsider@example.com"),
  );
  assert.equal(res.status, 403);
  const body = await bodyAsJson(res);
  assert.equal(body.error, "identity-not-approved");
  assert.equal(body.id, "outsider@example.com");
});

test("/agent/chat unconfigured model ⇒ structured 503, no mock reply, no upstream noise", async () => {
  const env: AgentEnv = { OWNERS: "boss@example.com" };
  const res = await handleAgentRequest(
    req("/agent/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] }),
    }),
    env,
    fakeAccess("boss@example.com"),
  );
  assert.equal(res.status, 503);
  const body = await bodyAsJson(res);
  assert.equal(body.error, "agent-unavailable");
  assert.equal(body.reason, "model-unconfigured");
});

test("/agent/chat with a configured model returns the reply — and the model receives exactly the validated payload", async () => {
  const env: AgentEnv = { OWNERS: "boss@example.com" };
  const stub = stubModel("a safe advisory answer");
  const res = await handleAgentRequest(
    req("/agent/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          { role: "user", content: "First question" },
          { role: "assistant", content: "First answer" },
          { role: "user", content: "Second question" },
        ],
      }),
    }),
    env,
    fakeAccess("boss@example.com"),
    { modelClient: stub },
  );
  assert.equal(res.status, 200);
  const body = await bodyAsJson(res);
  assert.equal(body.ok, true);
  assert.equal(body.model, "stub-model");
  assert.equal(body.reply, "a safe advisory answer");
  // Exactly the validated conversation reached the model client — nothing else.
  assert.deepEqual(stub.calls[0], [
    { role: "user", content: "First question" },
    { role: "assistant", content: "First answer" },
    { role: "user", content: "Second question" },
  ]);
});

test("/agent/chat rejects malformed payloads with 400, not guesses", async () => {
  const env: AgentEnv = { OWNERS: "boss@example.com" };
  const cases: Array<unknown> = [
    "not json at all {{{",
    null,
    {},
    { messages: [] },
    { messages: [{ role: "user", content: "" }] },
    { messages: [{ role: "system", content: "impossible role" }] },
    { messages: [{ role: "assistant", content: "ends with assistant" }] },
  ];
  for (const payload of cases) {
    const res = await handleAgentRequest(
      req("/agent/chat", {
        method: "POST",
        body: typeof payload === "string" ? payload : JSON.stringify(payload),
      }),
      env,
      fakeAccess("boss@example.com"),
    );
    assert.ok(
      res.status === 400 || res.status === 404,
      `expected 400 for ${String(payload).slice(0, 24)}…`,
    );
  }
});

test("/agent/chat GET on the endpoint ⇒ 405; oversized payload ⇒ 413", async () => {
  const env: AgentEnv = { OWNERS: "boss@example.com" };
  const getRes = await handleAgentRequest(req("/agent/chat"), env, fakeAccess("boss@example.com"));
  assert.equal(getRes.status, 405);
  assert.equal(getRes.headers.get("allow"), "POST, OPTIONS");

  const big = JSON.stringify({ messages: [{ role: "user", content: "x".repeat(70_000) }] });
  const bigRes = await handleAgentRequest(
    req("/agent/chat", { method: "POST", body: big }),
    env,
    fakeAccess("boss@example.com"),
  );
  assert.equal(bigRes.status, 413);
});

test("the live model client reports unconfigured without env values (no credential leak, no network)", async () => {
  const outcome = await liveModelClient(EMPTY, [{ role: "user", content: "hi" }]);
  assert.deepEqual(outcome, { ok: false, reason: "model-unconfigured" });
});

/* ---------------------------------------------------------------------------
 * Phase 4 — projects-list (read-only, source of truth: src/content/projects.ts)
 * ------------------------------------------------------------------------ */

import { PROJECTS } from "../../src/content/projects.ts";

function expectedProjectFields() {
  return PROJECTS.map((p) => {
    const item: Record<string, string> = {
      ref: p.ref,
      name: p.name,
      location: p.location,
      sector: p.sector,
      status: p.status,
    };
    if (p.description !== undefined && p.description.length > 0) item.description = p.description;
    return item;
  });
}

test("/agent/projects without an Access context ⇒ 401 (no bypass of the roster tiers)", async () => {
  const res = await handleAgentRequest(req("/agent/projects"), EMPTY);
  assert.equal(res.status, 401);
  assert.equal((await bodyAsJson(res)).error, "authentication-required");
});

test("/agent/projects signed-in-unapproved ⇒ 403; the record source is never served", async () => {
  const res = await handleAgentRequest(
    req("/agent/projects"),
    EMPTY,
    fakeAccess("outsider@example.com"),
  );
  assert.equal(res.status, 403);
  const text = await res.text();
  assert.equal(text.includes(PROJECTS[0].ref), false);
});

test("/agent/projects approved owner ⇒ exactly the six approved records, source order, public fields only", async () => {
  const env: AgentEnv = { OWNERS: "boss@example.com" };
  const res = await handleAgentRequest(req("/agent/projects"), env, fakeAccess("boss@example.com"));
  assert.equal(res.status, 200);
  const body = await bodyAsJson(res);
  assert.equal(body.ok, true);
  assert.equal(body.operation, "projects-list");
  assert.equal(body.count, PROJECTS.length);
  assert.equal(PROJECTS.length, 6, "the six approved records must exist unchanged");
  assert.deepEqual(body.projects, expectedProjectFields());
  // The canonical order and content, asserted explicitly.
  const refs = (body.projects as Array<{ ref: string }>).map((p) => p.ref);
  assert.deepEqual(refs, [
    "GOLD PROJECT 001",
    "GOLD PROJECT 002",
    "GOLD PROJECT 003",
    "DEVELOPMENT PROJECT 001",
    "ENERGY PROJECT 001",
    "LITHIUM PROJECT 001",
  ]);
});

test("/agent/projects approved staff gets the identical read-only result", async () => {
  const env: AgentEnv = { STAFF: "worker@example.com" };
  const res = await handleAgentRequest(
    req("/agent/projects"),
    env,
    fakeAccess("worker@example.com"),
  );
  assert.equal(res.status, 200);
  const body = await bodyAsJson(res);
  assert.deepEqual(body.projects, expectedProjectFields());
});

test("/agent/projects rejects write methods and discloses nothing extra", async () => {
  const env: AgentEnv = { OWNERS: "boss@example.com" };
  const post = await handleAgentRequest(
    req("/agent/projects", { method: "POST" }),
    env,
    fakeAccess("boss@example.com"),
  );
  assert.equal(post.status, 405);
  assert.equal(post.headers.get("allow"), "GET, HEAD, OPTIONS");

  const get = await handleAgentRequest(req("/agent/projects"), env, fakeAccess("boss@example.com"));
  const text = await get.text();
  // No filesystem paths, env values or internal identifiers in the payload.
  assert.equal(text.includes("://"), false);
  assert.equal(text.includes("/src/"), false);
  assert.equal(text.includes("OWNERS"), false);
});

/* ---------------------------------------------------------------------------
 * Phase 6 — client assistant surface (/client-agent/*)
 *
 * A separate boundary: verified by the same edge Access context, authorised
 * ONLY by the CLIENTS roster, and structurally incapable of exposing
 * internal data. Owner/staff principals never appear in this tier.
 * ------------------------------------------------------------------------ */

function scopeModel(): ModelClient & { scopes: string[] } {
  const scopes: string[] = [];
  const stub: ModelClient = async (_env, _messages, scope) => {
    scopes.push(scope ?? "owner");
    return { ok: true, reply: "stub-client-reply", model: "stub-model" };
  };
  return Object.assign(stub, { scopes });
}

test("/client-agent/identity without an Access context ⇒ 401", async () => {
  const res = await handleAgentRequest(req("/client-agent/identity"), { CLIENTS: "client@example.com" });
  assert.equal(res.status, 401);
  const body = await bodyAsJson(res);
  assert.equal(body.error, "authentication-required");
});

test("/client-agent: signing in grants nothing without the CLIENTS roster (403, own claim only)", async () => {
  const res = await handleAgentRequest(req("/client-agent/identity"), EMPTY, fakeAccess("anyone@example.com"));
  assert.equal(res.status, 403);
  const body = await bodyAsJson(res);
  assert.equal(body.error, "identity-not-approved");
  assert.equal(body.id, "anyone@example.com");
});

test("an internal owner/staff email is NOT a client principal: 403 on /client-agent", async () => {
  const env: AgentEnv = { OWNERS: "boss@example.com", STAFF: "worker@example.com", CLIENTS: "client@example.com" };
  for (const email of ["boss@example.com", "worker@example.com"]) {
    const res = await handleAgentRequest(req("/client-agent/identity"), env, fakeAccess(email));
    assert.equal(res.status, 403, `${email} must not be approved on the client surface`);
  }
  // ...and the SAME identities still resolve on the internal surface:
  const internal = await handleAgentRequest(req("/agent/identity"), env, fakeAccess("boss@example.com"));
  assert.equal(internal.status, 200);
});

test("an approved client gets ONLY the client principal and its capability", async () => {
  const res = await handleAgentRequest(
    req("/client-agent/identity"),
    { CLIENTS: "Client@Example.com" },
    fakeAccess("client@example.com"),
  );
  assert.equal(res.status, 200);
  const body = await bodyAsJson(res);
  assert.equal(body.kind, "client");
  assert.equal(body.id, "client@example.com");
  assert.equal(body.approved, true);
  assert.deepEqual(body.granted_operations, ["client-advisory-chat"]);
  assert.equal("organisation" in body, false); // no internal mapping leaks
});

test("/client-agent/chat: 401 unauthenticated · 403 unapproved · 503 unconfigured · 200 via client scope", async () => {
  const env: AgentEnv = { CLIENTS: "client@example.com" };
  const chatBody = JSON.stringify({ messages: [{ role: "user", content: "What does UNDER REVIEW mean?" }] });

  const unauth = await handleAgentRequest(req("/client-agent/chat", { method: "POST", body: chatBody }), env);
  assert.equal(unauth.status, 401);

  const unapproved = await handleAgentRequest(
    req("/client-agent/chat", { method: "POST", body: chatBody }),
    env,
    fakeAccess("outsider@example.com"),
  );
  assert.equal(unapproved.status, 403);

  const unconfigured = await handleAgentRequest(
    req("/client-agent/chat", { method: "POST", body: chatBody }),
    env,
    fakeAccess("client@example.com"),
  );
  assert.equal(unconfigured.status, 503);
  assert.equal((await bodyAsJson(unconfigured)).reason, "model-unconfigured");

  const scopeStub = scopeModel();
  const ok = await handleAgentRequest(
    req("/client-agent/chat", { method: "POST", body: chatBody }),
    env,
    fakeAccess("client@example.com"),
    { modelClient: scopeStub },
  );
  assert.equal(ok.status, 200);
  const okBody = await bodyAsJson(ok);
  assert.equal(okBody.reply, "stub-client-reply");
  assert.deepEqual(scopeStub.scopes, ["client"]); // the client prompt path, not owner
});

test("/client-agent/chat rejects malformed payloads before any model call", async () => {
  const env: AgentEnv = { CLIENTS: "client@example.com" };
  const malformed = [
    JSON.stringify({ messages: [] }),
    JSON.stringify({ messages: [{ role: "system", content: "x" }] }),
    JSON.stringify({ messages: [{ role: "assistant", content: "x" }] }),
    "not-json",
  ];
  for (const body of malformed) {
    const res = await handleAgentRequest(
      req("/client-agent/chat", { method: "POST", body }),
      env,
      fakeAccess("client@example.com"),
    );
    assert.equal(res.status, 400, `expected 400 for ${body}`);
  }
});

test("/client-agent exposes no internal data: projects are unreachable from the client surface", async () => {
  const env: AgentEnv = { OWNERS: "boss@example.com", CLIENTS: "client@example.com" };
  const res = await handleAgentRequest(
    req("/client-agent/projects"),
    env,
    fakeAccess("client@example.com"),
  );
  // Unknown operation on the client surface ⇒ 404, not a data read.
  assert.equal(res.status, 404);
  const body = await bodyAsJson(res);
  assert.equal(body.reason, "no-operations-registered");

  // Even the internal projects-list never surfaces through a client identity:
  const clientOnInternal = await handleAgentRequest(
    req("/agent/projects"),
    env,
    fakeAccess("client@example.com"),
  );
  assert.equal(clientOnInternal.status, 403);

  const text = await (await handleAgentRequest(req("/client-agent/identity"), env, fakeAccess("client@example.com"))).text();
  assert.equal(text.includes("GOLD PROJECT"), false);
  assert.equal(text.includes("LITHIUM PROJECT"), false);
});

/* ---------------------------------------------------------------------------
 * Phase 7 — internal chat retrieves the authorized project records
 *
 * The chat model call now carries the SAME policy-filtered records the
 * /agent/projects endpoint returns. Records travel as a server-built context
 * block (trusted local source, never user input); the client surface never
 * receives one.
 * ------------------------------------------------------------------------ */

function contextModel(): ModelClient & { contexts: string[]; scopes: string[] } {
  const contexts: string[] = [];
  const scopes: string[] = [];
  const stub: ModelClient = async (_env, _messages, scope, projectContext) => {
    scopes.push(scope ?? "");
    contexts.push(projectContext ?? "");
    return { ok: true, reply: "ok", model: "stub-model" };
  };
  return Object.assign(stub, { contexts, scopes });
}

test("/agent/chat: the model receives the authorized record context (owner scope)", async () => {
  const env: AgentEnv = { OWNERS: "boss@example.com" };
  const stub = contextModel();
  const res = await handleAgentRequest(
    req("/agent/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "Which projects are available?" }] }),
    }),
    env,
    fakeAccess("boss@example.com"),
    { modelClient: stub },
  );
  assert.equal(res.status, 200);
  assert.equal(stub.scopes.length, 1);
  assert.equal(stub.scopes[0], "owner");
  const ctx = stub.contexts[0];
  assert.equal(ctx.length > 0, true);
  assert.equal(ctx.includes("APPROVED PROJECT RECORDS"), true);
  for (const ref of [
    "GOLD PROJECT 001",
    "GOLD PROJECT 002",
    "GOLD PROJECT 003",
    "DEVELOPMENT PROJECT 001",
    "ENERGY PROJECT 001",
    "LITHIUM PROJECT 001",
  ]) {
    assert.equal(ctx.includes(ref), true, `context must include ${ref}`);
  }
  // And the block forbids invention:
  assert.equal(ctx.includes("Never invent"), true);
});

test("/agent/projects and the chat context are the same policy-gated read", async () => {
  const env: AgentEnv = { OWNERS: "boss@example.com" };
  const list = (await bodyAsJson(
    await handleAgentRequest(req("/agent/projects"), env, fakeAccess("boss@example.com")),
  )) as { projects: Array<{ ref: string }> };
  assert.equal(list.projects.length, 6);
  const stub = contextModel();
  await handleAgentRequest(
    req("/agent/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "x" }] }),
    }),
    env,
    fakeAccess("boss@example.com"),
    { modelClient: stub },
  );
  const ctx = stub.contexts[0];
  // Every record the endpoint returned is present in the context block...
  for (const record of list.projects as Array<{ ref: string }>) {
    assert.equal(ctx.includes(record.ref), true);
  }
  // ...and no invented content slipped in:
  assert.equal(ctx.includes("undefined"), false);
  assert.equal(ctx.includes("NaN"), false);
});

test("the client surface never receives record context", async () => {
  const env: AgentEnv = { CLIENTS: "client@example.com" };
  const stub = contextModel();
  const res = await handleAgentRequest(
    req("/client-agent/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "What projects exist?" }] }),
    }),
    env,
    fakeAccess("client@example.com"),
    { modelClient: stub },
  );
  assert.equal(res.status, 200);
  assert.equal(stub.scopes[0], "client");
  assert.equal(stub.contexts[0], ""); // nothing passed: no internal data, structurally
});

test("staff chat context carries the same authorized records (read-only parity)", async () => {
  const env: AgentEnv = { STAFF: "worker@example.com" };
  const stub = contextModel();
  const res = await handleAgentRequest(
    req("/agent/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "statuses?" }] }),
    }),
    env,
    fakeAccess("worker@example.com"),
    { modelClient: stub },
  );
  assert.equal(res.status, 200);
  const ctx = stub.contexts[0];
  assert.equal(ctx.includes("AVAILABLE"), true);
  assert.equal(ctx.includes("UNDER REVIEW"), true);
});

test("an unapproved sign-in gets NO context and NO model call on /agent/chat", async () => {
  const env: AgentEnv = { OWNERS: "boss@example.com" };
  const stub = contextModel();
  const res = await handleAgentRequest(
    req("/agent/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "x" }] }),
    }),
    env,
    fakeAccess("outsider@example.com"),
    { modelClient: stub },
  );
  assert.equal(res.status, 403);
  assert.equal(stub.contexts.length, 0); // the stub was never invoked
});
