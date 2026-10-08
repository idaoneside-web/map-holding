import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Eyebrow, Heading } from "@/components/typography/Text";
import styles from "./Panel.module.css";

export type PanelTone = "raised" | "quiet" | "accent";

export interface PanelProps {
  /** Optional tracked label above the title. */
  eyebrow?: string;
  title?: string;
  /** Optional right-aligned action, e.g. a `Button` or `StatusBadge`. */
  action?: ReactNode;
  /** Heading level for the panel title. Defaults to 3 (panels sit inside sections). */
  level?: 2 | 3;
  /** `raised` = soft surface; `quiet` = hairline only; `accent` = gold-tinted. */
  tone?: PanelTone;
  className?: string;
  children?: ReactNode;
}

/**
 * Panel — the single surface primitive for the client environment.
 *
 * Deliberately restrained: one hairline, one soft raised fill, generous padding
 * and a squarer radius. It is NOT a generic SaaS card and never stacks a heavy
 * border, a shadow and a gradient at once.
 */
export function Panel({
  eyebrow,
  title,
  action,
  level = 3,
  tone = "raised",
  className,
  children,
}: PanelProps) {
  const hasHead = Boolean(eyebrow || title || action);

  return (
    <section className={cn(styles.panel, styles[tone], className)}>
      {hasHead ? (
        <header className={styles.head}>
          <div className={styles.headText}>
            {eyebrow ? <Eyebrow className={styles.eyebrow}>{eyebrow}</Eyebrow> : null}
            {title ? (
              <Heading level={level} className={styles.title}>
                {title}
              </Heading>
            ) : null}
          </div>
          {action ? <div className={styles.action}>{action}</div> : null}
        </header>
      ) : null}
      <div className={styles.body}>{children}</div>
    </section>
  );
}
