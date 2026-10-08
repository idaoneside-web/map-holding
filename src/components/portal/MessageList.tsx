import Link from "next/link";
import { cn } from "@/lib/cn";
import type { PortalMessageThread } from "@/content/portal";
import styles from "./MessageList.module.css";

export interface MessageListProps {
  threads: readonly PortalMessageThread[];
  /** The thread currently open, marked as the current destination. */
  activeId?: string;
  className?: string;
}

/**
 * MessageList — the conversation list inside the portal.
 *
 * Unread state is carried by a label as well as a dot, so it survives a
 * monochrome or magnified view. It is a pure list of links: no unread counter is
 * mutated here, because nothing in the preview is a real inbox.
 */
export function MessageList({ threads, activeId, className }: MessageListProps) {
  return (
    <ul className={cn(styles.list, className)} aria-label="Conversations">
      {threads.map((thread) => {
        const active = thread.id === activeId;
        return (
          <li key={thread.id}>
            <Link
              href={`/client-portal/messages/${thread.id}`}
              className={cn(
                styles.item,
                active && styles.active,
                thread.unread && styles.unreadItem,
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className={styles.top}>
                <span className={styles.from}>{thread.from}</span>
                {thread.unread ? (
                  <span className={styles.unreadMark}>
                    <span aria-hidden="true" />
                    <span className="u-visually-hidden">Unread</span>
                  </span>
                ) : null}
              </span>
              <span className={styles.subject}>{thread.subject}</span>
              <span className={styles.preview}>{thread.preview}</span>
              <span className={styles.when}>{thread.receivedAt}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
