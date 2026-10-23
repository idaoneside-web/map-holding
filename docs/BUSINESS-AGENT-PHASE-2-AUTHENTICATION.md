# MAP HOLDING — BUSINESS AGENT, PHASE 2: AUTHENTICATION BOUNDARY

> **Status:** implemented locally and validated. Not deployed. No Agnes
> connection exists. The public website (static export, Gallery included) is
> unchanged.
>
> Predecessor: `docs/BUSINESS-AGENT-PHASE-1-TRUSTED-WORKER.md` (its CORS
> "origin unconfigured" blocker is RESOLVED by this phase: the owner
> confirmed the website origin as `https://map-holding.vercel.app`).

Brand statement: **PEOPLE • RESOURCES • OPPORTUNITY**

---

## 1. HOW IDENTITY IS VERIFIED (verified against current tooling + docs)

Verified from the installed wrangler 4.145.0 configuration schema and the
current Workers documentation
(`developers.cloudflare.com/workers/configuration/cloudflare-access/`):

1. **Edge verification.** When a Cloudflare Access application protects the
   Worker's destination, every request is checked **before the worker code
   runs**. Unauthenticated requests never reach user code; they get the
   Access login page or a block.
2. **Native identity interface.** On an Access-authenticated invocation the
   runtime exposes `ctx.access` (undefined otherwise). The worker reads the
   verified identity with `await ctx.access.getIdentity()` — email, groups,
   device posture and further claims. No JWT parsing is required or done.
3. **Unforgeable by clients.** `ctx.access` is a runtime object, not an HTTP
   header. Client-supplied `CF-Access-*`/`Authorization`/body values cannot
   create it or alter it. The test suite asserts exactly this (a spoofed
   header set produces 401, not identity).
4. **Local simulation.** `wrangler dev` simulates identities via an
   `access.dev { aud, identity }` block; omitting it makes `ctx.access`
   undefined, matching the production unauthenticated case.

`worker/identity.ts` consumes this single interface and nothing else.

## 2. OWNER / STAFF MAPPING STRATEGY (explicit, documented)

| Principal kind | Source                                                                   | How granted                                 | Default state                    |
| -------------- | ------------------------------------------------------------------------ | ------------------------------------------- | -------------------------------- |
| `owner`        | `OWNERS` env var — space-separated exact e-mails, case-insensitive match | Deliberate roster entry by MAP Holding only | **empty ⇒ no owner exists**      |
| `staff`        | `STAFF` env var — same convention                                        | Deliberate roster entry by MAP Holding only | **empty ⇒ no staff role exists** |

Rules that are enforced in code, not by discipline:

- **Signing in grants nothing.** An Access-authenticated identity that is not
  on a roster gets `403 identity-not-approved` and no principal kind, no
  organisation, no entitlements.
- **Presence of an e-mail does not grant owner.** Only an exact, explicit
  roster entry maps to `owner`.
- **Narrower list wins:** an identity on both rosters resolves to `owner`.
- **Roles are mapping only.** Nothing here grants data access: business
  operations stay disabled (`AGENT_OPERATIONS` remains an empty tuple) and
  any future read still passes through `worker/policy.ts`, which is the
  shared `src/lib/access` contract unchanged.
- **Approved internal principals carry `organisationId = "map-holding"`** so
  future ownership-scoped tools under the shared contract already line up.

The `/agent/identity` endpoint returns the least possible success payload:
`{ kind, id, organisation, approved: true, granted_operations: [] }`. It never
discloses roster contents or other identities. `/health` was checked not to
leak roster state or any e-mail address (tested).

## 3. ENDPOINT CONTRACT (current)

| Request               | Without Access                                                           | Signed in, unapproved       | Approved (owner/staff)      |
| --------------------- | ------------------------------------------------------------------------ | --------------------------- | --------------------------- |
| `GET /agent/identity` | `401 authentication-required` (reason `no-access-identity`)              | `403 identity-not-approved` | `200` principal descriptor  |
| other `/agent/*`      | `401` as above                                                           | `403` as above              | `404 operation-unavailable` |
| `GET /health`         | `200` minimal status (now `authentication: "cloudflare-access-pending"`) | same                        | same                        |
| `OPTIONS`             | `204` preflight, CORS gate                                               | same                        | same                        |

CORS now defaults to the **confirmed origin `https://map-holding.vercel.app`
only** (a compiled default in `worker/handler.ts`); `ALLOWED_ORIGINS` may
override it, wildcard entries are always filtered. CORS remains a browser
restriction — it carries no identity, no roles and no authorization.

## 4. REMAINING DASHBOARD / OWNER PREREQUISITES (not doable from this repo)

1. **Zero Trust enabled on the Cloudflare account** — required before any
   Access application can protect the Worker.
2. **Access application for this Worker** — destination type `worker`
   (protects production + preview URLs of `map-holding-business-agent`),
   with an authentication policy chosen by MAP Holding (Cloudflare-account
   members and/or e-mail-domain sign-in). After creation, record its
   audience tag (`aud`).
3. **Local simulation config (optional, after step 2):** add to `wrangler.json`
   ```jsonc
   "access": { "dev": { "aud": "<your application's audience tag>",
                        "identity": { "email": "boss@example.com" } } }
   ```
   `wrangler dev` then serves that simulated identity; remove the block to
   test the unauthenticated path. The `aud` value must come from the created
   application — nothing here invents it.
4. **Roster approval by MAP Holding** — supply the approved e-mail lists:
   ```
   wrangler variables put OWNERS   # e.g. owner-one@example… (space separated)
   wrangler variables put STAFF    # e.g. worker-one@example… (space separated)
   ```
   Until these are set, signed-in identities get `403` — the secure default.
   Treat the lists as sensitive: keep them out of version control.
5. **Deploy** — `wrangler deploy` (owner action; not performed in this
   repository).
6. **Open design point for the browser integration:** how the Vercel-hosted
   SPA presents an Access-verified session cross-origin to the Worker
   hostname (the Access session cookie is scoped to the Worker's hostname).
   Candidate patterns (cross-site cookies with `credentials: "include"`,
   service-token-style forwarding, or a same-hostname relay) must be chosen
   and documented before the site's client code may call `/agent/*`.

## 5. WHAT THIS PHASE DELIBERATELY DID NOT DO

- No Agnes call, no model configuration, no `AGNES_API_KEY` set or read.
- No business operations: `AGENT_OPERATIONS` is still the empty tuple and
  every `/agent/*` path besides `/agent/identity` reports that no operations
  are registered.
- No data bindings (KV/D1/R2/services), so the worker still cannot read
  company records of any visibility class.
- No change to: public site, Gallery, navigation, brand system, the six
  approved project records, the static export, `src/lib/access/*`, or the
  existing access test suite.

## 6. PRECISE NEXT STEP BEFORE AGNES FLASH CAN BE CONNECTED

1. Complete prerequisites §4.1–§4.5 above (Access app live, rosters set,
   deployed).
2. Register the first read-only operation in `AGENT_OPERATIONS`
   (`worker/policy.ts`), implement it exclusively via
   `filterAgentVisible(principal, records, { now })` where the principal is
   built with the shared contract's `principal(kind, id, {...})` from the
   roster-mapped role — and add tests beside `worker/test/worker.test.ts`
   (extend, never relax).
3. Only then: set the `AGNES_API_KEY` secret and wire the model call inside
   the worker, with every tool result re-passed through
   `authorizeAgentAction`. Agnes receives no company data it has not been
   authorized for, and the model is never given a capability that bypasses
   the shared access contract.

**MAP HOLDING — PEOPLE • RESOURCES • OPPORTUNITY — authentication boundary
implemented; dashboard prerequisites open.**
