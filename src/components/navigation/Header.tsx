import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/controls/Button";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { MobileNav } from "./MobileNav";
import { PrimaryNav } from "./PrimaryNav";
import { clientPortal, primaryNav } from "@/content/navigation";
import styles from "./Header.module.css";

/**
 * Header — the public site header (Phase 3 §3).
 *
 * Design intent: premium, restrained, international. Concretely that means
 *  - the approved horizontal-dark lockup on the approved MAP Navy ground;
 *  - one hairline divider, no glass panel, no blur, no floating pill;
 *  - a compact nav row rather than an oversized masthead;
 *  - a single restrained CTA (Client Portal) on the right.
 *
 * The `Section` primitive supplies the navy ground *and* the dark-theme token
 * re-pointing, so nothing here duplicates the theming already defined in the
 * brand foundation.
 *
 * This is a server component: only the two navigation islands ship JavaScript.
 */
export function Header() {
  return (
    <Section as="header" tone="navy" spacing="none" className={styles.header}>
      <Container className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <Logo variant="horizontal-dark" size={180} alt="MAP Holding" priority />
        </Link>

        <PrimaryNav items={primaryNav} className={styles.nav} />

        <div className={styles.actions}>
          <Button href={clientPortal.href} variant="outline" size="sm" className={styles.portal}>
            {clientPortal.label}
          </Button>
          <MobileNav items={primaryNav} portal={clientPortal} />
        </div>
      </Container>
    </Section>
  );
}
