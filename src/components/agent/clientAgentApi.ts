/**
 * MAP HOLDING — CLIENT ASSISTANT: service client (Phase 6).
 *
 * A DISTINCT client of the same Business Agent Worker, used only by the
 * client portal's assistant surface. It deliberately mirrors the internal
 * client's shape but speaks to the `/client-agent/*` endpoints ONLY:
 *
 *   - No function in this module ever calls `/agent/*` — the internal
 *     surface's operations (advisory-chat, projects-list) are unreachable
 *     from the client experience, whatever its status.
 *   - The identity verdict is `kind: "client"` only; there is no owner or
 *     staff state here, because the client surface never resolves them.
 *   - The service origin comes from the SAME static `public/agent-config.json`
 *     (loopback origins are accepted for local development), never invented.
 *   - Only structured outcomes cross the boundary; upstream bodies, headers
 *     and error objects never surface. A reply is rendered ONLY when the
 *     worker returned a genuine model response.
 */

import type { ChatRole } from "@/lib/agent/conversations";
import { loadAgentServiceConfig } from "./agentApi";

/** Verdicts the CLIENT surface can express. No owner/staff states exist
 * here by construction. */
export type ClientIdentityStatus =
  | { state: "unauthenticated" }
  | { state: "unapproved"; id: string }
  | { state: "authenticated"; kind: "client"; id: string }
  | { state: "network" };

/** GET /client-agent/identity. Maps worker codes, nothing more. */
export async function checkClientAgentIdentity(baseUrl: string): Promise<ClientIdentityStatus> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/client-agent/identity`, {
      method: "GET",
      credentials: "include",
      headers: { accept: "application/json" },
    });
  } catch {
    return { state: "network" };
  }
  if (res.status === 401) return { state: "unauthenticated" };
  if (res.status === 403) {
    let id = "";
    try {
      const body: unknown = await res.json();
      id = typeof (body as { id?: unknown })?.id === "string" ? (body as { id: string }).id : "";
    } catch {
      /* the 403 stands on its own */
    }
    return { state: "unapproved", id };
  }
  if (res.status === 200) {
    const body: unknown = await res.json().catch(() => null);
    const b = body as { kind?: unknown; id?: unknown } | null;
    // Accept ONLY the client verdict the client surface can produce.
    if (b && b.kind === "client" && typeof b.id === "string") {
      return { state: "authenticated", kind: "client", id: b.id };
    }
    return { state: "network" };
  }
  return { state: "network" };
}

export type ClientChatError =
  | "model-unconfigured"
  | "model-error"
  | "model-timeout"
  | "authentication"
  | "network";

/** POST /client-agent/chat. Same payload shape as the internal chat; only
 * the route differs — and that route is gated by the CLIENTS roster. */
export async function sendClientAgentChat(
  baseUrl: string,
  messages: Array<{ role: ChatRole; content: string }>,
): Promise<
  | { ok: true; reply: string; model: string }
  | { ok: false; error: ClientChatError; detail?: string }
> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/client-agent/chat`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ messages }),
    });
  } catch {
    return { ok: false, error: "network" };
  }
  const body: unknown = await res.json().catch(() => null);
  const b = body as {
    ok?: unknown;
    reply?: unknown;
    model?: unknown;
    reason?: unknown;
    detail?: unknown;
  } | null;
  if (res.status === 200 && b && b.ok === true && typeof b.reply === "string") {
    return { ok: true, reply: b.reply, model: String(b.model ?? "") };
  }
  if (res.status === 401) return { ok: false, error: "authentication" };
  if (res.status === 503 && b?.reason === "model-unconfigured") {
    return { ok: false, error: "model-unconfigured" };
  }
  if (res.status === 504) return { ok: false, error: "model-timeout", detail: String(b?.detail ?? "") };
  if (res.status === 502) return { ok: false, error: "model-error", detail: String(b?.detail ?? "") };
  return { ok: false, error: "network", detail: `http-${res.status}` };
}

/** Re-exported so the client surface configures from exactly the same source
 * as the internal one — one static file, no invented origins. */
export { loadAgentServiceConfig };
