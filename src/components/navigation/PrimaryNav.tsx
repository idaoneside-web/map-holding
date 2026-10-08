"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { isActivePath } from "@/lib/nav";
import { NavLink } from "./NavLink";
import type { Destination } from "@/content/navigation";
import styles from "./PrimaryNav.module.css";

export interface PrimaryNavProps {
  items: readonly Destination[];
  /** Accessible name for the landmark. */
  label?: string;
  className?: string;
}

/**
 * PrimaryNav — the desktop navigation landmark.
 *
 * A client component only because the current destination is only knowable in
 * the browser; everything else (items, order, labels) comes from configuration.
 * It renders a real `<nav>` + `<ul>` so the landmark and list semantics survive
 * without ARIA.
 */
export function PrimaryNav({ items, label = "Primary", className }: PrimaryNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className={cn(styles.nav, className)}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.href}>
            <NavLink
              href={item.href}
              label={item.label}
              active={isActivePath(pathname, item.href)}
              context="header"
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}
