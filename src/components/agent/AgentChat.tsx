"use client";

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/controls/Button";
import {
  CONVERSATIONS_STORAGE_KEY,
  deriveTitle,
  MAX_CHAT_MESSAGES,
  newConversationId,
  parseStoredConversations,
  saveConversations,
  sanitizeUserMessage,
  toModelPayload,
  type AgentChatMessage,
  type AgentConversation,
} from "@/lib/agent/conversations";
import {
  sendAgentChat,
  buildAgentSignInUrl,
  isLoopbackAgentBase,
  type ChatError,
  type IdentityStatus,
} from "./agentApi";
import styles from "./AgentChat.module.css";

/** LocalStorage guarded for SSR (this component only touches it in effects). */
function browserStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const ERROR_TEXT: Record<ChatError, string> = {
  "model-unconfigured":
    "The agent service is reachable, but its model backend is not configured on the server yet. No response can be generated until the owner completes that setup.",
  "model-error": "The model request failed. Your message was not lost — please resend it.",
  "model-timeout": "The model did not answer within the time limit. Please try again.",
  authentication:
    "Your sign-in session was not verified for this request. Check your status and try again.",
  network:
    "The agent service could not be reached. Check that the worker origin in the site's agent configuration is correct and reachable.",
};

export interface AgentChatProps {
  /** The configured worker origin. Non-null means the service is configured. */
  readonly baseUrl: string | null;
  /** The live identity verdict from the worker's Access-verified boundary. */
  readonly identity: IdentityStatus | null;
  /** Whether the composer is allowed to act at all (approved + configured). */
  readonly approved: boolean;
  /** True while a request is in flight. */
  readonly sending: boolean;
  readonly setSending: (v: boolean) => void;
}

/**
 * AgentChat — the conversation surface.
 *
 * Honesty contract: nothing rendered here is a simulated business result.
 * A reply appears ONLY when the worker returned a genuine model response.
 * Every other outcome renders a specific, truthful state. Conversations are
 * kept in THIS browser only and labelled as such.
 */
/**
 * Browser-local conversation store, exposed through useSyncExternalStore
 * (the same sanctioned pattern this repository used for portal state): the
 * raw string is the snapshot, so identity is stable and SSR never reads
 * localStorage. Saves notify the listeners so all mounted views refresh.
 */
let storageListeners: Array<() => void> = [];

function subscribeToStore(onStoreChange: () => void): () => void {
  storageListeners.push(onStoreChange);
  return () => {
    storageListeners = storageListeners.filter((listener) => listener !== onStoreChange);
  };
}

function getStoredSnapshot(): string {
  const storage = browserStorage();
  if (!storage) return "";
  try {
    return storage.getItem(CONVERSATIONS_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function getServerSnapshot(): string {
  return "";
}

export function AgentChat({ baseUrl, identity, approved, sending, setSending }: AgentChatProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<ChatError | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const raw = useSyncExternalStore(subscribeToStore, getStoredSnapshot, getServerSnapshot);
  const conversations = useMemo<AgentConversation[]>(
    () => parseStoredConversations(raw || null),
    [raw],
  );
  const active = conversations.find((c) => c.id === activeId) ?? null;

  /** Persists through the real storage and notifies the store subscription. */
  const persist = useCallback((next: AgentConversation[]) => {
    const storage = browserStorage();
    if (storage) saveConversations(storage, next);
    for (const listener of storageListeners.slice()) listener();
  }, []);

  const startNew = useCallback(() => {
    setActiveId(null);
    setSendError(null);
    setDraft("");
  }, []);

  const openConversation = useCallback((id: string) => {
    setActiveId(id);
    setSendError(null);
  }, []);
  const send = useCallback(async () => {
    if (!baseUrl || sending) return;
    const content = sanitizeUserMessage(draft);
    if (content.length === 0) return;
    if (active && active.messages.length >= MAX_CHAT_MESSAGES) return;

    // Persist the user's own words immediately, then ask the agent.
    const now = new Date().toISOString();
    const userMessage: AgentChatMessage = { role: "user", content, at: now };
    const baseMessages = active ? active.messages : [];
    const nextConversation: AgentConversation = {
      id: active?.id ?? newConversationId(),
      title: active?.title ?? deriveTitle([...baseMessages, userMessage]),
      createdAt: active?.createdAt ?? now,
      messages: [...baseMessages, userMessage].slice(0, MAX_CHAT_MESSAGES),
    };
    persist(
      active
        ? conversations.map((c) => (c.id === active.id ? nextConversation : c))
        : [nextConversation, ...conversations],
    );
    setActiveId(nextConversation.id);
    setDraft("");
    setSendError(null);
    setSending(true);

    const result = await sendAgentChat(baseUrl, toModelPayload(nextConversation.messages));

    {
      const index = conversations.findIndex((c) => c.id === nextConversation.id);
      if (index !== -1) {
        const copy = conversations.slice();
        const conv = copy[index];
        const extra: AgentChatMessage = result.ok
          ? { role: "assistant", content: result.reply, at: new Date().toISOString() }
          : {
              role: "assistant",
              content: result.error,
              failed: true,
              at: new Date().toISOString(),
            };
        // Failed attempts stay visibly marked — never a fake reply.
        copy[index] = { ...conv, messages: [...conv.messages, extra].slice(0, MAX_CHAT_MESSAGES) };
        persist(copy);
      }
    }
    if (!result.ok) setSendError(result.error);
    setSending(false);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, [baseUrl, sending, active, conversations, draft, persist, setSending]);

  const chatEnabled = baseUrl !== null && approved && !sending;

  return (
    <div className={styles.chat}>
      <aside className={styles.history} aria-label="Conversation history">
        <div className={styles.historyHead}>
          <h3 className={styles.historyTitle}>Conversations</h3>
          <Button variant="secondary" size="sm" onClick={startNew}>
            New conversation
          </Button>
        </div>
        {conversations.length === 0 ? (
          <p className={styles.historyEmpty}>No conversations yet.</p>
        ) : (
          <ul className={styles.historyList}>
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={`${styles.historyItem} ${c.id === activeId ? styles.historyItemActive : ""}`}
                  onClick={() => openConversation(c.id)}
                >
                  <span className={styles.historyItemTitle}>{c.title}</span>
                  <span className={styles.historyItemCount}>{c.messages.length} messages</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className={styles.historyNote}>
          Kept in this browser only — sent to the agent solely as context for the latest reply.
        </p>
      </aside>

      <div className={styles.thread}>
        <div className={styles.threadScroll} ref={scrollRef}>
          {active && active.messages.length > 0 ? (
            <ol className={styles.messages}>
              {active.messages.map((m, i) => (
                <li
                  key={`${m.at}-${i}`}
                  className={`${styles.message} ${m.role === "user" ? styles.messageUser : ""} ${
                    m.failed ? styles.messageFailed : ""
                  }
                  }`}
                >
                  <span className={styles.messageRole}>{m.role === "user" ? "You" : "Agent"}</span>
                  <p className={styles.messageBody}>
                    {m.failed ? (ERROR_TEXT[m.content as ChatError] ?? m.content) : m.content}
                  </p>
                  {m.failed && <p className={styles.messageHint}>No agent reply was produced.</p>}
                </li>
              ))}
              {sending && (
                <li className={`${styles.message} ${styles.messagePending}`}>
                  <span className={styles.messageRole}>Agent</span>
                  <p className={styles.messageBody}>Preparing a response…</p>
                </li>
              )}
            </ol>
          ) : (
            <div className={styles.emptyPane}>
              {baseUrl === null ? (
                <>
                  <h3>The agent service is not configured yet</h3>
                  <p>
                    No external request is made and nothing on this page is simulated. To bring this
                    workspace online:
                  </p>
                  <ol className={styles.configSteps}>
                    <li>Deploy the Business Agent Worker (Cloudflare) and put a Cloudflare Access
                      application in front of it, then set the <code>OWNERS</code> / <code>STAFF</code> rosters.
                    </li>
                    <li>Set <code>workerBaseUrl</code> in the site&rsquo;s static agent configuration to the deployed Worker origin and rebuild the site.
                    </li>
                    <li>For local development only, run <code>npm run dev:agent</code> and point <code>workerBaseUrl</code> at <code>http://127.0.0.1:3300</code>; sign in through that server instead of Cloudflare Access.
                    </li>
                  </ol>
                </>
              ) : identity?.state === "unapproved" ? (
                <>
                  <h3>Signed in — not on an approved roster</h3>
                  <p>
                    {identity.id ? (
                      <>
                        Signed in as <strong>{identity.id}</strong>.{" "}
                      </>
                    ) : null}
                    Accessing the agent requires your e-mail to be listed by a MAP Holding owner.
                    Signing in alone grants no role.
                  </p>
                </>
              ) : approved ? (
                <>
                  <h3>Start an advisory conversation</h3>
                  <p>
                    Ask the agent advisory questions. In this phase it gives general, professional
                    guidance only. It does carry the approved project records (the same six shown in the
                    Projects tab) as read-only context, and it performs no actions and touches no other
                    company data.
                  </p>
                  <p className={styles.scopeNote}>
                    Replies require the agent service&rsquo;s model backend to be configured
                    (server-side credential and endpoint). If it is not, every send is answered with a
                    clear unavailable state — never with a simulated reply. The Projects tab above works
                    independently of the model.
                  </p>
                </>
              ) : (
                <>
                  <h3>Sign-in required</h3>
                  <p>
                    This workspace verifies identity at the agent service — no e-mail or password
                    is entered or stored on this page. The sign-in status in the top-right shows the
                    verified state; until it says &ldquo;Signed in&rdquo;, this pane stays here and
                    nothing below is unlocked.
                  </p>
                  <a
                    className={styles.signInLink}
                    href={buildAgentSignInUrl(baseUrl) ?? undefined}
                    target={baseUrl !== null && isLoopbackAgentBase(baseUrl) ? undefined : "_blank"}
                    rel={baseUrl !== null && isLoopbackAgentBase(baseUrl) ? undefined : "noopener noreferrer"}
                  >
                    {baseUrl !== null && isLoopbackAgentBase(baseUrl)
                      ? "Sign in now — you will be returned to this workspace"
                      : "Open the agent service to sign in"}
                  </a>
                </>
              )}
            </div>
          )}
        </div>

        {sendError && (
          <div className={styles.errorBanner} role="alert">
            <strong>
              {sendError === "model-unconfigured" ? "Agent unavailable: " : "Request problem: "}
            </strong>
            {ERROR_TEXT[sendError]}
          </div>
        )}

        <div className={styles.composer}>
          <label className={styles.composerLabel} htmlFor="agent-chat-input">
            Message
          </label>
          <textarea
            id="agent-chat-input"
            className={styles.composerInput}
            rows={3}
            placeholder={chatEnabled ? "Ask the agent…" : "Unavailable in the current state"}
            value={draft}
            disabled={!chatEnabled}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <div className={styles.composerActions}>
            <span className={styles.composerHint}>Enter to send · Shift+Enter for a new line</span>
            <Button
              variant="primary"
              onClick={() => void send()}
              disabled={!chatEnabled || draft.trim().length === 0}
            >
              {sending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
