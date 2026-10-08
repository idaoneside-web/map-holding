import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/lib/cn";
import styles from "./IconButton.module.css";

export type IconButtonVariant = "ghost" | "outline" | "solid";

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "children"
> {
  /** Required: an icon-only control has no accessible name without it. */
  "aria-label": string;
  variant?: IconButtonVariant;
  size?: "sm" | "md";
  className?: string;
  children: ReactNode;
  /**
   * React 19 treats `ref` as an ordinary prop, so no `forwardRef` wrapper is
   * needed. The drawer toggle uses it for focus restoration.
   */
  ref?: Ref<HTMLButtonElement>;
}

/**
 * IconButton — the square, icon-only control used by the navigation drawer.
 *
 * Contract: `aria-label` is mandatory (an icon-only button is otherwise
 * unlabelled for a screen reader), the touch target is never below 44 × 44 px,
 * and the global `:focus-visible` ring is never removed.
 */
export function IconButton({
  variant = "ghost",
  size = "md",
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={cn(styles.button, styles[variant], styles[size], className)}
      {...rest}
    >
      <span className={styles.icon} aria-hidden="true">
        {children}
      </span>
    </button>
  );
}

/* ---------------------------------------------------------------------------
 * Small inline glyphs. Drawn as SVG rather than shipped as a font or icon
 * package, so the shell adds no dependency and no icon-font request.
 * ------------------------------------------------------------------------ */

export function MenuGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    >
      <line x1="3.5" y1="7" x2="20.5" y2="7" />
      <line x1="3.5" y1="12" x2="20.5" y2="12" />
      <line x1="3.5" y1="17" x2="20.5" y2="17" />
    </svg>
  );
}

export function CloseGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    >
      <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" />
      <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" />
    </svg>
  );
}

export function ArrowGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </svg>
  );
}

export function LockGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
