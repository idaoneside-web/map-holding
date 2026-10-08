"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { isActivePath } from "@/lib/nav";
import { portalNav } from "@/content/portal";
import { PortalGlyph } from "./PortalGlyphs";
import styles from "./PortalNavList.module.css";

export interface PortalNavListProps {
  /** `rail` = the desktop private-environment rail; `drawer` = the mobile drawer. */
  context?: "rail" | "drawer";
  /** Fired on navigation, so a tapped link can close the mobile drawer. */
  onNavigate?: () => void;
}

/**
 * PortalNavList — the client portal navigation.
 *
 * One implementation serves the desktop rail and the mobile drawer, so the two
 * can never drift. The current destination is never colour-only: it also carries
 * `aria-current="page"` and a solid gradient indicator (Phase 1 §L).
 *
 * The Dashboard item is matched *exactly*, since every other destination nests
 * beneath it and a prefix match would light up Dashboard on every page.
 */
export function PortalNavList({ context = "rail", onNavigate }: PortalNavListProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Client portal" className={cn(styles.nav, styles[context])}>
      <ul className={styles.list}>
        {portalNav.map((item) => {
          const active =
            item.href === "/client-portal/dashboard"
              ? pathname === "/client-portal/dashboard"
              : isActivePath(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(styles.link, active && styles.active)}
              >
                <span className={styles.glyph}>
                  <PortalGlyph name={item.glyph} />
                </span>
                <span className={styles.label}>{item.label}</span>
                {item.badge ? (
                  <span className={styles.badge}>
                    <span aria-hidden="true">{item.badge}</span>
                    <span className="u-visually-hidden"> unread</span>
                  </span>
                ) : null}
                <span className={styles.indicator} aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
