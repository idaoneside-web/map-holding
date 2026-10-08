import { cn } from "@/lib/cn";
import type { PortalActivityEntry } from "@/content/portal";
import styles from "./ActivityList.module.css";

export interface ActivityListProps {
  entries: readonly PortalActivityEntry[];
  className?: string;
}

/**
 * ActivityList — the recent-activity feed.
 *
 * A quiet list with hairline separators, not a timeline graphic and not a table.
 * Each entry is one line of fact plus a timestamp.
 */
export function ActivityList({ entries, className }: ActivityListProps) {
  return (
    <ul className={cn(styles.list, className)}>
      {entries.map((entry) => (
        <li key={entry.id} className={styles.item}>
          <span className={styles.mark} aria-hidden="true" />
          <span className={styles.text}>{entry.text}</span>
          <span className={styles.when}>{entry.when}</span>
        </li>
      ))}
    </ul>
  );
}
