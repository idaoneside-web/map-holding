"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/controls/Button";
import { Panel } from "./Panel";
import { PortalGlyph } from "./PortalGlyphs";
import {
  CLIENT_ACTIVE_CONVERSATION_STORAGE_KEY,
  CLIENT_CONVERSATIONS_STORAGE_KEY,
  loadActiveConversationId,
  parseStoredConversations,
  resolveActiveConversationId,
} from "@/lib/agent/conversations";
import styles from "./AssistantCard.module.css";

/** Browser-local, guarded read of the CLIENT assistant's own storage keys —
 * the same pure helpers the assistant itself uses (SSR-safe). */
function readOpenThread(): { id: string | null; title: string; messageCount: number } | null {
  if (typeof window === "undefined") return null;
  let storage: Storage;
  try {
    storage = window.localStorage;
  } catch {
    return null;
  }
  const raw = storage.getItem(CLIENT_CONVERSATIONS_STORAGE_KEY);
  const conversations = parseStoredConversations(raw);
  if (conversations.length === 0) return null;
  const openId = resolveActiveConversationId(
    loadActiveConversationId(storage, CLIENT_ACTIVE_CONVERSATION_STORAGE_KEY),
    conversations,
  );
  const open = conversations.find((c) => c.id === openId) ?? conversations[0];
  return { id: open.id, title: open.title, messageCount: open.messages.length };
}

/** useSyncExternalStore over the assistant's own storage: the server
 * snapshot is the "no thread" shape, the client snapshot reads
 * localStorage once per render. No effect, no cascading setState. */
function subscribeThread(onChange: () => void): () => void {
  const handler = () => onChange();
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function clientThreadSnapshot(): string {
  const t = readOpenThread();
  return t ? JSON.stringify(t) : "";
}

function serverThreadSnapshot(): string {
  return "";
}

/**
 * AssistantCard — the always-visible entry to the client's private
 * assistant. Rendered on the client portal dashboard so the assistant is a
 * card, not a URL you have to know: it shows this browser's open thread (or
 * the start prompt) and continues it with one click. It only ever touches
 * the client assistant's own storage keys — never the internal agent's.
 */
export function AssistantCard() {
  const raw = useSyncExternalStore(subscribeThread, clientThreadSnapshot, serverThreadSnapshot);
  const thread = raw ? (JSON.parse(raw) as { id: string | null; title: string; messageCount: number }) : null;

  return (
    <Panel tone="accent" eyebrow="Private assistant" title="Your agent" level={2}>
      <div className={styles.body}>
        <span className={styles.glyph} aria-hidden>
          <PortalGlyph name="assistant" size={20} />
        </span>
        <div className={styles.bodyText}>
          <p className={styles.message} suppressHydrationWarning>
            {thread
              ? `Pick up where you left off: “${thread.title}” (${thread.messageCount} ${
                  thread.messageCount === 1 ? "message" : "messages"
                }).`
              : "Ask how things work, what a term means, or how to request information — your conversation is kept in this browser."}
          </p>
          <div className={styles.actions}>
            <Button href="/client-portal/assistant" variant="primary" size="sm" suppressHydrationWarning>
              {thread ? "Continue conversation" : "Start a conversation"}
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );
}

