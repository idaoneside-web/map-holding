import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Heading, Eyebrow, Text } from "@/components/typography/Text";
import { ContentPlaceholder } from "@/components/feedback/ContentPlaceholder";
import { FooterColumns } from "./FooterColumns";
import { LegalBar } from "./LegalBar";
import {
  BRAND_STATEMENT_UPPER,
  clientPortal,
  footerGroups,
  foundingPartners,
  internalEnvironment,
} from "@/content/navigation";
import styles from "./Footer.module.css";

/**
 * Footer — the public site footer (Phase 3 §5).
 *
 * Contains only what MAP Holding has actually supplied: the approved lockup, the
 * brand statement and the navigation structure. Every corporate fact that has
 * not been provided — registered office, telephone, email, legal entity and
 * registration details — is an explicit `ContentPlaceholder` rather than
 * plausible-looking filler.
 *
 * The `Footer` heading is emitted as a visually-hidden `<h2>` so the visible
 * column titles can be `<h3>` and the document outline stays strictly
 * descending (the same rule the brand gallery is held to).
 */
export function Footer() {
  /* Rendered at build time: the shell is prerendered, so the notice is a
     constant for each build. */
  const year = new Date().getFullYear();

  return (
    <Section as="footer" tone="navy-deep" spacing="md" className={styles.footer}>
      <Container className={styles.inner}>
        <Heading level={2} className="u-visually-hidden">
          Footer
        </Heading>

        <div className={styles.top}>
          <div className={styles.brandColumn}>
            <Logo variant="horizontal-dark" size={180} alt="MAP Holding" />

            <Eyebrow className={styles.statement}>{BRAND_STATEMENT_UPPER}</Eyebrow>

            <Text variant="body-s" tone="default" className={styles.blurb}>
              Reserved for the MAP Holding group descriptor — a single, confirmed sentence
              describing the group&rsquo;s purpose and reach.
            </Text>

            <ContentPlaceholder
              label="Corporate details"
              detail="Supplied by MAP Holding before launch. Nothing is invented here."
              items={[
                "Registered office address",
                "Telephone number",
                "General enquiries email",
                "Legal entity name and registration number",
              ]}
            />
          </div>

          <div className={styles.navColumn}>
            <FooterColumns groups={footerGroups} />

            <div className={styles.access}>
              <Heading level={3} className={styles.accessTitle}>
                Protected access
              </Heading>
              <Text variant="body-s" tone="default" className={styles.accessBody}>
                {clientPortal.label}, {foundingPartners.label} and the {internalEnvironment.label}{" "}
                are distinct gated environments. They are separate products, not one login: a client
                is not a founding partner, and neither is an internal user, unless access is
                explicitly granted. See{" "}
                <code className={styles.code}>docs/ACCESS-CONTROL-ARCHITECTURE.md</code>.
              </Text>
            </div>
          </div>
        </div>

        <LegalBar year={year} />
      </Container>
    </Section>
  );
}
