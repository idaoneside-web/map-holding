import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Grid.module.css";

export interface GridProps {
  /**
   * Minimum column width before the grid reflows. This is what makes one
   * implementation serve desktop, tablet and mobile (Phase 1 §H) — no
   * per-viewport components.
   */
  min?: string;
  /** Optional explicit column count at the `lg` breakpoint and above. */
  columns?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}

/**
 * Grid — the responsive column primitive.
 *
 * `minmax(min(var(--grid-min), 100%), 1fr)` is deliberate: the `min(…, 100%)`
 * guard means a long unbreakable child can never push the grid wider than its
 * container, which is how the Phase 2 overflow defects were fixed.
 */
export function Grid({
  min = "18rem",
  columns,
  gap = "md",
  as: Tag = "div",
  className,
  children,
}: GridProps) {
  return (
    <Tag
      className={cn(
        styles.grid,
        styles[`gap-${gap}`],
        columns && styles[`cols-${columns}`],
        className,
      )}
      style={{ "--grid-min": min } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
