import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Heading, Text } from "@/components/typography/Text";
import styles from "./EmptyState.module.css";

export interface EmptyStateProps {
  /** Short, factual title. Never an invented claim about absent content. */
  title: string;
  /** Explanation of why the region is empty and what will appear there. */
  body: ReactNode;
  /** Optional glyph rendered above the title. Decorative. */
  glyph?: ReactNode;
  /** Optional action, e.g. a `Button` or `Link`. */
  action?: ReactNode;
  className?: string;
}

/**
 * EmptyState — the honest "nothing here yet" region.
 *
 * Used throughout the Phase 3 scaffold pages instead of placeholder list
 * content, so a reviewer always sees *why* a section is empty rather than a
 * plausible-looking fabrication (Phase 3 §6).
 */
export function EmptyState({ title, body, glyph, action, className }: EmptyStateProps) {
  return (
    <div className={cn(styles.empty, className)}>
      {glyph ? (
        <span className={styles.glyph} aria-hidden="true">
          {glyph}
        </span>
      ) : null}
      <Heading level={3} className={styles.title}>
        {title}
      </Heading>
      <Text variant="body" tone="default" className={styles.body}>
        {body}
      </Text>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
