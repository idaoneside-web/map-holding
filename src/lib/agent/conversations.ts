/**
 * MAP HOLDING — BUSINESS AGENT: conversation model and browser storage
 * (Phase 3).
 *
 * Conversations live ONLY in this browser's localStorage, clearly labelled
 * as such in the UI: there is no server-side conversation store in this
 * phase (the worker deliberately has no data bindings). These helpers are
 * pure functions over an injected storage object so they run under Node in
 * the test suite without a DOM.
 *
 * Nothing here invents content: titles derive from the user's own first
 * message; the model payload contains only validated user/assistant text.
 */

export type ChatRole = "user" | "assistant";

export interface AgentChatMessage {
  readonly role: ChatRole;
  readonly content: string;
  /** Set when the assistant slot holds a failed attempt, not a reply. */
  readonly failed?: boolean;
  /** ISO timestamp. */
  readonly at: string;
}

export interface AgentConversation {
  readonly id: string;
  readonly title: string;
  readonly createdAt: string;
  readonly messages: readonly AgentChatMessage[];
}

/** Storage key. Browsable and clearable by the user at any time. */
export const CONVERSATIONS_STORAGE_KEY = "mh-agent:conversations";

/** Storage key for the CLIENT assistant (client portal). Kept distinct from
 * the internal one so the two experiences never share local history. */
export const CLIENT_CONVERSATIONS_STORAGE_KEY = "mh-client-agent:conversations";

/** Which conversation each assistant had OPEN — persisted so a browser
 * refresh restores the open thread instead of dropping to a blank pane.
 * `""` means the user explicitly chose a new (unsent) conversation. */
export const ACTIVE_CONVERSATION_STORAGE_KEY = "mh-agent:active-conversation";
export const CLIENT_ACTIVE_CONVERSATION_STORAGE_KEY = "mh-client-agent:active-conversation";

export const MAX_CONVERSATIONS = 20;
export const MAX_CHAT_MESSAGES = 60;
/** UI input cap; the worker separately hard-caps each message at 4000. */
export const MAX_MESSAGE_CHARS = 8000;
/** How many trailing turns are sent with each model request. */
export const MODEL_CONTEXT_MESSAGES = 30;

/** Minimal storage shape so tests and SSR share the same code path. */
export interface AgentStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Trimmed, length-capped user input. The cap is the UI-side bound. */
export function sanitizeUserMessage(input: string): string {
  return input.trim().slice(0, MAX_MESSAGE_CHARS);
}

/** A unique id that degrades gracefully where crypto.randomUUID is absent. */
export function newConversationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `conv-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

/** Working title from the conversation's own first user message. */
export function deriveTitle(messages: readonly AgentChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user" && m.content.length > 0);
  const base = firstUser ? firstUser.content.replace(/\s+/g, " ") : "New conversation";
  return base.length > 60 ? `${base.slice(0, 57)}…` : base;
}

/**
 * The exact payload the worker may accept: validated, error-free, trailing
 * turns only. Failed assistant attempts are never replayed to the model.
 */
export function toModelPayload(
  messages: readonly AgentChatMessage[],
): Array<{ role: ChatRole; content: string }> {
  return messages
    .filter((m) => m.content.length > 0 && !m.failed)
    .slice(-MODEL_CONTEXT_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
}

/* --- storage (with shape guards; corrupt data is dropped, never thrown) --- */

function isValidMessage(value: unknown): value is AgentChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Partial<AgentChatMessage>;
  return (
    (m.role === "user" || m.role === "assistant") &&
    typeof m.content === "string" &&
    typeof m.at === "string"
  );
}

function isValidConversation(value: unknown): value is AgentConversation {
  if (typeof value !== "object" || value === null) return false;
  const c = value as Partial<AgentConversation>;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    typeof c.createdAt === "string" &&
    Array.isArray(c.messages)
  );
}

/** Parses and validates stored conversation JSON. Corrupt data ⇒ empty list. */
export function parseStoredConversations(raw: string | null): AgentConversation[] {
  if (raw === null || raw.length === 0) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isValidConversation)
      .slice(0, MAX_CONVERSATIONS)
      .map((c) => ({
        ...c,
        messages: c.messages.filter(isValidMessage).slice(0, MAX_CHAT_MESSAGES),
      }));
  } catch {
    return [];
  }
}

/** Loads and validates stored conversations. Bad data ⇒ empty list. */
export function loadConversations(
  storage: AgentStorageLike,
  key: string = CONVERSATIONS_STORAGE_KEY,
): AgentConversation[] {
  try {
    return parseStoredConversations(storage.getItem(key));
  } catch {
    return [];
  }
}

/** Persists, newest-first, bounded to the caps. Never throws outward. */
export function saveConversations(
  storage: AgentStorageLike,
  conversations: readonly AgentConversation[],
  key: string = CONVERSATIONS_STORAGE_KEY,
): void {
  try {
    const trimmed = conversations.slice(0, MAX_CONVERSATIONS);
    storage.setItem(key, JSON.stringify(trimmed));
  } catch {
    // Quota or serialization failure: the UI keeps working in-memory.
  }
}

/* --- open-conversation persistence (survives a browser refresh) --------- */

/** Reads the persisted "open conversation" marker. Returns `""` for a
 * deliberate blank (new-unsent) thread, `null` when nothing was stored
 * or the value is malformed. */
export function loadActiveConversationId(
  storage: AgentStorageLike,
  key: string,
): string | null {
  try {
    const value = storage.getItem(key);
    if (value === null) return null;
    if (value.length === 0) return ""; // deliberate blank
    return /^[a-z0-9][a-z0-9-]{0,63}$/i.test(value) ? value : null;
  } catch {
    return null;
  }
}

/** Decides which conversation to open on load: the persisted open id when
 * it still exists, a deliberate blank, otherwise the most recent one. */
export function resolveActiveConversationId(
  stored: string | null,
  conversations: readonly AgentConversation[],
): string | null {
  if (stored === "") return null;
  if (stored !== null && conversations.some((c) => c.id === stored)) return stored;
  return conversations.length > 0 ? conversations[0].id : null;
}

/** Persists the open-conversation marker. Never throws outward. */
export function saveActiveConversationId(
  storage: AgentStorageLike,
  id: string | null,
  key: string,
): void {
  try {
    storage.setItem(key, id ?? "");
  } catch {
    // Quota or serialization failure: in-memory state is unaffected.
  }
}
