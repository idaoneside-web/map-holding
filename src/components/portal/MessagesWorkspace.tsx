import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/feedback/EmptyState";
import type { PortalMessageThread } from "@/content/portal";
import { MessageList } from "./MessageList";
import { MessageThreadView } from "./MessageThreadView";
import styles from "./MessagesWorkspace.module.css";

export interface MessagesWorkspaceProps {
  threads: readonly PortalMessageThread[];
  /** The thread to open. Falls back to the first conversation. */
  activeId?: string;
  className?: string;
}

/**
 * MessagesWorkspace — the conversation list beside the open conversation.
 *
 * A single implementation serves both the index route (newest conversation open)
 * and the per-thread route, so the two can never drift. On narrow screens the
 * two panes stack, list first.
 */
export function MessagesWorkspace({ threads, activeId, className }: MessagesWorkspaceProps) {
  const active = threads.find((thread) => thread.id === activeId) ?? threads[0];

  return (
    <div className={cn(styles.layout, className)}>
      <div className={styles.listCol}>
        <MessageList threads={threads} activeId={active?.id} />
      </div>

      <div className={styles.detailCol}>
        {active ? (
          <MessageThreadView thread={active} />
        ) : (
          <EmptyState
            title="No conversations"
            body="Messages from MAP Holding will appear here once your environment is active."
          />
        )}
      </div>
    </div>
  );
}
