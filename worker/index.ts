/**
 * ============================================================================
 * MAP HOLDING — BUSINESS AGENT WORKER: ENTRY POINT  (Phase 1 + 2)
 * ============================================================================
 *
 * This is the ONLY Cloudflare Worker in the project. It is a separate
 * service from the public website (which remains a static export on its
 * existing host; this worker adds no dependency on it and vice versa).
 *
 * Phase 2 = authentication boundary only:
 *   - identity comes exclusively from the native Cloudflare Access context
 *     (`ctx.access`, see worker/identity.ts and
 *     docs/BUSINESS-AGENT-PHASE-2-AUTHENTICATION.md);
 *   - still no Agnes calls, no model configuration, no credentials read;
 *   - no data bindings of any kind (no KV/D1/R2/services), so it cannot
 *     read company records or perform operations;
 *   - the authorization authority remains the shared contract in
 *     `src/lib/access/index.ts` via `worker/policy.ts`.
 *
 * The error guard returns a bare 500 body: no stack traces, no binding
 * names, no request details.
 */

import { handleAgentRequest } from "./handler.ts";
import type { AgentEnv } from "./env.ts";
import type { AccessCtx } from "./identity.ts";

export type { AgentEnv } from "./env.ts";
export type { AccessCtx, AccessIdentity } from "./identity.ts";

/**
 * Minimal structural type for the Workers execution context. Declared here
 * (rather than adding a `@cloudflare/workers-types` dependency) so the
 * project stays zero-dependency. `access` is present on this context only
 * when Cloudflare Access authenticated the invocation at the edge; on any
 * other request it is undefined.
 */
interface MapHoldingExecutionContext {
  readonly waitUntil: (promise: Promise<unknown>) => void;
  readonly passThroughOnException: () => void;
  readonly access?: AccessCtx;
}

const worker = {
  async fetch(request: Request, env: AgentEnv, ctx: MapHoldingExecutionContext): Promise<Response> {
    try {
      // `ctx.access` (possibly undefined) is the ONLY identity source.
      return await handleAgentRequest(request, env, ctx.access);
    } catch {
      return new Response(JSON.stringify({ error: "internal" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
  },
};

export default worker;
