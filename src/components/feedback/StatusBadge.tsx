import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./StatusBadge.module.css";

export type StatusTone = "success" | "warning" | "danger" | "info" | "pending" | "neutral";

export interface StatusBadgeProps {
  tone?: StatusTone;
  className?: string;
  /** Required: status must never be communicated by colour alone (Phase 1 §L). */
  children: ReactNode;
}

/**
 * StatusBadge — semantic status primitive.
 *
 * Design decision for accessibility: the tone colour drives the dot, the tint and
 * the border only. The label always uses the current theme's strong text token,
 * so contrast holds on both ivory and navy grounds without per-theme variants.
 *
 * Semantic mapping is brand-native (Phase 1 §A.3): success = MAP Teal,
 * info = ribbon blue, warning/pending = MAP Gold, danger = the single
 * functional red the identity does not otherwise provide.
 */
export function StatusBadge({ tone = "neutral", className, children }: StatusBadgeProps) {
  return (
    <span className={cn(styles.badge, styles[tone], className)} data-tone={tone}>
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.label}>{children}</span>
    </span>
  );
}
