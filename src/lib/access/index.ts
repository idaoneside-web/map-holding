/**
 * ============================================================================
 * MAP HOLDING — ACCESS CONTROL CONTRACT  (Phase 3, §11–§19)
 * ============================================================================
 *
 * This module is the *architectural boundary* between what a MAP Holding CLIENT
 * may see and what MAP Holding INTERNAL personnel may see. It contains no
 * authentication, no database, no API and no fake data: it is pure data shape
 * plus a pure decision function, so that a future backend can be wired behind
 * it without renegotiating the model.
 *
 * ---------------------------------------------------------------------------
 * THE FORBIDDEN PATTERN (Phase 3 §18)
 * ---------------------------------------------------------------------------
 *
 *     if (user.loggedIn) showEverything()      // FORBIDDEN. Never do this.
 *
 * The required model is:
 *
 *     authenticate(user)
 *          ↓
 *     identify role
 *          ↓
 *     identify ownership
 *          ↓
 *     identify resource
 *          ↓
 *     evaluate authorization policy
 *          ↓
 *     return only authorized data
 *
 * `evaluateAccess()` below is step 5. `filterAuthorized()` is step 6. Steps 1–3
 * are deliberately absent until Phase 10.
 *
 * ---------------------------------------------------------------------------
 * WHY A CLIENT CAN NEVER SEE INTERNAL DATA (§12)
 * ---------------------------------------------------------------------------
 *
 * Permission is NOT a single ladder where "higher rank sees more". Authorization
 * requires BOTH of two independent conditions:
 *
 *   (a) CLEARANCE — the principal's kind must be allowed to reach the resource's
 *       visibility class at all. `CLEARANCE_CEILING` fixes a hard ceiling per
 *       principal kind that no ownership, grant or entitlement can exceed.
 *   (b) ENTITLEMENT/OWNERSHIP — the principal must additionally own the resource,
 *       share its owning organisation, or hold an explicit unexpired grant.
 *
 * A client's ceiling is `client`, so a client principal fails condition (a) for
 * `internal`, `admin` and `confidential` resources *no matter what grants exist*.
 * That is a property of the types, not of a UI decision, and it is asserted by
 * the test suite in `access.test.ts`.
 *
 * ---------------------------------------------------------------------------
 * NOTE ON SCOPE
 * ---------------------------------------------------------------------------
 * Nothing in the running site currently calls this module to gate content; the
 * public shell is unauthenticated and the gated routes are controlled
 * placeholders. This module exists so the boundary is settled before any
 * backend is written.
 */

/* ===========================================================================
 * 1. VISIBILITY CLASSES  (§13, §15)
 * ======================================================================== */

export const VISIBILITY_LEVELS = [
  "public",
  "client",
  "partner",
  "internal",
  "admin",
  "confidential",
] as const;

export type Visibility = (typeof VISIBILITY_LEVELS)[number];

/**
 * Reachability floor per visibility class.
 *
 * IMPORTANT: this rank is *only* a floor used by the clearance test. It is never
 * on its own sufficient to authorize access, and two classes may share a rank
 * while having entirely different meanings. Never write `rank >= X ⇒ allowed`.
 */
export const VISIBILITY_RANK: Readonly<Record<Visibility, number>> = {
  public: 0,
  client: 1,
  partner: 2,
  internal: 3,
  admin: 4,
  confidential: 5,
};

/** Plain-language meaning of each class, used by the docs surface. */
export const VISIBILITY_MEANING: Readonly<Record<Visibility, string>> = {
  public: "Published to the open web. No principal required.",
  client: "Belongs to one client account. Visible only to that client.",
  partner: "Shared under a partnership relationship, not with clients.",
  internal: "MAP Holding personnel only. Never client-reachable.",
  admin: "Administrative and operational control data. Never client-reachable.",
  confidential: "Highest restriction: board, financial and strategy material.",
};

export function visibilityRank(visibility: Visibility): number {
  return VISIBILITY_RANK[visibility];
}

export function isVisibility(value: unknown): value is Visibility {
  return typeof value === "string" && (VISIBILITY_LEVELS as readonly string[]).includes(value);
}

/**
 * Classes that must be structurally unreachable by a client principal. Exported
 * as a value so both the policy and its tests reference one list.
 */
export const NEVER_CLIENT_REACHABLE = ["internal", "admin", "confidential"] as const;

export type NeverClientReachable = (typeof NEVER_CLIENT_REACHABLE)[number];

/* ===========================================================================
 * 2. PRINCIPAL KINDS  (§11, §17)
 * ======================================================================== */

/**
 * Who is asking.
 *
 * `staff`, `admin` and `owner` are MAP Holding INSIDE. `client` and `partner`
 * are OUTSIDE parties. A client is never an owner, an administrator, internal
 * staff or a founding partner merely by being authenticated (§11).
 */
export const PRINCIPAL_KINDS = [
  "anonymous",
  "client",
  "partner",
  "staff",
  "admin",
  "owner",
] as const;

export type PrincipalKind = (typeof PRINCIPAL_KINDS)[number];

/**
 * The hard clearance ceiling per principal kind (§12, §18).
 *
 * This is the single most important table in the file: it is what makes
 * "logged in ⇒ sees everything" impossible. A `client` principal can never
 * satisfy a resource above `client`, regardless of ownership or grants.
 *
 * `confidential` is reserved for `owner` only. An `admin` deliberately does NOT
 * reach it — the secure default is that board, financial and strategy material
 * requires an explicit owner-level principal.
 */
export const CLEARANCE_CEILING: Readonly<Record<PrincipalKind, Visibility>> = {
  anonymous: "public",
  client: "client",
  partner: "partner",
  staff: "internal",
  admin: "admin",
  owner: "confidential",
};

/**
 * Program memberships. These are GRANTS issued by MAP Holding and are never
 * inferred from a principal kind.
 *
 * Founding Partner membership is an entitlement rather than a principal kind, so:
 *  - a client is not a founding partner unless separately granted (§17);
 *  - an internal user is not a founding partner unless separately granted (§17);
 *  - it can be revoked without changing the principal's identity.
 */
export const ENTITLEMENTS = [
  "portal-access",
  "founding-partner",
  "opportunity-submission",
  "document-exchange",
] as const;

export type Entitlement = (typeof ENTITLEMENTS)[number];

export interface Principal {
  readonly kind: PrincipalKind;
  /** Stable principal identifier. `null` for anonymous. */
  readonly id: string | null;
  /** Client company or partner entity this principal belongs to, if any. */
  readonly organisationId?: string | null;
  /**
   * Explicit program memberships. Empty for visitors and for any principal that
   * has not been individually granted a program.
   */
  readonly entitlements: readonly Entitlement[];
}

export const ANONYMOUS_PRINCIPAL: Principal = {
  kind: "anonymous",
  id: null,
  organisationId: null,
  entitlements: [],
};

/** Convenience constructor for a named principal with no memberships. */
export function principal(
  kind: PrincipalKind,
  id: string | null,
  options: { organisationId?: string | null; entitlements?: readonly Entitlement[] } = {},
): Principal {
  return {
    kind,
    id,
    organisationId: options.organisationId ?? null,
    entitlements: options.entitlements ?? [],
  };
}

/** True when the principal has identified itself. Anonymous never has. */
export function isAuthenticated(who: Principal): boolean {
  return who.kind !== "anonymous" && who.id !== null;
}

export function hasEntitlement(who: Principal, entitlement: Entitlement): boolean {
  return who.entitlements.includes(entitlement);
}

/**
 * Roles that belong to MAP Holding itself. Used to express, in one place, the
 * rule that the internal environment and the client portal are different
 * products (§16).
 */
export function isInternalPrincipal(who: Principal): boolean {
  return who.kind === "staff" || who.kind === "admin" || who.kind === "owner";
}

export function clearanceCeiling(kind: PrincipalKind): Visibility {
  return CLEARANCE_CEILING[kind];
}

/* ===========================================================================
 * 4. AUTHORIZATION POLICY  (§18)
 * ======================================================================== */

export type AllowVia =
  /** The resource is published to the open web. */
  | "public-access"
  /** The principal owns the record, or shares its owning organisation. */
  | "ownership"
  /** An explicit, unexpired grant exists for this principal. */
  | "explicit-grant";

export type DenyReason =
  /** Anonymous principal; the resource is not public. */
  | "not-authenticated"
  /** Principal kind cannot reach this visibility class at all (§12). */
  | "insufficient-clearance"
  /** Confidential safeguard: only an `owner` principal may hold confidential data. */
  | "confidential-safeguard"
  /** Required program membership (e.g. founding-partner) is not held. */
  | "missing-entitlement"
  /** Authenticated, cleared, but neither owner, org member nor grantee. */
  | "not-authorized";

export type AccessDecision =
  | { readonly allowed: true; readonly via: AllowVia }
  | { readonly allowed: false; readonly reason: DenyReason };

export interface AccessContext {
  /** ISO-8601 timestamp used purely to evaluate grant expiry. */
  readonly now: string;
}

function grantIsLive(grant: AccessGrant, who: Principal, now: string): boolean {
  if (grant.principalId !== who.id) return false;
  if (grant.expiresAt && grant.expiresAt <= now) return false;
  return true;
}

/**
 * The authorization policy. Pure, synchronous and side-effect free — deliberately
 * so it can later run on the server, in a route handler, in an API layer or in a
 * test with identical results.
 *
 * Order of evaluation matters and is part of the contract:
 *   1. public            → allow (no principal needed)
 *   2. anonymous         → deny  (not-authenticated)
 *   3. clearance ceiling → deny  (insufficient-clearance)  ← blocks clients from internal
 *   4. confidential      → deny  (confidential-safeguard)  ← belt-and-braces
 *   5. entitlement       → deny  (missing-entitlement)
 *   6. ownership / org   → allow (ownership)
 *   7. live grant        → allow (explicit-grant)
 *   8. otherwise         → deny  (not-authorized)
 */
export function evaluateAccess(
  who: Principal,
  resource: AccessControlledResource,
  context: AccessContext,
): AccessDecision {
  // 1. Public resources are readable by anyone, including anonymous visitors.
  if (resource.visibility === "public") {
    return { allowed: true, via: "public-access" };
  }

  // 2. Everything else requires an identified principal.
  if (!isAuthenticated(who)) {
    return { allowed: false, reason: "not-authenticated" };
  }

  // 3. Clearance ceiling. A client's ceiling is `client`, so this branch is what
  //    makes internal/admin/confidential data unreachable by a client principal.
  if (visibilityRank(resource.visibility) > visibilityRank(clearanceCeiling(who.kind))) {
    return { allowed: false, reason: "insufficient-clearance" };
  }

  // 4. Confidential safeguard. Even if a future change raised a ceiling, this
  //    keeps confidential material owner-only.
  if (resource.visibility === "confidential" && who.kind !== "owner") {
    return { allowed: false, reason: "confidential-safeguard" };
  }

  // 5. Program membership (e.g. Founding Partners) is required on top of clearance.
  if (resource.requiresEntitlement && !hasEntitlement(who, resource.requiresEntitlement)) {
    return { allowed: false, reason: "missing-entitlement" };
  }

  // 6. Ownership, by person or by organisation. This is the branch that isolates
  //    one client from another client's records.
  if (resource.ownerId && who.id === resource.ownerId) {
    return { allowed: true, via: "ownership" };
  }
  if (
    resource.ownerOrganisationId &&
    who.organisationId &&
    who.organisationId === resource.ownerOrganisationId
  ) {
    return { allowed: true, via: "ownership" };
  }

  // 7. Explicit additive grants.
  const grants = resource.grants ?? [];
  if (grants.some((grant) => grantIsLive(grant, who, context.now))) {
    return { allowed: true, via: "explicit-grant" };
  }

  // 8. Deny by default.
  return { allowed: false, reason: "not-authorized" };
}

/**
 * Step 6 of the required pipeline: return ONLY authorized data.
 * Filtering must happen server-side; hiding UI elements is explicitly not
 * authorization (§12). This function is the single place that decision lives.
 */
export function filterAuthorized<T extends AccessControlledResource>(
  who: Principal,
  resources: readonly T[],
  context: AccessContext,
): T[] {
  return resources.filter((resource) => evaluateAccess(who, resource, context).allowed);
}

/** True when the principal may reach the class at all — independent of ownership. */
export function canReachVisibility(kind: PrincipalKind, visibility: Visibility): boolean {
  return visibilityRank(visibility) <= visibilityRank(clearanceCeiling(kind));
}

/** Every visibility class a given principal kind can EVER reach. */
export function reachableVisibilities(kind: PrincipalKind): Visibility[] {
  return VISIBILITY_LEVELS.filter((level) => canReachVisibility(kind, level));
}

/**
 * The things access is decided about. Every one of these will eventually carry
 * an access policy; none of them exists as a store yet.
 */
export const RESOURCE_KINDS = [
  "application",
  "project",
  "document",
  "message",
  "notification",
  "report",
  "opportunity",
  "partner-record",
  "profile",
] as const;

export type ResourceKind = (typeof RESOURCE_KINDS)[number];

/**
 * An explicit, auditable permission. Grants are additive; they never raise a
 * principal's clearance ceiling.
 */
export interface AccessGrant {
  /** The principal the grant is issued to. */
  readonly principalId: string;
  /** Narrower than a whole resource when `scope` is `document`. */
  readonly resourceId?: string;
  /** `resource` = this one item; `organisation` = everything owned by an org. */
  readonly scope: "resource" | "organisation";
  /** ISO-8601 timestamp. */
  readonly grantedAt: string;
  /** ISO-8601 timestamp, or `null` for a non-expiring grant. */
  readonly expiresAt?: string | null;
}

/**
 * The minimum shape every access-controlled record must expose. `visibility` is
 * mandatory so a resource can never be created without a decision about who may
 * read it (a "deny by default" posture).
 */
export interface AccessControlledResource {
  readonly kind: ResourceKind;
  readonly id: string;
  readonly visibility: Visibility;
  /** Principal that owns the record, when ownership is by person. */
  readonly ownerId?: string | null;
  /** Organisation that owns the record, when ownership is by company. */
  readonly ownerOrganisationId?: string | null;
  /** Extra program membership required on top of ownership. */
  readonly requiresEntitlement?: Entitlement;
  /** Explicit additive grants. */
  readonly grants?: readonly AccessGrant[];
}

/**
 * The only resource shape a client-facing surface may ever render.
 *
 * The assertion below is enforced by the compiler: if anyone widens the
 * visibility union here to include `internal`, `admin` or `confidential`,
 * `tsc --noEmit` fails. That turns "clients must never see internal data" from a
 * convention into a build error.
 */
export type ClientVisibleResource = AccessControlledResource & {
  readonly visibility: "public" | "client";
};

type ClientVisibleLeaks = Extract<ClientVisibleResource["visibility"], NeverClientReachable>;

/** Resolves to `true` only while `ClientVisibleResource` excludes every
 *  `NEVER_CLIENT_REACHABLE` class. */
const CLIENT_VISIBLE_IS_SEALED: ClientVisibleLeaks extends never ? true : false = true;
void CLIENT_VISIBLE_IS_SEALED;

/** Narrows a resource to `ClientVisibleResource`, or `null` if it is not. */
export function asClientVisible(resource: AccessControlledResource): ClientVisibleResource | null {
  return resource.visibility === "public" || resource.visibility === "client"
    ? (resource as ClientVisibleResource)
    : null;
}
