# MAP HOLDING — ACCESS CONTROL ARCHITECTURE

> **Phase 3 deliverable.** Architecture and contracts only.
> **No authentication, no sessions, no database, no API and no portal UI exist yet.**
>
> Source of truth for the contract: `src/lib/access/index.ts`
> Executable proof: `src/lib/access/access.test.ts` (`npm test`)

Brand statement: **PEOPLE • RESOURCES • OPPORTUNITY**

---

## 1. WHY THIS DOCUMENT EXISTS BEFORE ANY BACKEND

Phase 3 §11–§19 require the client/internal boundary to be settled **before** a
single endpoint, table or login screen is written. The reason is that the most
expensive class of security defect in a client portal is not a broken
authentication flow — it is a data model that cannot express "this client must
never see that record". Once a schema exists without a visibility class and an
ownership column, every later feature has to be retro-fitted, and the retrofit
always leaks.

So this phase produces:

1. a **type-level contract** for principals and resources;
2. a single pure **policy function** that decides access;
3. a **test suite** that fails if the client/internal boundary ever weakens;
4. this document, which states the rules the eventual API must enforce.

It deliberately produces **no** authentication, **no** database, **no** fake
endpoints and **no** fake client data.

---

## 2. THE FORBIDDEN PATTERN

This is explicitly forbidden (Phase 3 §18):

```ts
// NEVER DO THIS
if (user.loggedIn) {
  return everything();
}
```

"Logged in" is a statement about identity. "Allowed to read this record" is a
statement about role, ownership, resource and policy. They are not the same
question, and conflating them is the defect this architecture exists to prevent.

The required pipeline:

```
authenticate(user)
      ↓
identify role            (client / partner / staff / admin / owner)
      ↓
identify ownership       (who or which organisation owns the record)
      ↓
identify resource        (kind + visibility class)
      ↓
evaluate authorization policy
      ↓
return only authorized data
```

`evaluateAccess()` implements step 5. `filterAuthorized()` implements step 6.
Steps 1–3 are **not implemented** and belong to a later phase.

---

## 3. PRINCIPAL CATEGORIES

A _principal_ is whoever or whatever is asking. Six kinds, no more:

| Kind        | Side    | Description                                                                 |
| ----------- | ------- | --------------------------------------------------------------------------- |
| `anonymous` | outside | Not identified. Visitors, crawlers, unauthenticated requests.               |
| `client`    | outside | A registered MAP Holding client. **Never** internal, **never** an owner.    |
| `partner`   | outside | An entity under a partnership relationship.                                 |
| `staff`     | inside  | MAP Holding personnel.                                                      |
| `admin`     | inside  | Administrative/operational control.                                         |
| `owner`     | inside  | The highest-trust principal. The only kind that may hold confidential data. |

A principal carries:

```ts
interface Principal {
  kind: PrincipalKind;
  id: string | null; // null for anonymous
  organisationId?: string | null; // client company / partner entity
  entitlements: readonly Entitlement[]; // explicit programme memberships
}
```

Two rules follow directly from this shape:

- **A client is not an owner, an administrator, an internal user or a founding
  partner merely by being authenticated.** Those are different `kind` values or
  separate entitlements.
- **`isInternalPrincipal()` is false for `client` and `partner`.** The internal
  environment is not a client product with extra menus.

---

## 4. RESOURCE CATEGORIES

| Kind             | Typically belongs to                                       |
| ---------------- | ---------------------------------------------------------- |
| `application`    | One client principal                                       |
| `project`        | A client organisation, a partner, or MAP Holding           |
| `document`       | Whoever it was released to, or its owning organisation     |
| `message`        | The intended recipient(s)                                  |
| `notification`   | The intended recipient                                     |
| `report`         | MAP Holding, a client, or a partner — depends on its class |
| `opportunity`    | Public, client-scoped or programme-scoped                  |
| `partner-record` | A partner entity                                           |
| `profile`        | One principal                                              |

Every access-controlled record must expose at least:

```ts
interface AccessControlledResource {
  kind: ResourceKind;
  id: string;
  visibility: Visibility; // MANDATORY — no default
  ownerId?: string | null; // ownership by person
  ownerOrganisationId?: string | null; // ownership by company
  requiresEntitlement?: Entitlement; // e.g. founding-partner
  grants?: readonly AccessGrant[]; // explicit, additive, auditable
}
```

---

## 5. VISIBILITY CLASSES

Six classes, ordered. The order matters, but **only as a reachability floor** —
never as a standalone authorization decision.

| Class          | Meaning                                                      | Client-reachable? |
| -------------- | ------------------------------------------------------------ | ----------------- |
| `public`       | Published to the open web. No principal required.            | yes               |
| `client`       | Belongs to one client account. Visible only to that client.  | yes               |
| `partner`      | Shared under a partnership relationship, not with clients.   | **no**            |
| `internal`     | MAP Holding personnel only.                                  | **never**         |
| `admin`        | Administrative and operational control data.                 | **never**         |
| `confidential` | Highest restriction: board, financial and strategy material. | **never**         |

`NEVER_CLIENT_REACHABLE = ["internal", "admin", "confidential"]`.

**Never write `rank >= X ⇒ allowed`.** The rank is only used to answer "can this
principal kind reach this class at all?". Ownership and grants are decided
separately and cannot override the answer.

---

## 6. CLEARANCE CEILINGS — THE CORE GUARANTEE

This table is the mechanism that makes "logged in ⇒ sees everything"
structurally impossible:

| Principal kind | Ceiling        |
| -------------- | -------------- |
| `anonymous`    | `public`       |
| `client`       | **`client`**   |
| `partner`      | `partner`      |
| `staff`        | `internal`     |
| `admin`        | `admin`        |
| `owner`        | `confidential` |

Consequences, all of which are asserted by tests:

- A **client's ceiling is `client`**. No ownership, organisation match or grant
  can raise it. A client principal therefore fails the clearance test for
  `internal`, `admin` and `confidential` resources **unconditionally**.
- **`staff` does not reach `confidential`.** Internal staff read internal
  material, not board or financial material.
- **`admin` does not reach `confidential` either.** The secure default is that
  confidential material requires an explicitly owner-level principal. A future
  requirement may narrow this further; it must never be widened by accident.
- **`confidential` is owner-only** and is additionally protected by a second,
  independent check (`confidential-safeguard`) so that if a ceiling were ever
  raised in error, confidential material would still not become readable.

---

## 7. OWNERSHIP MODEL

Ownership is the mechanism that isolates one client from another. Two forms:

- **By principal** — `ownerId` equals the principal's `id`.
- **By organisation** — `ownerOrganisationId` equals the principal's
  `organisationId`. This is how two colleagues at the same client company share
  a project, while a different company does not.

Ownership is evaluated **after** clearance and therefore can never raise a
principal above its ceiling.

---

## 8. ENTITLEMENTS — FOUNDING PARTNERS

Founding Partner membership is an **entitlement**, not a principal kind and not
a visibility class:

```ts
entitlements: ["portal-access", "founding-partner", ...]
```

This shape was chosen deliberately (Phase 3 §17):

- **A client is not a founding partner** unless a separate, auditable grant says
  so. The plain client is denied even when it owns the record.
- **An internal user is not a founding partner** either. Employment and
  programme membership are different facts.
- **The entitlement is additive only.** It never raises a clearance ceiling, so
  it cannot expose internal or confidential material.
- **It is revocable** without changing the principal's identity.

Because `founding-partner` is neither a kind nor a class, a grep of the contract
cannot find it where a reader might expect a role — which is the point:
membership is data about a person, not a position in the hierarchy.

---

## 9. GRANTS

An `AccessGrant` is an explicit, auditable permission:

```ts
{ principalId, resourceId?, scope: "resource" | "organisation", grantedAt, expiresAt }
```

- Grants are checked **for expiry**; an expired grant does not authorize.
- A grant is checked only after clearance, so **a grant can never lift a client
  into `internal`, `admin` or `confidential`.**
- Grants are additive and never subtractive from the clearance test.

---

## 10. CLIENT ISOLATION

A client must be able to see (Phase 3 §12):

- their own account
- their own application and its status
- projects they are authorized to see
- documents explicitly released to them
- messages intended for them
- notifications intended for them
- their own permitted project information

A client must **never** see:

- confidential MAP Holding reports
- internal reports
- internal financial information
- internal assessments
- internal strategy
- internal notes
- other clients' information
- other clients' documents
- internal project reports
- confidential partner information
- administrator information

Isolation is not a UI concern. It is enforced by `filterAuthorized()` running
server-side before data leaves the boundary.

---

## 11. EVALUATION ORDER

Order matters, and it is part of the contract:

| #   | Test                           | Outcome                                |
| --- | ------------------------------ | -------------------------------------- |
| 1   | `visibility === "public"`      | allow (`public-access`)                |
| 2   | principal not authenticated    | deny (`not-authenticated`)             |
| 3   | clearance ceiling exceeded     | deny (`insufficient-clearance`)        |
| 4   | `confidential` and not `owner` | deny (`confidential-safeguard`)        |
| 5   | required entitlement not held  | deny (`missing-entitlement`)           |
| 6   | owner / same organisation      | allow (`ownership`)                    |
| 7   | live, unexpired grant          | allow (`explicit-grant`)               |
| 8   | anything else                  | deny (`not-authorized`) — deny default |

Two properties are visible in this ordering and both matter:

- **Clearance is tested before ownership and before grants.** This is why a
  client cannot reach internal data "because it owns the record".
- **The entitlement test comes before ownership.** A record that requires
  `founding-partner` is denied to its own owner if the entitlement is absent.

---

## 12. TWO DIFFERENT PRODUCTS

|                       | Client Portal                            | Internal MAP Holding                               |
| --------------------- | ---------------------------------------- | -------------------------------------------------- |
| Answers               | "What is this client authorized to see?" | "What is MAP Holding personnel authorized to see?" |
| Principal kinds       | `client`                                 | `staff`, `admin`, `owner`                          |
| Namespace             | `/client-portal`                         | separate                                           |
| Data scope            | Their own records only                   | Group-wide, per-role                               |
| Shares with the other | The brand foundation, and nothing else   | —                                                  |

They are **not one application with different menus**. The internal environment
is not built in Phase 3 and is not scaffolded as a route.

---

## 13. FUTURE API ENFORCEMENT REQUIREMENTS

When the backend is built, the following are **requirements**, not suggestions:

1. **Every read path applies the policy.** No endpoint may return an
   access-controlled record without a policy decision. There must be one chokepoint,
   not per-handler checks.
2. **Filter, do not hide.** Records the principal may not read are never
   serialized to the client. Hiding in the browser is not authorization.
3. **`visibility` is non-nullable in the schema.** A record cannot be created
   without a class.
4. **Ownership is set by the server, never by the client.** A request body must
   never be able to set `ownerId` or `ownerOrganisationId`.
5. **Anonymous requests see `public` only.** Any endpoint that can return a
   non-public record must reject anonymous principals before hitting the store.
6. **Access decisions are logged.** Every `evaluateAccess` result that matters —
   especially denials on `internal`-and-above — should be auditable.
7. **Do not add a super-principal role.** If a genuine need appears, model it as
   a named entitlement with an expiry, not as a kind with no ceiling.
8. **Confidential never becomes "admin-readable" by accident.** Widening the
   `admin` ceiling requires a deliberate change to `CLEARANCE_CEILING` _and_
   removes the belt-and-braces `confidential-safeguard` check.
9. **Tests are the gate.** `src/lib/access/access.test.ts` must be extended, not
   relaxed, as the model grows. `npm test` runs in the build pipeline.

---

## 14. WHAT IS DELIBERATELY NOT BUILT

| Not built                     | Phase |
| ----------------------------- | ----- |
| Authentication provider       | later |
| Sessions, cookies, tokens     | later |
| Database, schema, migrations  | later |
| API routes and server actions | later |
| Client portal UI              | later |
| Internal dashboard            | later |
| Founding Partners environment | later |
| Audit log storage             | later |

There is **no login form** anywhere in this project, and no code path that
fakes a credential check.

---

## 15. WHERE THE CONTRACT LIVES

| Artifact                     | Path                                    |
| ---------------------------- | --------------------------------------- |
| Contract (types + policy)    | `src/lib/access/index.ts`               |
| Executable proof             | `src/lib/access/access.test.ts`         |
| This document                | `docs/ACCESS-CONTROL-ARCHITECTURE.md`   |
| Public/private surface split | `src/app/(public)/`, `src/app/(gated)/` |

The gated routes are **publicly routable entry points** in Phase 3 — there is no
authentication yet — but they are a separate route group so that the future
portal shell replaces that group's shell instead of retro-fitting the public
one, and so that nothing in the group is ever indexed.

---

**MAP HOLDING — PEOPLE • RESOURCES • OPPORTUNITY**
