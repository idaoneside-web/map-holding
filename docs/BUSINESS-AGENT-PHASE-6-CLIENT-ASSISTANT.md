# MAP HOLDING Business Agent — PHASE 6: NATIVE STYLING + CLIENT ASSISTANT

Two changes: the agent experience now carries the MAP Holding navy
environment end to end, and the client portal gets its own private
advisory assistant that is structurally separated from the owners' agent.

## 1. Owners' workspace restyled native

- `/internal` (the owners' workspace) renders on a `navy-deep` ground:
  `Section tone="navy-deep"` re-points the semantic color tokens, so the
  Business Agent section (`AgentWorkspace`, chat, Projects panel) inherits
  the dark palette automatically instead of sitting on a white app surface.
- The overview view was re-rendered dark-native (same contract content,
  `AccessMatrix` embedded directly) replacing the light `GatedEntry` body
  that would have broken the environment.
- A new `surface` Section tone follows re-pointed tokens, so nested raised
  surfaces adapt to the surrounding dark/light context.
- All agent CSS modules remain token-only (no hard-coded palette), mobile
  behaviour and focus states unchanged.

No production route was added; `/internal` is still the single workspace
page with hash-views (`#overview`, `#agent`).

## 2. Client assistant (distinct experience, no owner permissions)

| Layer | What changed |
| --- | --- |
| `worker/env.ts` | New `CLIENTS` roster variable (default empty ⇒ no client principal exists). |
| `worker/identity.ts` | `resolveClientPrincipal`: same verified-Access trust model, CLIENTS roster only; the outcome type has NO organisation mapping and cannot express internal clearance. |
| `worker/model.ts` | `ModelScope` + `CLIENT_ADVISORY_SYSTEM_PROMPT` — a strictly smaller advisory scope that never claims records or figures. |
| `worker/policy.ts` | `CLIENT_AGENT_OPERATIONS = ["client-advisory-chat"]`, a registry separate from the internal `AGENT_OPERATIONS`. |
| `worker/handler.ts` | New `/client-agent/identity` + `/client-agent/chat` routes. 401/403 tiers before anything else; same payload hard-caps; honest 503/502/504 model states. The internal `/agent/*` tiers are untouched, and a CLIENTS-roster identity still receives 403 on every internal route. |
| Site | `src/components/agent/clientAgentApi.ts` (speaks ONLY to `/client-agent/*`), `ClientAssistant.tsx` (+Panel, own storage key `mh-client-agent:conversations`), `/client-portal/assistant` page inside the existing portal shell, an "Assistant" item in the portal's OWN navigation (public site nav and footer untouched). |

Boundary guarantees:
- The client UI never calls the internal endpoints; the internal UI never
  reads client state. The two surfaces share the worker origin, the static
  config file and the conversation-infra helpers — nothing else.
- No data binding means the assistant has no records of any kind; its
  prompt says exactly that, and the UI repeats it ("This assistant is for
  your account only… no access to internal or company projects").
- Unconfigured service ⇒ the portal assistant shows a "Not configured"
  state and makes zero external calls. No fake replies anywhere.

## 3. Local development without Cloudflare

- `loadAgentServiceConfig` now accepts ONLY `https://` origins plus one
  narrow, explicitly-documented loopback exception:
  `http://127.0.0.1:<port>` / `http://localhost:<port>` — the
  `npm run dev:agent` server. Nothing else ever becomes configured, and
  the committed `public/agent-config.json` keeps `workerBaseUrl: null`.
- The local roster file (`worker/local/dev-users.json`, gitignored) gained
  a `"client"` kind; `dev:agent` translates it into the `CLIENTS` env the
  handler consumes, so the local flow mirrors the production rosters
  exactly. No browser-supplied identity is trusted; the session cookie is
  still server-verified (HMAC + expiry).

Local checklist:
    cp worker/local/dev-users.example.json worker/local/dev-users.json
    # add entries, e.g. { "email": "you@…", "kind": "owner" }, { "email": "a-client@…", "kind": "client" }
    npm run dev:agent                         # http://127.0.0.1:3300
    curl -c cookies -X POST …/dev/auth/login -d '{"email":"a-client@…"}'
    curl -b cookies …/client-agent/identity
    # temporarily set workerBaseUrl to "http://127.0.0.1:3300" in
    # public/agent-config.json for the site UI (local only, don't commit),
    # and MH_AGENT_DEV_ORIGINS to your site's dev origin.

## 4. Verification

- `npm run typecheck`, `npm run lint` clean.
- `npm test` (site), `npm run test:worker` (incl. new /client-agent suite),
  `npm run test:local` (incl. client-roster e2e) all green.
- `npm run build` produces the static export; the owners' workspace and the
  assistant page render on the dark portal/workspace shells, not on a
  separate white app surface.

Nothing here deploys, commits or touches Cloudflare; the six project
records, client portal data boundaries and public navigation are unchanged.
