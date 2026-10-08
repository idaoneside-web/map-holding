"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { CloseGlyph, IconButton, MenuGlyph } from "@/components/controls/IconButton";
import { Button } from "@/components/controls/Button";
import { Badge } from "@/components/feedback/Badge";
import { isActivePath, NAV_DESKTOP_MEDIA_QUERY } from "@/lib/nav";
import { NavLink } from "./NavLink";
import type { Destination } from "@/content/navigation";
import styles from "./MobileNav.module.css";

export interface MobileNavProps {
  items: readonly Destination[];
  /** The gated portal entry point, surfaced as the drawer's primary action. */
  portal: Destination;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const PANEL_ID = "mobile-navigation-panel";

/**
 * MobileNav — the accessible navigation drawer (Phase 3 §4).
 *
 * Behaviour contract:
 *  - a real toggle button carrying `aria-expanded` / `aria-controls`;
 *  - `role="dialog"` + `aria-modal="true"` so assistive tech scopes to the panel;
 *  - focus enters the panel on open and is restored to the toggle on close;
 *  - `Tab` / `Shift+Tab` trapped inside the panel;
 *  - `Escape` closes it;
 *  - page scroll locked while open, with the scrollbar gutter preserved so the
 *    layout cannot jump;
 *  - the global visible focus ring on every control;
 *  - closes on navigation, so a tapped link never leaves the drawer open.
 *
 * It serves both tablet and mobile below the `lg` breakpoint. Phase 1 §H names a
 * "condensed nav" for tablet; rather than invent a third variant, the drawer is
 * used at both sizes.
 */
export function MobileNav({ items, portal }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const close = useCallback(() => {
    setOpen(false);
    // Focus restoration: return the user to the control that opened the drawer.
    toggleRef.current?.focus();
  }, []);

  /* Scroll lock — a DOM side effect keyed on `open`. The scrollbar width is
     compensated so locking does not shift the page. */
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const gutter = window.innerWidth - root.clientWidth;

    root.style.overflow = "hidden";
    if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;

    return () => {
      root.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
    };
  }, [open]);

  /* Focus enters the dialog when it opens, and the panel is the focus target
     (`tabIndex={-1}`), so the dialog's accessible name is announced without
     jumping the reading position into the middle of the list. A DOM side
     effect, not state. */
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  /* If the viewport reaches the desktop breakpoint while the drawer is open,
     dismiss it so the scroll lock cannot outlive the layout that needed it. */
  useEffect(() => {
    if (!open) return;
    const media = window.matchMedia(NAV_DESKTOP_MEDIA_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [open]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;

    const panel = panelRef.current;
    if (!panel) return;
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      <IconButton
        ref={toggleRef}
        className={styles.toggle}
        variant="ghost"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls={PANEL_ID}
        aria-haspopup="dialog"
        onClick={() => (open ? close() : setOpen(true))}
      >
        {open ? <CloseGlyph /> : <MenuGlyph />}
      </IconButton>

      {open ? (
        <div
          id={PANEL_ID}
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          onKeyDown={handleKeyDown}
        >
          <div ref={panelRef} className={styles.panel} tabIndex={-1}>
            <div className={styles.top}>
              {/* Decorative: the same lockup is already announced by the header
                  and the drawer's navigation landmark carries the structure. */}
              <Logo variant="horizontal-dark" size={180} alt="" priority />
            </div>

            <nav aria-label="Primary" className={styles.nav}>
              <ul className={styles.list}>
                {items.map((item) => (
                  <li key={item.href}>
                    <NavLink
                      href={item.href}
                      label={item.label}
                      description={item.description}
                      active={isActivePath(pathname, item.href)}
                      context="drawer"
                      onClick={close}
                    />
                  </li>
                ))}
              </ul>
            </nav>

            <div className={styles.footer}>
              <Button href={portal.href} variant="primary" size="lg" fullWidth onClick={close}>
                {portal.label}
              </Button>
              <p className={styles.note}>
                <Badge locked>Protected</Badge>
                <span>
                  Sign-in for the client portal and founding partners arrives in a later phase.
                </span>
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
