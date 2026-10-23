/**
 * MAP HOLDING — BUSINESS AGENT PHASE 5: LOCAL DEVELOPMENT SERVER TESTS.
 *
 * Exercises the real dev-only sign-in/session pipeline end to end:
 *   valid sign-in, invalid credentials, expired/tampered/absent sessions,
 *   role enforcement, CSRF/origin gating, preflight fail-closed, the
 *   existing /agent boundary through the production handler, and the
 *   production-mode refusal. Runs on plain Node (`node --test`); no mocks
 * of the request pipeline — a live loopback server on an ephemeral port.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseRoster, assertDevOnly } from "./config.ts";
import { SESSION_COOKIE, signSessionToken, verifySessionToken } from "./session.ts";
import { startLocalAgentServer, type DevServer } from "./server.ts";

// ---- Shared fixtures -------------------------------------------------------
const OWNER = "dev-owner@local";
const STAFF = "dev-worker@local";
const CLIENT = "dev-client@local";
const SECRET = "c2VjcmV0LXN0cmluZy1mb3ItbG9jYWwtdGVzdHMtd2l0aC1wdWxs"; // 32 bytes base64
const ORIGIN = "http://localhost:3100";

function rosterFile(dir: string, users: unknown[]): string {
  const file = join(dir, "users.json");
  writeFileSync(file, JSON.stringify({ users }));
  return file;
}

async function bootServer(users: unknown[]): Promise<{ server: DevServer; dir: string }> {
  const dir = mkdtempSync(join(tmpdir(), "mh-agent-local-"));
  const usersFile = rosterFile(dir, users);
  const roster = parseRoster({ users });
  const server = await startLocalAgentServer({
    port: 0,
    // Explicit (even when empty) so a developer's ambient local roster can
    // never leak into the test's expected world.
    owners: roster.owners,
    staff: roster.staff,
    clients: roster.clients,
    origins: [ORIGIN],
    secret: SECRET,
    usersFile,
  });
  return { server, dir };
}

/** Minimal cookie jar for fetch. */
class Jar {
  private cookie: string | null = null;
  setFrom(res: Response): void {
    const sc = res.headers.get("set-cookie");
    if (!sc) return;
    const head = sc.split(";")[0]!;
    const eq = head.indexOf("=");
    const name = head.slice(0, eq).trim();
    if (name === SESSION_COOKIE) this.cookie = head; // "" value = cleared
  }
  header(): string | undefined {
    return this.cookie && this.cookie !== "" ? this.cookie : undefined;
  }
}

// ---- Session token unit tests ---------------------------------------------

test("verifySessionToken: round-trips a valid payload", () => {
  const token = signSessionToken({ email: OWNER, exp: Math.floor(Date.now() / 1000) + 60 }, SECRET);
  const payload = verifySessionToken(token, SECRET);
  assert.deepEqual(payload, { email: OWNER, exp: payload!.exp });
});

test("verifySessionToken: rejects a tampered payload", () => {
  const token = signSessionToken({ email: OWNER, exp: Math.floor(Date.now() / 1000) + 60 }, SECRET);
  const data = token.slice(0, token.lastIndexOf("."));
  const sig = token.slice(token.lastIndexOf(".") + 1);
  const tamperedData = Buffer.from(JSON.stringify({ email: "evil@local", exp: 9999999999 })).toString("base64url");
  assert.equal(verifySessionToken(`${tamperedData}.${sig}`, SECRET), null);
});

test("verifySessionToken: rejects a token signed by another secret", () => {
  const token = signSessionToken({ email: OWNER, exp: Math.floor(Date.now() / 1000) + 60 }, SECRET);
  assert.equal(verifySessionToken(token, "b25vdGhlLXNlY3JldA=="), null);
});

test("verifySessionToken: rejects an expired token", () => {
  const token = signSessionToken({ email: OWNER, exp: 1 }, SECRET); // year 1970
  assert.equal(verifySessionToken(token, SECRET), null);
});

test("verifySessionToken: rejects malformed shapes", () => {
  assert.equal(verifySessionToken("not-a-token", SECRET), null);
  assert.equal(verifySessionToken(".", SECRET), null);
  const goodData = Buffer.from(JSON.stringify({ email: OWNER, exp: 9999999999 })).toString("base64url");
  const bogusSig = Buffer.alloc(32, 7).toString("base64url");
  assert.equal(verifySessionToken(`${goodData}.${bogusSig}`, SECRET), null);
});

test("assertDevOnly: refuses to run under NODE_ENV=production", () => {
  const env = process.env as Record<string, string | undefined>;
  const saved = env.NODE_ENV;
  env.NODE_ENV = "production";
  try {
    assert.throws(() => assertDevOnly(), /refuses to start in production/);
  } finally {
    if (saved === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = saved;
  }
});

test("parseRoster: malformed or unknown entries are dropped (never a wildcard)", () => {
  const parsed = parseRoster({
    users: [
      { email: OWNER, kind: "owner" },
      { email: STAFF, kind: "staff" },
      { email: CLIENT, kind: "client" },
      { email: "x@y.z", kind: "admin" }, // unknown kind ⇒ dropped
      { email: 42, kind: "owner" }, // malformed ⇒ dropped
      null,
      "owner",
    ],
  });
  assert.deepEqual(parsed, { owners: [OWNER], staff: [STAFF], clients: [CLIENT] });
  assert.deepEqual(parseRoster(null), { owners: [], staff: [], clients: [] });
  assert.deepEqual(parseRoster({}), { owners: [], staff: [], clients: [] });
});

// ---- End-to-end pipeline tests --------------------------------------------

test("valid sign-in issues a usable session; identity + projects authorized", async () => {
  const { server, dir } = await bootServer([
    { email: OWNER, kind: "owner" },
    { email: STAFF, kind: "staff" },
  ]);
  try {
    const jar = new Jar();
    const login = await fetch(`${server.url}/dev/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: OWNER }),
    });
    assert.equal(login.status, 204);
    jar.setFrom(login);
    assert.ok(jar.header()); // cookie was issued

    const me = await fetch(`${server.url}/dev/auth/me`, { headers: { cookie: jar.header()! } });
    assert.equal(me.status, 200);
    assert.deepEqual(await me.json(), { email: OWNER, kind: "owner", source: "local-development" });

    const identity = await fetch(`${server.url}/agent/identity`, { headers: { cookie: jar.header()! } });
    assert.equal(identity.status, 200);
    assert.equal((await identity.json()).kind, "owner");

    const projects = await fetch(`${server.url}/agent/projects`, { headers: { cookie: jar.header()! } });
    assert.equal(projects.status, 200);
    const body = await projects.json();
    assert.equal(body.count, 6);
    assert.equal(body.projects.length, 6);
    assert.equal(body.projects[0].ref, "GOLD PROJECT 001");
    assert.ok(!("clientEmail" in body.projects[0])); // sealed projection only

    const logout = await fetch(`${server.url}/dev/auth/logout`, { headers: { cookie: jar.header()! } });
    assert.equal(logout.status, 204);
  } finally {
    await server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("invalid credentials are rejected generically (401)", async () => {
  const { server, dir } = await bootServer([{ email: OWNER, kind: "owner" }]);
  try {
    for (const body of [
      JSON.stringify({ email: "stranger@external.example" }),
      JSON.stringify({ email: "" }),
      JSON.stringify({ role: "owner" }), // role claims are NOT trusted, ever
      "not-json",
    ]) {
      const res = await fetch(`${server.url}/dev/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      });
      assert.equal(res.status, 401);
      assert.equal((await res.json()).error, "invalid-credentials");
    }
    const res = await fetch(`${server.url}/dev/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email: "nope@nowhere" }),
    });
    assert.equal(res.headers.get("set-cookie"), null); // no cookie ever issued
  } finally {
    await server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("empty roster (default local state): nobody can sign in", async () => {
  // Explicitly pin EVERY roster to empty: an ambient local dev-users.json on
  // this machine (owners/staff/clients) must not leak into this world.
  const dir = mkdtempSync(join(tmpdir(), "mh-agent-local-"));
  writeFileSync(join(dir, "users.json"), JSON.stringify({ users: [] }));
  const server = await startLocalAgentServer({
    port: 0,
    owners: [],
    staff: [],
    clients: [],
    origins: [ORIGIN],
    secret: SECRET,
    usersFile: join(dir, "users.json"),
  });
  try {
    const res = await fetch(`${server.url}/dev/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email: OWNER }),
    });
    assert.equal(res.status, 401);
    const client = await fetch(`${server.url}/dev/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email: CLIENT }),
    });
    assert.equal(client.status, 401);
  } finally {
    await server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("absent, tampered, or expired sessions never reach the agent surface", async () => {
  const { server, dir } = await bootServer([{ email: OWNER, kind: "owner" }]);
  try {
    // absent
    let res = await fetch(`${server.url}/agent/identity`);
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), {
      error: "authentication-required",
      reason: "no-access-identity",
      message: "This service verifies identity through Cloudflare Access at the edge. No credentials, e-mails or roles supplied in headers or bodies are read.",
    });

    // tampered signature
    const jar = new Jar();
    jar.setFrom(
      await fetch(`${server.url}/dev/auth/login`, { method: "POST", body: JSON.stringify({ email: OWNER }) }),
    );
    const raw = jar.header()!;
    const sep = raw.lastIndexOf("=");
    const tampered = `${raw.slice(0, sep + 1)}${raw.slice(sep + 1).slice(0, -4)}AAAA`;
    res = await fetch(`${server.url}/agent/identity`, { headers: { cookie: tampered } });
    assert.equal(res.status, 401);

    // expired (right secret, clock in the past)
    const expired = signSessionToken({ email: OWNER, exp: Math.floor(Date.now() / 1000) - 60 }, SECRET);
    res = await fetch(`${server.url}/dev/auth/me`, { headers: { cookie: `${SESSION_COOKIE}=${expired}` } });
    assert.equal(res.status, 401);
    assert.equal((await res.json()).error, "no-session");

    // forged role with a different secret
    const foreign = signSessionToken(
      { email: "forged@owner.example", exp: Math.floor(Date.now() / 1000) + 999 },
      "b25vdGhlLXNlY3JldA==",
    );
    res = await fetch(`${server.url}/dev/auth/me`, { headers: { cookie: `${SESSION_COOKIE}=${foreign}` } });
    assert.equal(res.status, 401);
  } finally {
    await server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("role enforcement: roles come only from the server-side roster; off-roster identities hold nothing", async () => {
  const { server, dir } = await bootServer([{ email: OWNER, kind: "owner" }]);
  try {
    // The owner-tier boundary for /agent/identity reflects the mapped kind...
    const jar = new Jar();
    jar.setFrom(
      await fetch(`${server.url}/dev/auth/login`, { method: "POST", body: JSON.stringify({ email: OWNER }) }),
    );
    const me = await fetch(`${server.url}/dev/auth/me`, { headers: { cookie: jar.header()! } });
    assert.equal((await me.json()).kind, "owner");

    // ...and read-only projects remains available through the shared policy.
    const projects = await fetch(`${server.url}/agent/projects`, { headers: { cookie: jar.header()! } });
    assert.equal(projects.status, 200);

    // A staff identity that is NOT on this roster signs in nowhere:
    const outsider = await fetch(`${server.url}/dev/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email: STAFF }),
    });
    assert.equal(outsider.status, 401);

    // And a session minted under a DIFFERENT roster (containing the staff
    // address) stops working the moment the server no longer lists it:
    // the agent surface sees no identity (401), and /dev/auth/me refuses it.
    const otherSecret = "Zm9yZWlnLS1yb3N0ZXItc2VjcmV0LW9ubHktdGVzdA==";
    const forged = signSessionToken(
      { email: STAFF, exp: Math.floor(Date.now() / 1000) + 999 },
      otherSecret,
    );
    let res = await fetch(`${server.url}/dev/auth/me`, { headers: { cookie: `${SESSION_COOKIE}=${forged}` } });
    assert.equal(res.status, 401); // not even verifiable here (foreign secret)

    const locallyValid = signSessionToken(
      { email: STAFF, exp: Math.floor(Date.now() / 1000) + 999 },
      SECRET,
    );
    res = await fetch(`${server.url}/dev/auth/me`, { headers: { cookie: `${SESSION_COOKIE}=${locallyValid}` } });
    assert.equal(res.status, 401); // verifiable signature, but STAFF is off-roster ⇒ revoked

    res = await fetch(`${server.url}/agent/identity`, { headers: { cookie: `${SESSION_COOKIE}=${locallyValid}` } });
    // Signed in (verifiable) but off-roster: the shared policy grants nothing
    // ⇒ the 403 tier, exactly as in production.
    assert.equal(res.status, 403);
    assert.equal((await res.json()).error, "identity-not-approved");
  } finally {
    await server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CSRF: POSTs carrying a non-allow-listed Origin are rejected before agent logic", async () => {
  const { server, dir } = await bootServer([{ email: OWNER, kind: "owner" }]);
  // Keep this test honest and deterministic no matter the developer's shell:
  // Agnes must be "unconfigured" for the expected 503 path.
  const saved = {
    key: process.env.AGNES_API_KEY,
    base: process.env.AGNES_BASE_URL,
    model: process.env.AGNES_MODEL,
  };
  delete process.env.AGNES_API_KEY;
  delete process.env.AGNES_BASE_URL;
  delete process.env.AGNES_MODEL;
  try {
    const jar = new Jar();
    jar.setFrom(
      await fetch(`${server.url}/dev/auth/login`, { method: "POST", body: JSON.stringify({ email: OWNER }) }),
    );
    const cookie = jar.header();
    assert.ok(cookie);
    const res = await fetch(`${server.url}/agent/chat`, {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json",
        origin: "http://evil.example",
      },
      body: JSON.stringify({ messages: [{ role: "user", content: "x" }] }),
    });
    // The CSRF gate rejects any origin that is not allow-listed (and is not
    // the confirmed production site origin) — regardless of session state.
    assert.equal(res.status, 403);
    assert.equal((await res.json()).error, "origin-not-allowed");

    // Same request with NO session, but a valid allow-listed origin: passes
    // the CSRF gate, then the shared boundary denies the missing identity.
    const noSession = await fetch(`${server.url}/agent/chat`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: ORIGIN,
      },
      body: JSON.stringify({ messages: [{ role: "user", content: "x" }] }),
    });
    assert.equal(noSession.status, 401);
    assert.equal((await noSession.json()).error, "authentication-required");

    // The allow-listed origin with a valid session passes the CSRF gate; with
    // Agnes unconfigured the honest model-unconfigured state is returned.
    const cfg = await fetch(`${server.url}/agent/chat`, {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json",
        origin: ORIGIN,
      },
      body: JSON.stringify({ messages: [{ role: "user", content: "Advice?" }] }),
    });
    const cfgBody = await cfg.json();
    assert.equal(cfg.status, 503);
    assert.equal(cfgBody.error, "agent-unavailable");
    assert.equal(cfgBody.reason, "model-unconfigured");

    // Preflight: allow-listed origin gets credential-capable CORS; any other
    // origin gets nothing back (fail closed, exactly like production).
    const pre = await fetch(`${server.url}/agent/chat`, {
      method: "OPTIONS",
      headers: { origin: ORIGIN, "access-control-request-method": "POST" },
    });
    assert.equal(pre.status, 204);
    assert.equal(pre.headers.get("Access-Control-Allow-Origin"), ORIGIN);
    assert.equal(pre.headers.get("Access-Control-Allow-Credentials"), "true");

    const other = await fetch(`${server.url}/agent/chat`, {
      method: "OPTIONS",
      headers: { origin: "http://attacker.example", "access-control-request-method": "POST" },
    });
    assert.equal(other.status, 204);
    assert.equal(other.headers.get("Access-Control-Allow-Origin"), null);
  } finally {
    process.env.AGNES_API_KEY = saved.key;
    process.env.AGNES_BASE_URL = saved.base;
    process.env.AGNES_MODEL = saved.model;
    await server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("cookie hygiene: HttpOnly, SameSite=Lax, 12h Max-Age, full Path", async () => {
  const { server, dir } = await bootServer([{ email: OWNER, kind: "owner" }]);
  try {
    const res = await fetch(`${server.url}/dev/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email: OWNER }),
    });
    const setCookie = res.headers.get("set-cookie")!;
    assert.ok(setCookie.includes("HttpOnly"));
    assert.ok(setCookie.includes("SameSite=Lax"));
    assert.ok(setCookie.includes("Max-Age=43200"));
    assert.ok(setCookie.includes("Path=/"));
  } finally {
    await server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("client roster signs in locally; client surface works, internal surface stays gated", async () => {
  const { server, dir } = await bootServer([
    { email: OWNER, kind: "owner" },
    { email: CLIENT, kind: "client" },
  ]);
  try {
    const jar = new Jar();
    jar.setFrom(
      await fetch(`${server.url}/dev/auth/login`, {
        method: "POST",
        body: JSON.stringify({ email: CLIENT }),
      }),
    );
    assert.ok(jar.header());

    // The local session surfaces as a client principal on the client surface.
    const me = await fetch(`${server.url}/dev/auth/me`, { headers: { cookie: jar.header()! } });
    assert.equal((await me.json()).kind, "client");

    const clientIdentity = await fetch(`${server.url}/client-agent/identity`, {
      headers: { cookie: jar.header()! },
    });
    assert.equal(clientIdentity.status, 200);
    assert.equal((await clientIdentity.json()).kind, "client");

    // ...but the internal surface still denies it (no owner/staff mapping).
    const internalIdentity = await fetch(`${server.url}/agent/identity`, {
      headers: { cookie: jar.header()! },
    });
    assert.equal(internalIdentity.status, 403);

    // An owner session, by contrast, is denied on the client surface.
    const ownerJar = new Jar();
    ownerJar.setFrom(
      await fetch(`${server.url}/dev/auth/login`, {
        method: "POST",
        body: JSON.stringify({ email: OWNER }),
      }),
    );
    const ownerOnClientSurface = await fetch(`${server.url}/client-agent/identity`, {
      headers: { cookie: ownerJar.header()! },
    });
    assert.equal(ownerOnClientSurface.status, 403); // not on the CLIENTS roster

    const ownerOnInternal = await fetch(`${server.url}/agent/identity`, {
      headers: { cookie: ownerJar.header()! },
    });
    assert.equal(ownerOnInternal.status, 200);
  } finally {
    await server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---- Browser sign-in flow (/dev/signin) ------------------------------------

test("GET /dev/signin serves the local sign-in form; the return URL is validated", async () => {
  const { server, dir } = await bootServer([{ email: OWNER, kind: "owner" }]);
  try {
    // No next: falls back to a known site origin ("/internal").
    const page = await fetch(`${server.url}/dev/signin`);
    assert.equal(page.status, 200);
    assert.equal(page.headers.get("content-type"), "text/html; charset=utf-8");
    assert.equal(page.headers.get("cache-control"), "no-store");
    let html = await page.text();
    assert.ok(html.includes("<form method=\"post\" action=\"/dev/signin\""));
    assert.ok(html.includes(`value="${ORIGIN}/internal"`));

    // A configured-origin next is kept verbatim…
    const good = await fetch(`${server.url}/dev/signin?next=${encodeURIComponent(`${ORIGIN}/internal#agent`)}`);
    html = await good.text();
    assert.ok(html.includes(`value="${ORIGIN}/internal#agent"`));

    // …anything else (another host, this service itself) is dropped to the
    // fallback.
    const bad = await fetch(`${server.url}/dev/signin?next=${encodeURIComponent("http://evil.example/x")}`);
    html = await bad.text();
    assert.ok(!html.includes("evil.example/x"));
    assert.ok(html.includes(`value="${ORIGIN}/internal"`));
  } finally {
    await server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("POST /dev/signin signs in a rostered identity and redirects back to the site", async () => {
  const { server, dir } = await bootServer([{ email: OWNER, kind: "owner" }]);
  try {
    const body = new URLSearchParams({
      email: OWNER,
      next: `${ORIGIN}/internal#agent`,
    });
    const res = await fetch(`${server.url}/dev/signin`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      redirect: "manual",
    });
    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), `${ORIGIN}/internal#agent`);
    const jar = new Jar();
    jar.setFrom(res);
    assert.ok(jar.header()); // the session cookie rides on the redirect response

    // A page refresh is a NEW request carrying only the cookie — exactly what
    // the browser does after the 302 lands on the site:
    const refresh = await fetch(`${server.url}/agent/identity`, {
      headers: { cookie: jar.header()!, origin: ORIGIN },
    });
    assert.equal(refresh.status, 200);
    assert.equal((await refresh.json()).kind, "owner");
  } finally {
    await server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("POST /dev/signin refuses un-rostered addresses without issuing a session", async () => {
  const { server, dir } = await bootServer([{ email: OWNER, kind: "owner" }]);
  try {
    const res = await fetch(`${server.url}/dev/signin`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ email: "stranger@external.example", role: "owner" }).toString(),
      redirect: "manual",
    });
    assert.equal(res.status, 401);
    assert.equal(res.headers.get("set-cookie"), null); // no session for strangers
    const html = await res.text();
    assert.ok(html.includes("not in the local development roster"));
  } finally {
    await server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("sign-out invalidates the session server-side (revocation outlives the cookie)", async () => {
  const { server, dir } = await bootServer([{ email: OWNER, kind: "owner" }]);
  try {
    const jar = new Jar();
    jar.setFrom(
      await fetch(`${server.url}/dev/auth/login`, { method: "POST", body: JSON.stringify({ email: OWNER }) }),
    );
    assert.ok(jar.header());
    const before = await fetch(`${server.url}/dev/auth/me`, { headers: { cookie: jar.header()! } });
    assert.equal(before.status, 200);

    const logout = await fetch(`${server.url}/dev/auth/logout`, { headers: { cookie: jar.header()! } });
    assert.equal(logout.status, 204);
    assert.ok(
      (logout.headers.get("set-cookie") ?? "").includes("Max-Age=0"), // browser cookie cleared
    );

    // The SAME cookie value must now be refused — revocation is server-side,
    // so a stale copy of the token cannot keep working.
    const after = await fetch(`${server.url}/dev/auth/me`, { headers: { cookie: jar.header()! } });
    assert.equal(after.status, 401);
    const agent = await fetch(`${server.url}/agent/identity`, { headers: { cookie: jar.header()! } });
    assert.equal(agent.status, 401);
  } finally {
    await server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

