# MAP HOLDING — BUSINESS AGENT, PHASE 1: TRUSTED WORKER FOUNDATION

> **Status:** Phase 1 implemented, validated locally, not deployed.
> The public website remains an untouched Next.js static export (Cloudflare
> Pages). This phase adds a separate Cloudflare Worker skeleton and settles
> its security boundary. **Agnes is not connected and no model call exists.**

Brand statement: **PEOPLE • RESOURCES • OPPORTUNITY**

---

## 1. WHAT EXISTED BEFORE THIS PHASE (verified)

- `wrangler` (v4.145.0) is available on this machine's PATH but is **not** a
  project dependency; no Cloudflare config, routes, bindings or account files
  existed in the repository. `.wrangler/tmp` was an empty leftover.
- `src/lib/access/index.ts` is a pure, side-effect-free TypeScript module with
  no runtime dependencies — it bundles identically into the worker and runs
  under Node, so the worker can import the _same_ policy code instead of a
  copy.
- The production website origin (its Cloudflare Pages URL) is not present
  anywhere in this repository. It is therefore **unverified and unconfigured**
  by design.

## 2. LAYOUT ADDED IN THIS PHASE

| Path                         | Role                                                                                                                                                                                    |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `worker/index.ts`            | Worker entry. One `try/catch` guard: any fault returns a bare `500 {"error":"internal"}` — no stack traces, binding names or request details.                                           |
| `worker/handler.ts`          | The pure request router (`handleAgentRequest`). Runs unchanged under Cloudflare Workers and under plain Node in tests.                                                                  |
| `worker/env.ts`              | Environment _names only_: `ALLOWED_ORIGINS` (plain variable) and `AGNES_API_KEY` (secret convention). No values anywhere in the repo.                                                   |
| `worker/policy.ts`           | The single policy chokepoint: re-exports the shared access contract (`evaluateAccess`, `filterAuthorized`, `clearanceCeiling`) plus an intentionally **empty** `AGENT_OPERATIONS` list. |
| `worker/test/worker.test.ts` | Node-built-in tests for every endpoint and security rule (`npm run test:worker`).                                                                                                       |
| `wrangler.json`              | Minimal worker configuration: name, entry, compatibility date. **No routes/domains, no bindings.**                                                                                      |
| `package.json`               | One script added: `test:worker`. No dependency added.                                                                                                                                   |
| `.gitignore`                 | One line added: `.wrangler/` (wrangler's local state dir).                                                                                                                              |

Nothing else changed: public site, Gallery page, navigation, brand system,
the six approved project records, `next.config.ts` static export, and the
existing access test suite are untouched.

## 3. ENDPOINTS AND METHOD HANDLING

| Request                            | Response                                                                                                                               | Notes                                                                                                                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /health`                      | `200` minimal JSON: `service`, `status`, `phase`, `authentication: "unconfigured"`, `agent: "unconfigured"`, `business_operations: []` | No secrets, no binding names, no company data, no version/config leakage.                                                                                                 |
| `HEAD /health`                     | same as GET                                                                                                                            |                                                                                                                                                                           |
| other methods on `/health`         | `405` + `Allow: GET, HEAD, OPTIONS`                                                                                                    |                                                                                                                                                                           |
| `/agent` and `/agent/*` (any verb) | `401 {"error":"authentication-required"}`                                                                                              | **No credentials are accepted, sniffed, stored or faked.** A `Bearer` header does not change the outcome (tested). The boundary rejects until real authentication exists. |
| `OPTIONS *`                        | `204` + `Allow`, plus CORS headers **only** for a listed origin                                                                        | Preflight fails closed for unknown origins.                                                                                                                               |
| anything else                      | `404 {"error":"not-found"}`                                                                                                            | The requested path is never echoed back.                                                                                                                                  |
| any internal fault                 | `500 {"error":"internal"}`                                                                                                             | Bare body only.                                                                                                                                                           |

Request bodies are never read in Phase 1 — no endpoint accepts input, which
also removes the unbounded-body surface entirely.

## 4. CORS — FAIL CLOSED, EXACT-MATCH ONLY

- `ALLOWED_ORIGINS` is a space-separated list of **exact** origins. An origin
  is served CORS headers only if it appears verbatim; anything else — and an
  unset variable — gets **no** `Access-Control-Allow-Origin` header, so
  cross-origin reads are blocked by the browser.
- `*` is never emitted; even a literal `*` entry in the configuration is
  ignored (tested).
- **Blocker (open):** the production MAP Holding website origin must be
  confirmed by the owner before `ALLOWED_ORIGINS` is set. No domain is
  invented in this repository. Until then the worker is safe but
  cross-origin-inaccessible.

## 5. POLICY AUTHORITY — ONE CONTRACT, TWO RUNTIMES

`worker/policy.ts` imports `src/lib/access/index.ts` directly. Consequences:

1. There is exactly one authorization policy in the project. The worker's
   clearance ceilings, confidential safeguard, entitlement rules and the
   sealed `ClientVisibleResource` type are the _same objects_ the site and
   the existing `access.test.ts` suite use.
2. `AGENT_OPERATIONS` is an empty const tuple and is load-bearing: **no
   business operation exists for the worker to execute.** A future tool
   becomes live only when it is registered there **and** every one of its
   actions passes through `authorizeAgentAction` / `filterAgentVisible`.
3. The worker is configured with no data bindings (no KV, D1/R2, or service
   bindings in `wrangler.json`), so in Phase 1 it is structurally unable to
   read company records of any visibility class.

## 6. SECRET-BINDING CONVENTION (for the future Agnes phase)

| Name              | Kind                           | Set via                                            | Phase 1 status                                               |
| ----------------- | ------------------------------ | -------------------------------------------------- | ------------------------------------------------------------ |
| `AGNES_API_KEY`   | Cloudflare **secret** (hidden) | `wrangler secret put AGNES_API_KEY` (or dashboard) | Named, **not set, not read**. No model configuration exists. |
| `ALLOWED_ORIGINS` | Plain variable                 | `wrangler variables put` / dashboard               | **Not set** pending the confirmed production origin.         |

Rules: secret values never enter the repository, the static bundle, logs, or
error bodies; worker code may read them only server-side; nothing in the
public site may depend on their existence.

## 7. REMAINING PREREQUISITES (blockers, in order)

1. **Production origin confirmation** — MAP Holding supplies the exact
   Cloudflare Pages URL; then `ALLOWED_ORIGINS` is set and a route/domain for
   the worker is added to `wrangler.json`.
2. **Real authentication** — an identity provider for owner/staff/admin
   principals (kinds already exist in the shared contract; no credential
   material exists anywhere yet).
3. **Wiring Agnes Flash** — server-side call in the worker using the
   `AGNES_API_KEY` secret, every data access routed through
   `worker/policy.ts`; no tool outside `AGENT_OPERATIONS`.
4. **Deployment** — `wrangler deploy` (and `wrangler secret put`) are owner
   actions; nothing in this repository deploys itself.

## 8. EXACT NEXT STEP AFTER REAL AUTHENTICATION EXISTS

1. Replace the 401 stub: a thin middleware verifies the provider-issued token
   **server-side only**, then constructs a `Principal` via
   `principal(kind, id, { organisationId, entitlements })` — kind is chosen
   from the provider's claims, never from the request body.
2. Register the first tool in `AGENT_OPERATIONS` (e.g. a read-only
   "list my applications" op), implement it calling
   `filterAgentVisible(principal, records, { now })` and returning only
   `allowed` records.
3. Add that tool's tests beside `worker/test/worker.test.ts` — extend, never
   relax.

**MAP HOLDING — PEOPLE • RESOURCES • OPPORTUNITY — trusted worker foundation,
awaiting origin confirmation and real authentication.**
