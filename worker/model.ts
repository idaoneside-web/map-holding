/**
 * ============================================================================
 * MAP HOLDING — BUSINESS AGENT WORKER: MODEL CLIENT  (Phase 3)
 * ============================================================================
 *
 * The ONLY place in the project where the Agnes credential is used, and it
 * runs server-side only: the browser never sees `AGNES_API_KEY`, and the
 * worker's responses never include credential material, upstream error
 * bodies, or stack traces.
 *
 * Contract notes:
 *   - The Agnes Flash endpoint is treated as an OpenAI-compatible
 *     `/chat/completions` API. The base URL is OWNER-SUPPLIED via
 *     `AGNES_BASE_URL` (nothing in this repository invents one); if the real
 *     API differs, this single module is the only thing that changes.
 *   - `AGNES_API_KEY` + `AGNES_BASE_URL` missing ⇒ a structured
 *     "model-unconfigured" outcome. No fallback provider, no mock reply,
 *     no invented endpoint.
 *   - The system prompt is fixed here (advisory scope). It states the
 *     honest boundary: the agent has no company records and performs no
 *     actions in this phase.
 *   - No tools/functions are sent with the request: the model cannot
 *     trigger business-system side effects.
 */

import type { AgentEnv } from "./env.ts";

export interface ChatMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}

export type ModelOutcome =
  | { readonly ok: true; readonly reply: string; readonly model: string }
  | {
      readonly ok: false;
      readonly reason: "model-unconfigured" | "model-error" | "model-timeout";
      /** Non-sensitive detail only: an upstream status number or a short
       * classification. Never response bodies, headers or credentials. */
      readonly detail?: string;
    };

export type ModelScope = "owner" | "client";

export interface ModelClient {
  /** `scope` selects the fixed advisory system prompt; default is the owner
   * scope. `projectContext` is the policy-authorized record block, passed
   * ONLY by the internal surface — the client surface never calls with one.
   * Existing two-argument implementations remain assignable. */
  (
    env: AgentEnv,
    messages: readonly ChatMessage[],
    scope?: ModelScope,
    projectContext?: string,
  ): Promise<ModelOutcome>;
}

/** The advisory scope, stated plainly to the model at every call. The
 * authorized project records may travel as a separate context block: the
 * prompt says the model may state only what that block contains. */
export const ADVISORY_SYSTEM_PROMPT =
  "You are the MAP Holding Business Agent, an internal advisory assistant for MAP Holding owners and staff. " +
  "MAP Holding is a diversified holding platform whose stated areas are mining and minerals (gold, lithium, basalt), " +
  "energy and infrastructure, real estate and materials, industrial manufacturing, technology and innovation, " +
  "and strategic development. " +
  "You may be given a separate context block of APPROVED PROJECT RECORDS. Treat that block as the ONLY " +
  "authoritative source for project facts: state nothing about projects that it does not contain, and where " +
  "a record has no detail, say none is supplied. " +
  "You have NO access to any other company records, documents or systems, and you can perform NO actions " +
  "(no e-mail, no data changes, no external calls). If a question requires data you do not have, say so and " +
  "advise what should be consulted instead. Be concise, factual and professional.";

/** The CLIENT advisory scope: a strictly smaller surface. The model is told
 * it represents no group data and must steer questions toward the client's
 * own portal materials and human contact — never invent records, statuses,
 * dates, figures or project details. */
export const CLIENT_ADVISORY_SYSTEM_PROMPT =
  "You are the MAP Holding Client Assistant, an advisory helper for a signed-in MAP Holding client. " +
  "You have NO access to any company records, client records, project data, documents or systems, and you " +
  "perform NO actions. You may only offer general, clearly-labelled guidance: how the client portal works, " +
  "what its common terms mean, and how the client should request information from MAP Holding. Never state " +
  "specific figures, dates, statuses or project details as fact; when a question needs the client's own " +
  "records, point them to their portal or a MAP Holding contact instead. Be concise, factual and professional.";

/** Default model name when `AGNES_MODEL` is unset. */
export const DEFAULT_MODEL_NAME = "agnes-flash";

/** How many trailing conversation turns are sent with each request. */
const MAX_CONTEXT_MESSAGES = 30;

const REQUEST_TIMEOUT_MS = 60_000;

/** Structural extraction of `choices[0].message.content` from a
 * `/chat/completions`-shaped response; anything else is a model-error. */
function extractReply(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const message = (choices[0] as { message?: unknown } | null)?.message;
  if (typeof message !== "object" || message === null) return null;
  const content = (message as { content?: unknown }).content;
  return typeof content === "string" && content.length > 0 ? content : null;
}

/** The production client. Injectable in tests via the handler's options. */
export const liveModelClient: ModelClient = async (env, messages, scope = "owner", projectContext) => {
  const systemPrompt = scope === "client" ? CLIENT_ADVISORY_SYSTEM_PROMPT : ADVISORY_SYSTEM_PROMPT;
  // Structural guard: record context is owner-surface-only. Even if a caller
  // ever mis-passed it, the client scope sends no records to the model.
  const recordsBlock = scope === "owner" && projectContext && projectContext.length > 0 ? projectContext : null;
  const key = (env.AGNES_API_KEY ?? "").trim();
  const base = (env.AGNES_BASE_URL ?? "").trim().replace(/\/+$/, "");
  const model = (env.AGNES_MODEL ?? "").trim() || DEFAULT_MODEL_NAME;

  // Unconfigured ⇒ a clean structured state, not a guess.
  if (key.length === 0 || base.length === 0) {
    return { ok: false, reason: "model-unconfigured" };
  }

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...(recordsBlock ? [{ role: "system" as const, content: recordsBlock }] : []),
          ...messages.slice(-MAX_CONTEXT_MESSAGES),
        ],
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      return { ok: false, reason: "model-error", detail: `upstream-http-${res.status}` };
    }
    const reply = extractReply(await res.json());
    if (reply === null) {
      return { ok: false, reason: "model-error", detail: "unexpected-response-shape" };
    }
    return { ok: true, reply, model };
  } catch (err) {
    // Only classification crosses this boundary — never the error object.
    if (err instanceof Error && err.name === "TimeoutError") {
      return { ok: false, reason: "model-timeout" };
    }
    return { ok: false, reason: "model-error", detail: "network" };
  }
};
