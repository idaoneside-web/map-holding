"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { CloseGlyph, IconButton, MenuGlyph } from "@/components/controls/IconButton";
import { Badge } from "@/components/feedback/Badge";
import { NAV_DESKTOP_MEDIA_QUERY } from "@/lib/nav";
import { portalUser, PORTAL_PREVIEW } from "@/content/portal";
import { PortalNavList } from "./PortalNavList";
import { PortalAccount } from "./PortalAccount";
import styles from "./PortalMobileNav.module.css";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const PANEL_ID = "portal-navigation-panel";

/**
 * PortalMobileNav — the client portal's drawer (tablet and mobile).
 *
 * It reuses the exact accessibility contract already proven by the public
 * `MobileNav`, so the portal inherits a behaviour that is already tested:
 * a real toggle with `aria-expanded`/`aria-controls`, `role="dialog"` +
 * `aria-modal`, focus moving into the panel on open and back to the toggle on
 * close, Tab trapping, Escape to close, scroll lock with gutter compensation,
 * and auto-dismiss if the viewport reaches the desktop breakpoint.
 *
 * The rail is never squeezed into a narrow screen; below the breakpoint the
 * rail is hidden by CSS and this drawer takes over.
 */
export function PortalMobileNav() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

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

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const media = window.matchMedia(NAV_DESKTOP_MEDIA_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [open]);

  /* Close the drawer whenever the route changes: every link in the drawer calls
     `close` directly on tap, so no pathname effect (and no setState-in-effect)
     is needed here. */

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
        aria-label={open ? "Close portal navigation" : "Open portal navigation"}
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
          aria-label="Portal navigation"
          onKeyDown={handleKeyDown}
        >
          <div ref={panelRef} className={styles.panel} tabIndex={-1}>
            <div className={styles.top}>
              <Logo variant="horizontal-dark" size={168} alt="MAP Holding" priority />
              <Badge tone="gold">{PORTAL_PREVIEW.label}</Badge>
            </div>

            <PortalNavList context="drawer" onNavigate={close} />

            <div className={styles.footer}>
              <Link href="/" className={styles.publicLink} onClick={close}>
                Public website
              </Link>
              <PortalAccount user={portalUser} context="drawer" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
