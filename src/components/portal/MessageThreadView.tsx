"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/feedback/Badge";
import { Button } from "@/components/controls/Button";
import { Heading, Text } from "@/components/typography/Text";
import type { PortalMessageThread } from "@/content/portal";
import {
  loadRepliesForThread,
  addReplyToThread,
  type PortalReply,
} from "@/lib/portal-storage";
import styles from "./MessageThreadView.module.css";

export interface MessageThreadViewProps {
  thread: PortalMessageThread;
  className?: string;
}

export function MessageThreadView({ thread, className }: MessageThreadViewProps) {
  const [replies, setReplies] = useState<PortalReply[]>(() => loadRepliesForThread(thread.id));
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendState, setSendState] = useState<"idle" | "sent" | "error">("idle");

  const handleSend = useCallback(() => {
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setTimeout(() => {
      const reply: PortalReply = {
        id: `reply-${Date.now()}`,
        body: trimmed,
        sentAt: new Date().toISOString(),
      };
      addReplyToThread(thread.id, reply);
      setReplies((prev) => [...prev, reply]);
      setBody("");
      setSendState("sent");
      setSending(false);
      setTimeout(() => setSendState("idle"), 2000);
    }, 400);
  }, [body, sending, thread.id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <article className={cn(styles.thread, className)}>
      <header className={styles.head}>
        <Heading level={2} className={styles.subject}>{thread.subject}</Heading>
        <p className={styles.meta}>
          <span className={styles.from}>{thread.from}</span>
          <span className={styles.when}>{thread.receivedAt}</span>
        </p>
      </header>

      <div className={styles.body}>
        {thread.body.map((paragraph) => (
          <Text key={paragraph} variant="body" tone="default" as="p">
            {paragraph}
          </Text>
        ))}
      </div>

      {replies.length > 0 && (
        <section className={styles.replies} aria-label="Your replies">
          <Heading level={3} className={styles.repliesTitle}>
            Your replies ({replies.length})
          </Heading>
          <ul className={styles.repliesList}>
            {replies.map((reply) => (
              <li key={reply.id} className={styles.replyItem}>
                <div className={styles.replyHead}>
                  <Badge tone="gold">You</Badge>
                  <span className={styles.replyWhen}>
                    {new Date(reply.sentAt).toLocaleString()}
                  </span>
                </div>
                <Text variant="body" tone="default" className={styles.replyBody}>
                  {reply.body}
                </Text>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className={styles.composer}>
        <label className={styles.composerLabel} htmlFor={`reply-${thread.id}`}>
          Reply
        </label>
        <textarea
          id={`reply-${thread.id}`}
          className={styles.composerInput}
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your reply… (⌘/Ctrl+Enter to send)"
          disabled={sending}
          aria-disabled={sending}
        />
        <div className={styles.composerFoot}>
          <Text variant="caption" tone="muted" className={styles.composerHint}>
            Preview mode — replies are stored locally in your browser only.
          </Text>
          <Button
            variant="primary"
            size="sm"
            disabled={sending || !body.trim()}
            onClick={handleSend}
          >
            {sending ? "Sending…" : sendState === "sent" ? "Sent" : "Send reply"}
          </Button>
        </div>
      </div>
    </article>
  );
}
