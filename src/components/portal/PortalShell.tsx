import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { SkipLink } from "@/components/navigation/SkipLink";
import { Badge } from "@/components/feedback/Badge";
import { Text } from "@/components/typography/Text";
import { portalUser, PORTAL_PREVIEW } from "@/content/portal";
import { PortalNavList } from "./PortalNavList";
import { PortalAccount } from "./PortalAccount";
import { PortalMobileNav } from "./PortalMobileNav";
import styles from "./PortalShell.module.css";

export interface PortalShellProps {
  children: ReactNode;
}

/**
 * PortalShell — the authenticated client environment chrome (Phase 4).
 *
 * The public shell's own comment anticipated this component: the portal
 * "replaces its own layout's use of `SiteShell`, it does not fork it". So this is
 * a sibling of `SiteShell`, not a variant of it, and the public shell is left
 * untouched.
 *
 * Structure:
 *   SkipLink → rail (brand · nav · account) → preview strip → top bar (mobile) → main
 *
 * Design intent, per the Phase 4 direction:
 *   - MAP navy / near-black foundation, ivory type, gold as a *controlled* accent;
 *   - a premium private-client rail rather than an enterprise sidebar — generous
 *     spacing, refined hairlines, one gradient indicator, no heavy borders and no
 *     box-heavy information grid;
 *   - a quiet atmospheric ground (CSS only) so the environment carries MAP
 *     atmosphere without putting an animated 3D object behind every page. The
 *     public homepage remains the strongest 3D expression.
 *
 * It is a server component: only the two navigation islands ship JavaScript.
 */
export function PortalShell({ children }: PortalShellProps) {
  return (
    <div className={styles.shell}>
      <SkipLink />

      <aside className={styles.rail}>
        <div className={styles.railBrand}>
          <Link href="/" aria-label="MAP Holding home" className={styles.brandLink}>
            <Logo variant="horizontal-dark" size={168} alt="MAP Holding" priority />
          </Link>
        </div>

        <div className={styles.railNav}>
          <PortalNavList context="rail" />
        </div>

        <div className={styles.railFoot}>
          <Link href="/" className={styles.publicLink}>
            Public website
          </Link>
          <PortalAccount user={portalUser} />
        </div>
      </aside>

      <div className={styles.content}>
        <p className={styles.preview}>
          <Badge tone="gold">{PORTAL_PREVIEW.label}</Badge>
          <Text as="span" variant="caption" tone="muted" className={styles.previewText}>
            {PORTAL_PREVIEW.notice}
          </Text>
        </p>

        <header className={styles.topbar}>
          <Link href="/" aria-label="MAP Holding home" className={styles.topbarBrand}>
            <Logo variant="horizontal-dark" size={150} alt="MAP Holding" priority />
          </Link>
          <PortalMobileNav />
        </header>

        <main id="main-content" className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
}
