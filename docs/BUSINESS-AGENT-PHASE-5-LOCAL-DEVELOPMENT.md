# MAP HOLDING Business Agent — PHASE 5: LOCAL DEVELOPMENT AUTHENTICATION

Local development now has a genuine sign-in/session mechanism for the
Business Agent, without touching the production security boundary.

## What was added (dev-only; nothing here ships)

| File | Role |
| --- | --- |
| `worker/local/session.ts` | HMAC-SHA256 stateless session tokens (sign / verify, expiry, constant-time). |
| `worker/local/config.ts` | Server-controlled local configuration: roster file, env settings, `assertDevOnly()` guard. |
| `worker/local/server.ts` | Loopback-only Node HTTP server driving the **existing** `handleAgentRequest` pipeline; dev auth endpoints; CLI entry. |
| `worker/local/dev-users.example.json` | Committed roster template — placeholders only, no real people. |
| `worker/local/local.test.ts` | 14 tests: token round-trip/tamper/expiry, production refusal, roster parsing, live sign-in, invalid credentials, empty roster, absent/tampered/expired sessions, role enforcement, CSRF + preflight fail-closed, cookie hygiene. |

- `.gitignore` now ignores `worker/local/dev-users.json` (the private roster).
- `package.json`: `dev:agent` (start the local server), `test:local`.

## Security model

- **Single request pipeline.** The local server does NOT reimplement anything:
  it bridges Node requests into the production `handleAgentRequest` (CORS,
  401/403/200 tiers, shared access contract, project records) unchanged.
  Only the identity source differs: a server-verified local session instead
  of the edge-verified `ctx.access` object. Roster e-mails are translated
  into the same `OWNERS`/`STAFF` env the handler already consumes, so role
  mapping stays in one place (`worker/identity.ts`).
- **Identities come from one source.** The local roster file
  (`worker/local/dev-users.json`, gitignored). Default state = empty roster
  = nobody can sign in. No default e-mail, no hardcoded person. Browser-
  supplied e-mail/role values are never trusted: at sign-in the presented
  address must exactly match a roster entry; afterwards the only claim the
  system uses is inside the signed token. Editing the roster revokes
  access immediately.
- **Session secret.** Per-boot random 32 bytes (memory only), or a stable
  key via `MH_AGENT_DEV_SECRET` (base64, 32 bytes). Never logged, never in
  client code, never in the repo.
- **Cookie.** `mh-agent-dev-session`: `HttpOnly`, `SameSite=Lax`,
  `Path=/`, 12 h `Max-Age`, `Secure` only when `MH_AGENT_DEV_SECURE_COOKIES=1`.
- **CSRF posture.** `SameSite=Lax` stops cross-site cookie carriage on
  POSTs; additionally any request carrying an `Origin` header must match
  the allow-list (`MH_AGENT_DEV_ORIGINS`, space-separated). The agent
  surface also accepts the confirmed production site origin (the same
  default the Worker uses), so a live site pointed at the local server
  keeps working. Preflight is fail-closed exactly like production. No
  Origin header (curl / same origin) passes the gate.
- **Loopback only.** Binds `127.0.0.1` by default (`MH_AGENT_DEV_HOST`
  can move it — keep it local).
- **Production refusal.** `assertDevOnly()` throws when
  `NODE_ENV=production`; the module is not referenced by `worker/index.ts`
  or `wrangler.json`, so a deployed Worker cannot include or start it.
- **Honest model state.** Agnes credentials (`AGNES_API_KEY`,
  `AGNES_BASE_URL`, optional `AGNES_MODEL`) are read from the process
  environment by the server only. Unconfigured ⇒ the existing 503
  `agent-unavailable / model-unconfigured` path. No faked replies.

## Endpoints (local server)

| Endpoint | Purpose |
| --- | --- |
| `POST /dev/auth/login` `{"email":"…"}` | Sign in against the local roster ⇒ 204 + session cookie; 401 generic otherwise. |
| `GET /dev/auth/me` | Session status; off-roster sessions are refused (401). |
| `POST /dev/auth/logout` | Clears the cookie. |
| `/health`, `/agent/*` | Delegates to the production handler unchanged (incl. its preflight), authenticated by the session. |

## Local start command

```bash
# 1. Create your private roster once (never commit it):
cp worker/local/dev-users.example.json worker/local/dev-users.json
#    fill in real addresses, kinds "owner" or "staff", then:

# 2. Start the agent service (port 3300):
npm run dev:agent

# 3. Sign in (keeps the HttpOnly cookie in the shell/session):
curl -c ~/.mh-agent-cookies -X POST http://127.0.0.1:3300/dev/auth/login \
     -H 'content-type: application/json' -d '{"email":"<your-address>"}'

# 4. Exercise the agent surface:
curl -b ~/.mh-agent-cookies http://127.0.0.1:3300/agent/identity
curl -b ~/.mh-agent-cookies http://127.0.0.1:3300/agent/projects
```

For the browser UI: point `public/agent-config.json` `workerBaseUrl` at
`http://127.0.0.1:3300` locally (keep the committed value `null` for
production builds), and set `MH_AGENT_DEV_ORIGINS` to your dev site origin
(e.g. `http://localhost:3000`). A browser visiting the local dev server is
not same-origin with the site, so cross-origin cookie transfer there is
the same open item as the production cross-site session pattern
(Phase 2 §4.6) — sign-in via curl or a one-line script remains the
reliable local path.

### Private configuration required to sign in

| Item | Where | Notes |
| --- | --- | --- |
| Roster | `worker/local/dev-users.json` (gitignored) | `{ "users": [{ "email": "…", "kind": "owner"\|"staff" }] }`. Empty/missing ⇒ nobody signs in. |
| `MH_AGENT_DEV_SECRET` | env / `.env` | Optional; base64 32-byte stable session key. Omit ⇒ fresh key per start (previous sessions die on restart). |
| `MH_AGENT_DEV_PORT` / `MH_AGENT_DEV_HOST` | env | Default `3300` / `127.0.0.1`. |
| `MH_AGENT_DEV_ORIGINS` | env | Space-separated exact origins allowed to send cross-origin requests (site dev origin). |
| `MH_AGENT_DEV_USERS_FILE` | env | Point the roster elsewhere if desired. |
| `AGNES_API_KEY`, `AGNES_BASE_URL`, `AGNES_MODEL` | env / `.env` | Chat only. Absent ⇒ honest 503, never fake replies. |

## Boundaries honoured

- No business write operations; the agent surface is advisory-chat +
  read-only projects-list exactly as registered in `AGENT_OPERATIONS`.
- Public pages, the six project records, `worker/index.ts`,
  `worker/handler.ts`, `worker/identity.ts`, `wrangler.json`, Cloudflare
  configuration: untouched. Production `ctx.access` path intact.
- No new runtime dependencies (Node built-ins only: `http`, `crypto`,
  native Web `Request`/`Response`).
- No deploy, no commit of private configuration.
