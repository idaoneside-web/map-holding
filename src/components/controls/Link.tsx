import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Link.module.css";

export type LinkVariant = "default" | "subtle" | "standalone" | "nav";

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  variant?: LinkVariant;
  className?: string;
  children?: ReactNode;
}

/**
 * Link — the navigational primitive (Button covers actions).
 *
 * - Underline is always present or always absent-by-design; colour is never the
 *   only way a link is distinguished (Phase 1 §L).
 * - External links get `rel="noopener noreferrer"` automatically.
 * - Focus uses the global :focus-visible ring.
 */
export function Link({ variant = "default", className, children, ...rest }: LinkProps) {
  const isExternal = /^https?:\/\//i.test(rest.href ?? "");
  return (
    <a
      className={cn(styles.link, styles[variant], className)}
      {...rest}
      rel={rest.target === "_blank" || isExternal ? (rest.rel ?? "noopener noreferrer") : rest.rel}
    >
      {children}
      {isExternal ? <span className="u-visually-hidden"> (opens in a new tab)</span> : null}
    </a>
  );
}

export function LinkList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ul className={cn(styles.list, className)} role="list">
      {children}
    </ul>
  );
}
