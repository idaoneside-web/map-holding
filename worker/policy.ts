/**
 * ============================================================================
 * MAP HOLDING — BUSINESS AGENT WORKER: POLICY CHOKEPOINT  (Phase 1)
 * ============================================================================
 *
 * This module is where every future agent capability is forced through the
 * group's existing access-control contract. It imports the shared contract
 * VERBATIM — `src/lib/access/index.ts` is pure TypeScript with no runtime
 * dependencies, so the worker bundles the same code the site and its test
 * suite use. There is exactly one policy in this project; the worker cannot
 * weaken it because it does not carry a second copy.
 *
 * Phase 3 exposure: ONE advisory capability, no business-system actions.
 *   - `advisory-chat` is registered: an approved internal principal may
 *     receive a model-generated advisory reply. It consumes NO company
 *     records (none exist as data bindings here), performs NO external side
 *     effects, and sends no tools/functions to the model.
 *   - Every FUTURE tool still becomes live only when it is registered in
 *     `AGENT_OPERATIONS` AND gated through `authorizeAgentAction` /
 *     `filterAgentVisible`. Bypassing that chokepoint is a defect by
 *     definition (docs/BUSINESS-AGENT-PHASE-1-TRUSTED-WORKER.md §5).
 *
 * The compile-time guarantees of the shared contract (client sealing,
 * owner-only confidential, grants never raise ceilings) therefore apply to
 * the worker unchanged.
 */

import {
  evaluateAccess,
  filterAuthorized,
  clearanceCeiling,
  principal,
  type AccessContext,
  type AccessControlledResource,
  type AccessDecision,
  type Principal,
} from "../src/lib/access/index.ts";

/**
 * Every business capability the agent may perform, by name.
 *
 * Phase 4: two read-only capabilities:
 *   - `advisory-chat` — pure text generation; no company data, no actions.
 *   - `projects-list` — read-only listing of the group's APPROVED project
 *     records (the single source is `src/content/projects.ts`, imported —
 *     never copied). Every record decision still runs through
 *     `authorizeAgentAction`; no field reaches the caller unless the
 *     shared policy allows the resource.
 * Registering an entry remains a policy decision, not code convenience.
 */
export const AGENT_OPERATIONS = ["advisory-chat", "projects-list"] as const;

/** The first capability. Advisory only — see module header. */
export type AgentOperation = (typeof AGENT_OPERATIONS)[number];

/**
 * Capability registry for the CLIENT assistant surface (`/client-agent/*`).
 * Deliberately SEPARATE from `AGENT_OPERATIONS`: registering a client
 * capability never makes it available to the internal surface, and the
 * client surface exposes no internal data of any kind — not project records,
 * not documents, not rosters. Both registries feed the same single policy
 * authority above whenever they need to decide on a resource.
 */
export const CLIENT_AGENT_OPERATIONS = ["client-advisory-chat"] as const;

/** The client capability. Advisory only: no records, no actions. */
export type ClientAgentOperation = (typeof CLIENT_AGENT_OPERATIONS)[number];

/**
 * Single decision door. Mirrors the shared contract's ordering (public →
 * authenticated → clearance ceiling → confidential safeguard → entitlement →
 * ownership → live grant → deny by default). Callers must treat a non-`allowed`
 * decision as terminal: no fallback, no retry with a wider principal.
 */
export function authorizeAgentAction(
  who: Principal,
  resource: AccessControlledResource,
  context: AccessContext,
): AccessDecision {
  return evaluateAccess(who, resource, context);
}

/** Server-side record filtering for any agent data read. One client's rows can
 * never appear in another client's filtered set, and internal/admin/confidential
 * rows are unreachable for clients whatever grants exist. */
export function filterAgentVisible<T extends AccessControlledResource>(
  who: Principal,
  resources: readonly T[],
  context: AccessContext,
): T[] {
  return filterAuthorized(who, resources, context);
}

/** Re-exports so the handler (and any future tool) reaches the shared
 * contract through THIS module only: one policy, one door. */
export { principal, clearanceCeiling };
export type {
  AccessContext,
  AccessControlledResource,
  Principal,
} from "../src/lib/access/index.ts";
