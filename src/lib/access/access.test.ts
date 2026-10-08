/**
 * ============================================================================
 * MAP HOLDING — ACCESS BOUNDARY TESTS  (Phase 3 §23)
 * ============================================================================
 *
 * Run with:  npm test        (node --test, native TypeScript type-stripping)
 *
 * These tests use the real contract module and minimal in-memory fixtures. The
 * fixtures exist ONLY here, inside a test: the product contains no fake client
 * records, no fake confidential reports and no fake login (§23).
 *
 * What is being proven — the four claims Phase 3 §12/§15/§18 require:
 *
 *   C1  A client principal can NEVER reach internal, admin or confidential data,
 *       no matter what ownership or grants it holds.
 *   C2  A client only ever sees its OWN records (client-to-client isolation).
 *   C3  An internal principal does not automatically see confidential data.
 *   C4  "Authenticated" does not mean "authorized": an unidentified or
 *       incorrectly owned principal is denied by default.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CLEARANCE_CEILING,
  NEVER_CLIENT_REACHABLE,
  PRINCIPAL_KINDS,
  RESOURCE_KINDS,
  VISIBILITY_LEVELS,
  asClientVisible,
  canReachVisibility,
  clearanceCeiling,
  evaluateAccess,
  filterAuthorized,
  isAuthenticated,
  isInternalPrincipal,
  principal,
  reachableVisibilities,
  type AccessContext,
  type AccessControlledResource,
  type Principal,
  type ResourceKind,
  type Visibility,
} from "./index.ts";

/* ---------------------------------------------------------------------------
 * Fixtures — test-local only.
 * ------------------------------------------------------------------------ */

const NOW: AccessContext = { now: "2026-01-01T00:00:00.000Z" };

const ALICE: Principal = principal("client", "client-alice", {
  organisationId: "org-alpha",
  entitlements: ["portal-access"],
});
const BOB: Principal = principal("client", "client-bob", {
  organisationId: "org-beta",
  entitlements: ["portal-access"],
});

function resource(
  kind: ResourceKind,
  id: string,
  visibility: Visibility,
  extra: Partial<AccessControlledResource> = {},
): AccessControlledResource {
  return { kind, id, visibility, ...extra };
}

/* ---------------------------------------------------------------------------
 * C1 — a client can never reach internal / admin / confidential
 * ------------------------------------------------------------------------ */

test("C1: a client's clearance ceiling is exactly `client`", () => {
  assert.equal(CLEARANCE_CEILING.client, "client");
});

test("C1: every NEVER_CLIENT_REACHABLE class is unreachable for a client principal", () => {
  for (const visibility of NEVER_CLIENT_REACHABLE) {
    assert.equal(
      canReachVisibility("client", visibility),
      false,
      `client must not reach ${visibility}`,
    );
  }
});

test("C1: reachableVisibilities('client') is exactly ['public','client']", () => {
  assert.deepEqual(reachableVisibilities("client"), ["public", "client"]);
});

test("C1: a client is denied unowned internal/admin/confidential records", () => {
  for (const visibility of NEVER_CLIENT_REACHABLE) {
    const decision = evaluateAccess(ALICE, resource("report", "r", visibility), NOW);
    assert.deepEqual(decision, { allowed: false, reason: "insufficient-clearance" });
  }
});

test("C1: an explicit grant can NEVER lift a client into internal or above", () => {
  for (const visibility of NEVER_CLIENT_REACHABLE) {
    const granted = resource("document", "d", visibility, {
      ownerId: ALICE.id,
      ownerOrganisationId: ALICE.organisationId,
      grants: [
        {
          principalId: "client-alice",
          scope: "organisation",
          grantedAt: "2020-01-01T00:00:00.000Z",
          expiresAt: null,
        },
      ],
    });
    const decision = evaluateAccess(ALICE, granted, NOW);
    assert.equal(decision.allowed, false, `grant must not unlock ${visibility}`);
  }
});

test("C1: a client can never be an internal principal", () => {
  assert.equal(isInternalPrincipal(ALICE), false);
  assert.equal(isInternalPrincipal(BOB), false);
  for (const kind of PRINCIPAL_KINDS) {
    const expected = kind === "staff" || kind === "admin" || kind === "owner";
    assert.equal(isInternalPrincipal(principal(kind, "x")), expected, kind);
  }
});

/* ---------------------------------------------------------------------------
 * C2 — client-to-client isolation
 * ------------------------------------------------------------------------ */

test("C2: a client sees its own record", () => {
  const own = resource("application", "app-1", "client", { ownerId: ALICE.id });
  assert.deepEqual(evaluateAccess(ALICE, own, NOW), { allowed: true, via: "ownership" });
});

test("C2: a client is denied another client's record of the same class", () => {
  const alices = resource("application", "app-1", "client", { ownerId: ALICE.id });
  assert.deepEqual(evaluateAccess(BOB, alices, NOW), {
    allowed: false,
    reason: "not-authorized",
  });
});

test("C2: organisation ownership grants access within the org but not across orgs", () => {
  const orgRecord = resource("project", "proj-1", "client", {
    ownerOrganisationId: "org-alpha",
  });
  assert.deepEqual(evaluateAccess(ALICE, orgRecord, NOW), {
    allowed: true,
    via: "ownership",
  });
  assert.equal(evaluateAccess(BOB, orgRecord, NOW).allowed, false);
});

test("C2: a client is denied a partner-visibility record", () => {
  const partnerOnly = resource("report", "partner-brief", "partner");
  assert.equal(evaluateAccess(ALICE, partnerOnly, NOW).allowed, false);
});

test("C2: filtering a mixed list returns only the client's own authorized subset", () => {
  const all: AccessControlledResource[] = [
    resource("report", "public-notice", "public"),
    resource("application", "alice-app", "client", { ownerId: ALICE.id }),
    resource("application", "bob-app", "client", { ownerId: BOB.id }),
    resource("report", "internal-review", "internal"),
    resource("report", "board-pack", "confidential"),
    resource("report", "partner-brief", "partner"),
    resource("report", "admin-config", "admin"),
  ];

  assert.deepEqual(
    filterAuthorized(ALICE, all, NOW).map((r) => r.id),
    ["public-notice", "alice-app"],
  );
  assert.deepEqual(
    filterAuthorized(BOB, all, NOW).map((r) => r.id),
    ["public-notice", "bob-app"],
  );
});

/* ---------------------------------------------------------------------------
 * C3 — internal ≠ confidential
 * ------------------------------------------------------------------------ */

test("C3: staff reach internal but not confidential", () => {
  const staff = principal("staff", "staff-1", { organisationId: "map-holding" });
  assert.equal(canReachVisibility("staff", "internal"), true);
  assert.equal(canReachVisibility("staff", "confidential"), false);

  const internalRecord = resource("report", "ops", "internal", {
    ownerOrganisationId: "map-holding",
  });
  assert.deepEqual(evaluateAccess(staff, internalRecord, NOW), {
    allowed: true,
    via: "ownership",
  });
  assert.deepEqual(evaluateAccess(staff, resource("report", "board", "confidential"), NOW), {
    allowed: false,
    reason: "insufficient-clearance",
  });
});

test("C3: admin does not automatically reach confidential", () => {
  const admin = principal("admin", "admin-1", { organisationId: "map-holding" });
  assert.equal(canReachVisibility("admin", "confidential"), false);
  assert.deepEqual(evaluateAccess(admin, resource("report", "board", "confidential"), NOW), {
    allowed: false,
    reason: "insufficient-clearance",
  });
});

test("C3: only an owner principal passes the confidential safeguard", () => {
  const owner = principal("owner", "owner-1", { organisationId: "map-holding" });
  const confidentialOwned = resource("report", "board", "confidential", {
    ownerOrganisationId: "map-holding",
  });
  assert.deepEqual(evaluateAccess(owner, confidentialOwned, NOW), {
    allowed: true,
    via: "ownership",
  });
  assert.equal(clearanceCeiling("owner"), "confidential");
});

/* ---------------------------------------------------------------------------
 * C4 — authentication is not authorization
 * ------------------------------------------------------------------------ */

test("C4: anonymous reaches public resources only", () => {
  const anonymous = principal("anonymous", null);
  assert.equal(isAuthenticated(anonymous), false);
  assert.deepEqual(evaluateAccess(anonymous, resource("report", "notice", "public"), NOW), {
    allowed: true,
    via: "public-access",
  });
  assert.deepEqual(evaluateAccess(anonymous, resource("application", "app-1", "client"), NOW), {
    allowed: false,
    reason: "not-authenticated",
  });
});

test("C4: an authenticated but unrelated client is denied by default", () => {
  const orphan = resource("document", "d-1", "client");
  assert.deepEqual(evaluateAccess(ALICE, orphan, NOW), {
    allowed: false,
    reason: "not-authorized",
  });
});

test("C4: an expired grant does not authorize", () => {
  const expired = resource("document", "d-2", "client", {
    grants: [
      {
        principalId: "client-alice",
        scope: "resource",
        grantedAt: "2024-01-01T00:00:00.000Z",
        expiresAt: "2025-01-01T00:00:00.000Z",
      },
    ],
  });
  assert.deepEqual(evaluateAccess(ALICE, expired, NOW), {
    allowed: false,
    reason: "not-authorized",
  });
});

test("C4: a live explicit grant does authorize", () => {
  const granted = resource("document", "d-3", "client", {
    grants: [
      {
        principalId: "client-alice",
        scope: "resource",
        grantedAt: "2025-06-01T00:00:00.000Z",
        expiresAt: null,
      },
    ],
  });
  assert.deepEqual(evaluateAccess(ALICE, granted, NOW), {
    allowed: true,
    via: "explicit-grant",
  });
});

/* ---------------------------------------------------------------------------
 * Founding Partners is an entitlement, not a principal kind (§17)
 * ------------------------------------------------------------------------ */

test("§17: founding-partner is an entitlement and is never inferred", () => {
  const plainClient = principal("client", "c-1", { entitlements: ["portal-access"] });
  const foundingClient = principal("client", "c-2", {
    entitlements: ["portal-access", "founding-partner"],
  });

  const fpOnly = resource("opportunity", "fp-deal", "client", {
    requiresEntitlement: "founding-partner",
    ownerId: "c-1",
  });

  // The plain client is denied even though it owns the record.
  assert.deepEqual(evaluateAccess(plainClient, fpOnly, NOW), {
    allowed: false,
    reason: "missing-entitlement",
  });

  // The same record owned by the entitled principal is allowed.
  assert.deepEqual(evaluateAccess(foundingClient, { ...fpOnly, ownerId: "c-2" }, NOW), {
    allowed: true,
    via: "ownership",
  });
});

test("§17: no principal kind or visibility class is named founding-partner", () => {
  assert.equal((PRINCIPAL_KINDS as readonly string[]).includes("founding-partner"), false);
  assert.equal((VISIBILITY_LEVELS as readonly string[]).includes("founding-partner"), false);
});

/* ---------------------------------------------------------------------------
 * Shape guarantees
 * ------------------------------------------------------------------------ */

test("§15: asClientVisible refuses every internal-and-above class", () => {
  for (const visibility of VISIBILITY_LEVELS) {
    const narrowed = asClientVisible(resource("report", "x", visibility));
    if (visibility === "public" || visibility === "client") {
      assert.notEqual(narrowed, null, `${visibility} should be client-visible`);
    } else {
      assert.equal(narrowed, null, `${visibility} must not be client-visible`);
    }
  }
});

test("§14: every resource kind is denied to a client at `internal`", () => {
  assert.ok(RESOURCE_KINDS.length > 0);
  for (const kind of RESOURCE_KINDS) {
    const decision = evaluateAccess(ALICE, resource(kind, `${kind}-1`, "internal"), NOW);
    assert.equal(decision.allowed, false, kind);
  }
});

test("§18: every non-owner principal kind is denied confidential", () => {
  for (const kind of PRINCIPAL_KINDS) {
    if (kind === "owner") continue;
    const who = principal(kind, `${kind}-1`);
    const decision = evaluateAccess(who, resource("report", "board", "confidential"), NOW);
    assert.equal(decision.allowed, false, `${kind} must not reach confidential`);
  }
});
