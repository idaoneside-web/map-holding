import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Divider.module.css";

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  /** `brand` paints the logo-derived amber → blue → teal rule. */
  variant?: "default" | "brand" | "strong";
  /** Extra vertical breathing room for horizontal rules. */
  spaced?: boolean;
  /** Accessible name when the divider carries structural meaning. */
  label?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Divider — and the brand `Rule` (variant="brand"), which is the logo's own
 * gradient used as a separator. Vertical dividers expose `role="separator"`
 * with `aria-orientation`; horizontal ones use the native `<hr>` semantic.
 */
export function Divider({
  orientation = "horizontal",
  variant = "default",
  spaced = false,
  label,
  className,
  children,
}: DividerProps) {
  const classes = cn(
    styles.divider,
    styles[orientation],
    styles[variant],
    spaced && styles.spaced,
    className,
  );

  if (orientation === "vertical") {
    return <span className={classes} role="separator" aria-orientation="vertical" />;
  }

  return (
    <div className={cn(styles.horizontalWrap, spaced && styles.spaced)}>
      <hr className={classes} aria-label={label} />
      {children}
    </div>
  );
}

/** The brand gradient rule, named as in the Phase 1 component inventory. */
export function Rule({ className, spaced }: { className?: string; spaced?: boolean }) {
  return <Divider variant="brand" spaced={spaced} className={className} />;
}
