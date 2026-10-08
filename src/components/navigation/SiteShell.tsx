import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { SkipLink } from "./SkipLink";
import styles from "./SiteShell.module.css";

export interface SiteShellProps {
  children: ReactNode;
}

/**
 * SiteShell — the structural chrome every public route mounts into
 * (Phase 3 §1).
 *
 *     SkipLink → header (banner) → main → footer (contentinfo)
 *
 * It is a single component rather than a copied layout so the public group and
 * the gated group cannot drift apart while they still share the same brand
 * chrome. When the portal grows its own shell in Phase 8/9 it will replace its
 * own layout's use of this component, not fork it.
 *
 * `<main id="main-content">` deliberately has no `tabIndex="-1"`. Modern
 * browsers set the sequential focus navigation starting point at a fragment
 * target after skip-link activation, so the next Tab lands inside `<main>`
 * without making the whole region a focus target (which would draw a page-wide
 * focus ring). This behaviour is asserted in the browser tests.
 */
export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className={styles.shell}>
      <SkipLink />
      <Header />
      <main id="main-content" className={styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
