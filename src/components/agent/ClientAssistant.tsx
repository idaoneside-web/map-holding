"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/controls/Button";
import { Badge } from "@/components/feedback/Badge";
import {
  CLIENT_CONVERSATIONS_STORAGE_KEY,
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
  checkClientAgentIdentity,
  loadAgentServiceConfig,
  sendClientAgentChat,
  type ClientIdentityStatus,
} from "./clientAgentApi";
import styles from "./ClientAssistant.module.css";

/** Browser-local conversation store scoped to the CLIENT assistant's key —
 * the same sanctioned useSyncExternalStore pattern the internal chat uses. */
let storageListeners: Array<() => void> = [];

function subscribeToStore(onStoreChange: () => void): () => void {
  storageListeners.push(onStoreChange);
  return () => {
    storageListeners = storageListeners.filter((listener) => listener !== onStoreChange);
  };
}

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getStoredSnapshot(): string {
  const storage = browserStorage();
  if (!storage) return "";
  try {
    return storage.getItem(CLIENT_CONVERSATIONS_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

const ERROR_TEXT: Record<string, string> = {
  "model-unconfigured":
    "The assistant service is reachable, but its model backend is not configured on the server yet. No response can be generated until MAP Holding completes that setup.",
  "model-error": "The model request failed. Your message was not lost — please resend it.",
  "model-timeout": "The model did not answer within the time limit. Please try again.",
  authentication: "Your sign-in session was not verified for this request. Check your status and try again.",
  network: "The assistant service could not be reached. It may not be configured yet — see the note above.",
};

export interface ClientAssistantProps {
  /** True when the worker origin is configured (otherwise nothing is called). */
  readonly serviceReady: boolean;
  readonly baseUrl: string | null;
  /** The live verdict from the worker's Access-verified client boundary. */
  readonly identity: ClientIdentityStatus | null;
  readonly approved: boolean;
  readonly sending: boolean;
  readonly setSending: (v: boolean) => void;
  /** Re-runs the identity check after the user completes sign-in. */
  readonly refreshIdentity: () => void;
}

/**
 * ClientAssistant — the client portal's private advisory assistant.
 *
 * Boundary contract (mirrored server-side by the `/client-agent/*` routes):
 *   - Identity comes ONLY from the worker's Access-verified boundary.
 *   - This surface never reaches the internal endpoints, so owner/staff
 *     capabilities and internal project data are structurally unreachable.
 *   - A reply renders ONLY when the worker returned a genuine model
 *     response; every other outcome renders a specific, truthful state.
 */
export function ClientAssistant({
  serviceReady,
  baseUrl,
  identity,
  approved,
  sending,
  setSending,
  refreshIdentity,
}: ClientAssistantProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const raw = useSyncExternalStore(subscribeToStore, getStoredSnapshot, getStoredSnapshot);
  const conversations = useMemo<AgentConversation[]>(
    () => parseStoredConversations(raw || null),
    [raw],
  );
  const active = conversations.find((c) => c.id === activeId) ?? null;

  const persist = useCallback((next: AgentConversation[]) => {
    const storage = browserStorage();
    if (storage) saveConversations(storage, next, CLIENT_CONVERSATIONS_STORAGE_KEY);
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

    // Persist the user's own words immediately, then ask the assistant.
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

    const result = await sendClientAgentChat(baseUrl, toModelPayload(nextConversation.messages));

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
      copy[index] = { ...conv, messages: [...conv.messages, extra].slice(0, MAX_CHAT_MESSAGES) };
      persist(copy);
    }
    if (!result.ok) setSendError(result.error);
    setSending(false);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, [baseUrl, sending, active, conversations, draft, persist, setSending]);

  const chatEnabled = serviceReady && approved && !sending;

  return (
    <div className={styles.chat}>
      <aside className={styles.history} aria-label="Assistant conversation history">
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
          Kept in this browser only — sent to the assistant solely as context for the latest reply.
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
                  }`}
                >
                  <span className={styles.messageRole}>{m.role === "user" ? "You" : "Assistant"}</span>
                  <p className={styles.messageBody}>
                    {m.failed ? (ERROR_TEXT[m.content] ?? m.content) : m.content}
                  </p>
                  {m.failed && <p className={styles.messageHint}>No assistant reply was produced.</p>}
                </li>
              ))}
              {sending && (
                <li className={`${styles.message} ${styles.messagePending}`}>
                  <span className={styles.messageRole}>Assistant</span>
                  <p className={styles.messageBody}>Preparing a response…</p>
                </li>
              )}
            </ol>
          ) : (
            <div className={styles.emptyPane}>
              {!serviceReady ? (
                <>
                  <Badge tone="neutral">Not configured</Badge>
                  <h3>The assistant service is not configured yet</h3>
                  <p>
                    No external request is made and nothing here is simulated. When MAP Holding deploys
                    the assistant service and points the site&rsquo;s agent configuration at it, this
                    space becomes available. Until then your client environment — your projects,
                    applications, documents and messages — remains fully available above.
                  </p>
                </>
              ) : identity?.state === "unapproved" ? (
                <>
                  <h3>Signed in — assistant not enabled for this account</h3>
                  <p>
                    {identity.id ? (
                      <>
                        Signed in as <strong>{identity.id}</strong>.{" "}
                      </>
                    ) : null}
                    The assistant is enabled per client account. If you believe your account should
                    have access, contact MAP Holding.
                  </p>
                </>
              ) : approved ? (
                <>
                  <h3>Ask your assistant</h3>
                  <p>
                    General guidance about your client environment: how things work, what terms mean,
                    how to request information. In this phase the assistant does not read your records
                    and performs no actions; anything that needs your specific details points you to
                    your portal or a MAP Holding contact.
                  </p>
                  <p className={styles.scopeNote}>
                    This assistant is for your account only. It cannot see internal or company
                    projects, documents or data.
                  </p>
                </>
              ) : (
                <>
                  <h3>Sign-in required</h3>
                  <p>
                    The assistant verifies your identity through the service&rsquo;s own sign-in. Open
                    the service in a new tab, complete the sign-in, then press <em>Check again</em>. No
                    e-mail or password is entered or stored here.
                  </p>
                  <Button variant="secondary" size="sm" onClick={refreshIdentity}>
                    Check again
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {sendError && (
          <div className={styles.errorBanner} role="alert">
            <strong>
              {sendError === "model-unconfigured" ? "Assistant unavailable: " : "Request problem: "}
            </strong>
            {ERROR_TEXT[sendError] ?? "Something went wrong reaching the assistant. Please try again."}
          </div>
        )}

        <div className={styles.composer}>
          <label className={styles.composerLabel} htmlFor="client-assistant-input">
            Message
          </label>
          <textarea
            id="client-assistant-input"
            className={styles.composerInput}
            rows={3}
            placeholder={chatEnabled ? "Ask the assistant…" : "Unavailable in the current state"}
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

/**
 * ClientAssistantPanel — the page-facing wrapper: reads the static service
 * configuration and the worker's Access-verified identity verdict, then hands
 * both to the assistant surface. While the service is unconfigured no
 * external request happens and the panel stays visibly in that state.
 */
export function ClientAssistantPanel() {
  const [workerBaseUrl, setWorkerBaseUrl] = useState<string | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [identity, setIdentity] = useState<ClientIdentityStatus | null>(null);
  const [identityTick, setIdentityTick] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadAgentServiceConfig().then((config) => {
      if (!cancelled) {
        setWorkerBaseUrl(config.workerBaseUrl);
        setConfigLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const serviceReady = workerBaseUrl !== null;

  useEffect(() => {
    // While the service is unconfigured there is nothing to ask; keep the
    // identity verdict empty rather than resetting state synchronously.
    if (!serviceReady || workerBaseUrl === null) return;
    let cancelled = false;
    checkClientAgentIdentity(workerBaseUrl).then((status) => {
      if (!cancelled) setIdentity(status);
    });
    return () => {
      cancelled = true;
    };
  }, [serviceReady, workerBaseUrl, identityTick]);

  const refreshIdentity = useCallback(() => setIdentityTick((t) => t + 1), []);
  const approved = identity?.state === "authenticated";

  return (
    <div>
      <ClientAssistant
        serviceReady={serviceReady && configLoaded}
        baseUrl={serviceReady ? (workerBaseUrl as string) : null}
        identity={identity}
        approved={approved}
        sending={sending}
        setSending={setSending}
        refreshIdentity={refreshIdentity}
      />
      {configLoaded && !serviceReady && (
        <p className={styles.footerNote}>
          The assistant service is not configured: <code>workerBaseUrl</code> in the site&rsquo;s
          static agent configuration is empty. No external request is made in this state, and nothing
          on this page is simulated.
        </p>
      )}
    </div>
  );
}
