import Link from "next/link";
import { cn } from "@/lib/cn";
import styles from "./NavLink.module.css";

export interface NavLinkProps {
  href: string;
  label: string;
  /** Marks the current destination. Drives `aria-current="page"` and the indicator. */
  active?: boolean;
  /** Optional short description, used in the mobile drawer. */
  description?: string;
  /** Which shell the link appears in. */
  context?: "header" | "drawer" | "footer";
  onClick?: () => void;
  className?: string;
}

/**
 * NavLink — the navigation item primitive.
 *
 * The active state is never colour-only: the active item also carries
 * `aria-current="page"` and a solid gradient bar (Phase 1 §L).
 */
export function NavLink({
  href,
  label,
  active = false,
  description,
  context = "header",
  onClick,
  className,
}: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(styles.link, styles[context], active && styles.active, className)}
    >
      <span className={styles.label}>{label}</span>
      {description ? <span className={styles.description}>{description}</span> : null}
      <span className={styles.indicator} aria-hidden="true" />
    </Link>
  );
}
