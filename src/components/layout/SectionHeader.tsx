import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Eyebrow, Heading, Text } from "@/components/typography/Text";
import styles from "./SectionHeader.module.css";

export interface SectionHeaderProps {
  /** Tracked uppercase label. Mirrors the wordmark tagline treatment. */
  eyebrow?: string;
  /** Heading text. Rendered as `h2` by default so the outline stays ordered. */
  title: string;
  /** One short supporting sentence, or a `ContentPlaceholder` in scaffold pages. */
  lead?: ReactNode;
  /** Heading level. Defaults to 2 (sections always sit under the page `h1`). */
  level?: 1 | 2 | 3;
  align?: "start" | "center";
  /** Optional right-hand action, e.g. a `Button` or a `StatusBadge`. */
  action?: ReactNode;
  /** The brand gradient hairline under the eyebrow. On by default. */
  rule?: boolean;
  id?: string;
  className?: string;
}

/**
 * SectionHeader — the single section-introduction primitive.
 *
 * It owns the eyebrow → heading → lead → brand-rule rhythm so no page invents
 * its own heading treatment (Phase 3 §1).
 */
export function SectionHeader({
  eyebrow,
  title,
  lead,
  level = 2,
  align = "start",
  action,
  rule = true,
  id,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn(styles.header, styles[`align-${align}`], className)}>
      <div className={styles.text}>
        {eyebrow ? <Eyebrow className={styles.eyebrow}>{eyebrow}</Eyebrow> : null}
        {rule ? <span className={styles.rule} aria-hidden="true" /> : null}
        <Heading level={level} id={id} className={styles.title}>
          {title}
        </Heading>
        {lead ? (
          <Text variant="body-l" tone="default" className={styles.lead}>
            {lead}
          </Text>
        ) : null}
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
