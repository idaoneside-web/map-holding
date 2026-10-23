/**
 * ============================================================================
 * MAP HOLDING — BUSINESS AGENT WORKER: ENVIRONMENT CONTRACT  (Phase 1 + 2)
 * ============================================================================
 *
 * This file defines the *names* of the worker's environment bindings — never
 * their values. No value in this repository is a credential.
 *
 * Secret-binding convention (enforced by convention + docs, not by code):
 *
 *   - Cloudflare secrets (hidden, set only via the dashboard or
 *     `wrangler secret put <NAME>`; never committed, never printed):
 *       AGNES_API_KEY     — the Agnes model credential. Read ONLY by the
 *                           server-side model client (worker/model.ts).
 *   - Plain variables (owner-supplied values, set via the dashboard or
 *     `wrangler variables put`; never committed):
 *       ALLOWED_ORIGINS   — space-separated exact-origin allow-list for
 *                           CORS. May override the compiled default
 *                           (https://map-holding.vercel.app, owner-confirmed
 *                           in Phase 2). A `*` entry is filtered out: a
 *                           wildcard is never honoured.
 *       OWNERS            — space-separated, exact e-mail addresses mapped to
 *                           principal kind `owner`. Default: UNSET ⇒ nobody
 *                           holds the owner role.
 *       STAFF             — space-separated, exact e-mail addresses mapped to
 *                           principal kind `staff`. Default: UNSET ⇒ nobody
 *                           holds the staff role.
 *       CLIENTS           — space-separated, exact e-mail addresses mapped to
 *                           principal kind `client` on the CLIENT assistant
 *                           surface (/client-agent/* only). A client identity
 *                           NEVER grants internal/owner access: the client
 *                           surface exposes no internal data at all. Default:
 *                           UNSET ⇒ no client principal exists.
 *       AGNES_BASE_URL    — base URL of the Agnes model API (owner-supplied;
 *                           nothing in this repository invents one). While
 *                           unset, /agent/chat reports the structured
 *                           "model-unconfigured" state instead of guessing.
 *       AGNES_MODEL       — optional model name. Default when unset:
 *                           "agnes-flash".
 *
 * Identity itself is NOT taken from environment or request headers: it comes
 * exclusively from the native Cloudflare Access context (`ctx.access`), see
 * worker/identity.ts. The rosters above only decide which verified identity
 * receives which principal kind; signing in alone grants nothing.
 *
 * The worker is configured with NO data bindings (no KV, no D1/R2, no
 * service bindings), so it is structurally unable to read company records
 * or perform business operations.
 */

export interface AgentEnv {
  /**
   * Space-separated list of exact website origins allowed to read this
   * worker's JSON responses cross-origin. Exact-match only; a wildcard is
   * never accepted and never emitted. Unset ⇒ the compiled default
   * (CONFIRMED_WEBSITE_ORIGIN) applies.
   */
  readonly ALLOWED_ORIGINS?: string;

  /** Space-separated exact e-mail addresses approved for the `owner` kind.
   * Case-insensitive match. Unset ⇒ no owner exists (the safe default). */
  readonly OWNERS?: string;

  /** Space-separated exact e-mail addresses approved for the `staff` kind.
   * Case-insensitive match. Unset ⇒ no staff role exists (the safe default). */
  readonly STAFF?: string;

  /** Space-separated exact e-mail addresses approved for the `client` kind,
   * on the client assistant surface ONLY. A listed address never gains
   * owner/staff capability, and the client surface exposes no internal data.
   * Case-insensitive match. Unset ⇒ no client principal exists. */
  readonly CLIENTS?: string;

  /**
   * The Agnes model credential, held as a Cloudflare secret. Read ONLY by
   * the server-side model client; never echoed into responses, errors or
   * logs. Unset ⇒ /agent/chat reports "model-unconfigured" (no guesses).
   */
  readonly AGNES_API_KEY?: string;

  /** Base URL of the Agnes model API (owner-supplied plain variable).
   * Unset ⇒ no live responses possible; structured unconfigured state. */
  readonly AGNES_BASE_URL?: string;

  /** Optional model name; defaults to "agnes-flash" when unset. */
  readonly AGNES_MODEL?: string;
}
