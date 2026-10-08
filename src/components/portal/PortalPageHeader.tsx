import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Eyebrow, Heading, Text } from "@/components/typography/Text";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./PortalPageHeader.module.css";

export interface PortalPageHeaderProps {
  /** Tracked label naming the area, e.g. "My Documents". */
  eyebrow?: string;
  title: string;
  /** One supporting sentence. */
  lead?: ReactNode;
  /** Optional primary action for the page. */
  action?: ReactNode;
  /** Renders the brand gradient rule under the eyebrow. On by default. */
  rule?: boolean;
  className?: string;
}

/**
 * PortalPageHeader — the single page-introduction primitive for the portal.
 *
 * It owns the eyebrow → rule → heading → lead → action rhythm so no portal page
 * invents its own heading treatment (the same discipline `SectionHeader` applies
 * to the public site). Every page carries exactly one `h1`, and it lives here.
 */
export function PortalPageHeader({
  eyebrow,
  title,
  lead,
  action,
  rule = true,
  className,
}: PortalPageHeaderProps) {
  return (
    <Reveal>
      <div className={cn(styles.header, className)}>
        <div className={styles.text}>
          {eyebrow ? <Eyebrow className={styles.eyebrow}>{eyebrow}</Eyebrow> : null}
          {rule ? <span className={styles.rule} aria-hidden="true" /> : null}
          <Heading level={1} variant="display-l" className={styles.title}>
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
    </Reveal>
  );
}
