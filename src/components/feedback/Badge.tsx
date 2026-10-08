import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { LockGlyph } from "@/components/controls/IconButton";
import styles from "./Badge.module.css";

export type BadgeTone = "neutral" | "brand" | "gold" | "success" | "info" | "warning" | "danger";

export interface BadgeProps {
  tone?: BadgeTone;
  /** Renders a lock glyph and forces the neutral tone — used for gated destinations. */
  locked?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Badge — the generic label chip.
 *
 * Distinct from `StatusBadge`, which is specifically for record status and
 * always renders a colour dot. `Badge` never relies on colour alone either:
 * the label text is always present, and `locked` adds a non-colour signal.
 */
export function Badge({ tone = "neutral", locked = false, className, children }: BadgeProps) {
  const resolved: BadgeTone = locked ? "neutral" : tone;
  return (
    <span className={cn(styles.badge, styles[resolved], className)} data-tone={resolved}>
      {locked ? (
        <span className={styles.glyph}>
          <LockGlyph />
        </span>
      ) : null}
      <span className={styles.label}>{children}</span>
    </span>
  );
}

export interface TagProps {
  className?: string;
  children: ReactNode;
}

/** Tag — the smaller, inline variant of `Badge`. */
export function Tag({ className, children }: TagProps) {
  return <span className={cn(styles.tag, className)}>{children}</span>;
}
