/**
 * ============================================================================
 * MAP HOLDING — BUSINESS AGENT WORKER: IDENTITY  (Phase 2)
 * ============================================================================
 *
 * How identity is verified — from the current Cloudflare Workers documentation
 * (`developers.cloudflare.com/workers/configuration/cloudflare-access/`) and
 * the installed wrangler configuration schema:
 *
 *   1. Cloudflare Access (Zero Trust) checks every request at the edge BEFORE
 *      the worker runs, when an Access application protects the worker's
 *      destination (e.g. `worker` for this worker's production + preview
 *      URLs). Unauthenticated requests never reach user code.
 *   2. When Access authenticated the invocation, the runtime exposes
 *      `ctx.access`; `await ctx.access.getIdentity()` returns the signed-in
 *      user's verified claims (email, groups, and more). No JWT parsing is
 *      needed or done here.
 *   3. `ctx.access` is `undefined` for a request that did NOT go through
 *      Access. It is a runtime object, not a header: client-supplied headers
 *      (including any `CF-Access-*` string) cannot set or forge it.
 *   4. Locally, `wrangler dev` simulates it via `access.dev { aud, identity }`
 *      in the wrangler config; omitted ⇒ `ctx.access` is undefined, matching
 *      the production unauthenticated case.
 *
 * Consequences enforced here:
 *   - email / role / entitlement / user-id supplied in request bodies or
 *     ordinary client headers are NEVER read;
 *   - owner status is NOT granted by signing in or by email presence: an
 *     identity must appear EXACTLY (case-insensitively) on the OWNERS or
 *     STAFF roster variable, which defaults to empty — i.e. no business role
 *     exists until the owner supplies approved identities;
 *   - nothing in this module grants data access: role mapping only; every
 *     future capability still passes through worker/policy.ts.
 */

import type { AgentEnv } from "./env.ts";

/** The verified identity fields this module consumes. Additional claims
 * (groups, device posture, …) exist on the runtime object but are unused here. */
export interface AccessIdentity {
  readonly email?: string;
  readonly [claim: string]: unknown;
}

/**
 * Minimal structural type for the native `ctx.access` object. Declared here
 * instead of adding a `@cloudflare/workers-types` dependency, so the module
 * stays zero-dependency and testable under plain Node.
 */
export interface AccessCtx {
  /** The Access application's audience tag. */
  readonly aud: string;
  /** The verified identity for this invocation, or null if unavailable. */
  getIdentity(): Promise<AccessIdentity | null>;
}

/** The organisation id all approved internal principals belong to. */
const MAP_HOLDING_ORG = "map-holding";

/** Case-insensitive exact-match roster. Unset ⇒ empty ⇒ nobody has the role. */
function roster(env: AgentEnv, key: "OWNERS" | "STAFF"): ReadonlySet<string> {
  const raw = (env[key] ?? "").toLowerCase();
  return new Set(raw.split(/\s+/).filter((s) => s.length > 0));
}

export type ResolvedPrincipal =
  | { readonly status: "unauthenticated" }
  | {
      /** Signed in through Access, but not on any approved roster. Signing in
       * grants no role: no principal kind and no organisation are assigned. */
      readonly status: "signed-in-unapproved";
      readonly id: string;
    }
  | {
      readonly status: "approved-owner";
      readonly id: string;
      readonly kind: "owner";
      readonly organisationId: string;
    }
  | {
      readonly status: "approved-staff";
      readonly id: string;
      readonly kind: "staff";
      readonly organisationId: string;
    };

/**
 * Client-surface principal. Deliberately structurally smaller than
 * `ResolvedPrincipal`: a client identity carries NO organisation mapping and
 * NO internal clearance — it exists to authorise the client assistant chat
 * only, and nothing on the internal surface ever reads this type.
 */
export type ResolvedClientPrincipal =
  | { readonly status: "unauthenticated" }
  | {
      /** Signed in through Access, but not on the CLIENTS roster. Signing in
       * grants no role on the client surface either. */
      readonly status: "signed-in-unapproved";
      readonly id: string;
    }
  | {
      readonly status: "approved-client";
      readonly id: string;
      readonly kind: "client";
    };

/** The single identity decision point for the INTERNAL surface. `access` is
 * the native Access context passed in by the worker entry (or `null` in
 * Node tests). Returns a fully resolved principal, or an explicit rejection
 * status — never a guess. */
export async function resolvePrincipal(
  access: AccessCtx | null | undefined,
  env: AgentEnv,
): Promise<ResolvedPrincipal> {
  // 1. No Access-authenticated invocation: nothing is identified. This is
  //    also the outcome when the Access application has not been created yet,
  //    and when any spoofed request skips edge verification.
  if (access === undefined || access === null) {
    return { status: "unauthenticated" };
  }

  const identity = await access.getIdentity();
  const email = (identity?.email ?? "").trim().toLowerCase();

  // 2. An Access session without a usable email claim cannot be mapped to a
  //    named principal, so it is treated as unauthenticated — not upgraded.
  if (email.length === 0) {
    return { status: "unauthenticated" };
  }

  // 3. Explicit rosters only. Order matters: a person listed on both rosters
  //    is an owner (the narrower, deliberate list wins).
  if (roster(env, "OWNERS").has(email)) {
    return { status: "approved-owner", id: email, kind: "owner", organisationId: MAP_HOLDING_ORG };
  }
  if (roster(env, "STAFF").has(email)) {
    return { status: "approved-staff", id: email, kind: "staff", organisationId: MAP_HOLDING_ORG };
  }

  // 4. Signed in, not approved: no principal kind, no organisation, no role.
  return { status: "signed-in-unapproved", id: email };
}

/**
 * The identity decision point for the CLIENT assistant surface. Same trust
 * model as the internal one — the verified Access context only, never headers
 * or bodies — but the roster it consults is ONLY `CLIENTS`, and the outcome
 * type cannot express any internal capability. Listing on the CLIENTS roster
 * never changes what `resolvePrincipal` returns: the two decisions are
 * independent and neither reads the other's rosters.
 */
export async function resolveClientPrincipal(
  access: AccessCtx | null | undefined,
  env: AgentEnv,
): Promise<ResolvedClientPrincipal> {
  if (access === undefined || access === null) {
    return { status: "unauthenticated" };
  }

  const identity = await access.getIdentity();
  const email = (identity?.email ?? "").trim().toLowerCase();
  if (email.length === 0) {
    return { status: "unauthenticated" };
  }

  const clients = (env.CLIENTS ?? "").toLowerCase();
  const inRoster = clients
    .split(/\s+/)
    .filter((s) => s.length > 0)
    .includes(email);
  if (inRoster) {
    return { status: "approved-client", id: email, kind: "client" };
  }
  return { status: "signed-in-unapproved", id: email };
}
