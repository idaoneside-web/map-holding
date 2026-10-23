# MAP HOLDING — BUSINESS AGENT, PHASE 3: FIRST WORKING CAPABILITY

> **Status:** implemented locally, validated by tests, not deployed.
> The public site (static export, Gallery, navigation, brand, the six
> approved project records) is unchanged. No Agnes credential values exist
> in this repository.

Predecessors: `docs/BUSINESS-AGENT-PHASE-1-TRUSTED-WORKER.md`,
`docs/BUSINESS-AGENT-PHASE-2-AUTHENTICATION.md`.

Brand statement: **PEOPLE • RESOURCES • OPPORTUNITY**

---

## 1. WHAT WAS BUILT

### 1.1 The internal workspace (site side)

- Route: `/internal/agent` — lives in the existing `(gated)` namespace:
  no-indexed, separate from the client portal, **not linked from the public
  navigation or footer** (navigation is untouched).
- Components (`src/components/agent/`):
  - `AgentWorkspace.tsx` — masthead (agent identity + advisory-only scope
    statement), verified-role chip, refresh action, and the tab bar:
    **Chat · Projects · Documents · Tasks · Team · Business Development ·
    Reports**. The six tool tabs render honest reserved panels ("Reserved —
    no data, no actions in this phase"); none of them contains mock data.
  - `AgentChat.tsx` — conversation area, message composer (Enter to send,
    Shift+Enter for newline), **new-conversation and history** controls
    (browser-local, clearly labelled "kept in this browser only"), and
    explicit states: not-configured · checking · sign-in required ·
    signed-in-unapproved · empty conversation · sending · per-request
    error. No response ever renders as a fake agent reply: a failed
    attempt is stored _marked failed_ and shown with truthful text.
- Service client: `src/components/agent/agentApi.ts` (typed,
  `credentials: "include"` so a Cloudflare Access session on the worker's
  hostname can ride cross-origin; only structured results surface — no
  upstream bodies, headers or error objects).
- Pure logic + storage model: `src/lib/agent/conversations.ts` with unit
  tests (`conversations.test.ts`, run by `npm test`).
- Static deployment-time config: `public/agent-config.json`
  (`workerBaseUrl: null` by default — **no worker URL is invented**; the
  owner sets the deployed origin after deployment, then rebuilds).

### 1.2 The first capability (worker side)

- `POST /agent/chat` — the single registered capability
  (`AGENT_OPERATIONS = ["advisory-chat"]` in `worker/policy.ts`).
  Guard order: identity tiers first (401 unauthenticated · 403
  signed-in-unapproved, including the requester's own verified e-mail),
  then method (POST only), payload hard caps (64 KB, ≤60 messages,
  ≤4000 chars each, roles restricted to user/assistant, must end with a
  user message), then the model call.
- `worker/model.ts` — the ONLY place the Agnes credential is used,
  server-side only. Requires `AGNES_API_KEY` (secret) **and**
  `AGNES_BASE_URL` (owner-supplied variable; nothing in this repository
  invents an endpoint). Model name via optional `AGNES_MODEL`
  (default `agnes-flash`). Unconfigured ⇒ structured 503
  `model-unconfigured`; failure ⇒ 502/504 with non-sensitive detail codes
  only. No tools/functions are sent to the model, and the fixed advisory
  system prompt states the boundary (no company records, no actions).
- CORS now answers credentials-capable for listed origins (required for
  the cross-origin cookie case); the confirmed origin
  `https://map-holding.vercel.app` remains the compiled default;
  wildcards are still impossible.
- `/agent/identity` and `/health` retained; `/health` stays secret-free and
  now reports the advisory capability (capability names only — no roster,
  config or secret state).

## 2. HONEST STATE IN THE CURRENT LOCAL ENVIRONMENT

The Cloudflare Access application, rosters and deployment do not exist yet,
so locally every workspace state is real, not simulated:

| Environment                              | What the UI shows                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------ |
| `workerBaseUrl: null` (default)          | "Agent service not configured" — zero external requests                  |
| configured, no Access sign-in            | "Sign-in required" with instructions; chat disabled                      |
| signed in, e-mail not rostered           | "Signed in — not on an approved roster" (their own address only)         |
| signed in + rostered, model unconfigured | chat enabled; send yields a clear 503-style "model not configured" state |
| fully configured                         | genuine model replies; failures shown truthfully                         |

No mock responses are rendered anywhere; a reply only appears when the
worker returned one.

## 3. VERIFICATION

```
npx tsc --noEmit            → pass (worker + site)
npx eslint .                → pass
npm test                    → access suite + conversations suite, all pass
npm run test:worker         → 34 tests, all pass (incl. new chat boundary tests:
                              401/403 tiers, unconfigured-model 503, stubbed
                              configured response, malformed/oversized payloads,
                              credential-safe preflight, exact model payload)
npm run build               → static export succeeds; /gallery and all public
                              routes unchanged
```

## 4. REMAINING PREREQUISITES (owner/dashboard, in order)

1. Zero Trust enabled; Access application for the worker (destination
   `worker`) with an authentication policy; record its audience tag.
2. `wrangler deploy`; set the variables/secrets: `OWNERS`, `STAFF`
   (approved e-mails; unrostered sign-ins stay at 403), `AGNES_BASE_URL`,
   optional `AGNES_MODEL`, and the `AGNES_API_KEY` secret.
3. Fill `public/agent-config.json` → `workerBaseUrl` with the deployed
   worker origin; rebuild and redeploy the site.
4. Decide the SPA↔worker session pattern if plain cross-site cookies do
   not reach (candidates documented in Phase 2 §4 item 6).

## 5. SINGLE NEXT IMPLEMENTATION STEP

After items 1–3 are live: extend the workspace's Projects panel with the
first **read-only data operation** — register it in `AGENT_OPERATIONS`,
implement it in the worker exclusively through `filterAgentVisible(...)`
against a bound data source, keep the model call tool-free, and extend the
test suites (never relax them). Until then the capability surface is
exactly one: advisory chat, behind the shared access contract.

**MAP HOLDING — PEOPLE • RESOURCES • OPPORTUNITY — first capability shipped;
production prerequisites open.**
