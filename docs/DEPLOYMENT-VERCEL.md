# MAP HOLDING — Vercel deployment specification (Business Agent)

Scope: the public website + client portal + the owners' Business Agent
workspace at `/internal#agent` on `https://map-holding.vercel.app/`.
The Business Agent is a static-export Next.js site; the agent *service*
(chat + read-only projects, identity-verified) is a separate worker and is
NOT part of this Vercel deployment.

## Why the live site 404'd

The Vercel deployment predates the Business Agent work. The live
`/internal` still serves the pre-agent placeholder page, and
`/client-portal/assistant` does not exist in the deployed build. The agent
implementation (untracked working tree: `src/components/agent/`,
`src/lib/agent/`, `src/app/(portal)/client-portal/assistant/`,
`public/agent-config.json`, modified `/internal` page) has never been
committed or deployed.

## What deploys, and how

- Framework: Next.js static export (`output: "export"` in `next.config.ts`).
  Vercel's Next.js runtime builds `out/` and serves it as static assets.
  No `vercel.json` is required; none is introduced.
- Deployment is from the committed source (git) — or via the `vercel` CLI,
  which additionally honours `.vercelignore`. Either way the dev-only
  files below are excluded:
  - `public/agent-config.local.json` (gitignored; points at
    `http://127.0.0.1:3300` — a local override that must never be
    shipped; in a production build the fetch simply 404s and the site
    runs on `public/agent-config.json` = `workerBaseUrl: null`),
  - `worker/local/local.env`, `worker/local/dev-users.json` (gitignored),
  - `.wrangler/`, `wrangler.json` (Vercel-excluded; Cloudflare worker
    configuration, out of scope for this deployment).
- A locally produced `out/` must never be the deployment artifact: it
  embeds `agent-config.local.json`. Vercel always rebuilds from source.

## Post-deployment route status (expected)

| Route | Status | Serves |
| --- | --- | --- |
| `/` … all public routes | 200 | unchanged public site |
| `/client-portal/*` incl. `/client-portal/assistant` | 200 | client portal + Client Assistant |
| `/internal` and `/internal#agent` | 200 | owners' workspace with Business Agent (chat + read-only Projects tabs) |
| `/agent-config.json` | 200 | `{"workerBaseUrl": null, …}` |
| `/agent-config.local.json` | 404 | file is not present in a production build |

While `workerBaseUrl` is `null`, every agent surface renders its honest
not-configured state and performs no external requests — including the
Client Assistant. No dev sign-in page, synthetic `.local` identities,
session server, or credentials are shipped; the local HMAC session server
(`npm run dev:agent`, loopback only, dev-only endpoints under `/dev/*`)
never exists outside the developer's machine.

## The exact production blocker (nothing invented here)

To make the agent *live* (working chat, identity-verified), someone must
provide:

1. A deployed Business Agent service origin (a worker) fronted by a real
   identity-verification boundary that verifies access before any
   request reaches the handler — the production worker's design
   (`docs/BUSINESS-AGENT-PHASE-2-AUTHENTICATION.md`) is edge-verified,
   stateless, and reads no browser-supplied identities/roles.
2. That origin placed in `public/agent-config.json`
   (`"workerBaseUrl": "https://<deployed-service>"`) and the site
   rebuilt/redeployed. Only https origins are accepted by the site; the
   loopback exception is dev-only and only ever comes from the
   gitignored override file.
3. Agnes model credentials on the service (server-side only:
   `AGNES_API_KEY`, `AGNES_BASE_URL`, optional `AGNES_MODEL`); until
   then chat honestly reports `model-unconfigured` and the read-only
   Projects tab still works.

Owner/staff and client permissions remain separate and are enforced at
the service boundary (distinct operations registries, distinct
rosters); the site itself performs no identity checks and grants no
access — hiding or showing a page changes nothing about authorization.

No credentials, provider URLs, or identity configuration are invented
in this repository; the config file carries `null` until (1)–(3) exist.
