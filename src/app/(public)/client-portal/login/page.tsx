import type { Metadata } from "next";
import { Breadcrumbs, type Crumb } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Stack } from "@/components/layout/Stack";
import { Text } from "@/components/typography/Text";
import { Link } from "@/components/controls/Link";
import { PortalLoginForm } from "@/components/portal/PortalLoginForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Client Login",
  description: "Sign in to the MAP Holding Client Portal.",
  robots: { index: false, follow: false },
};

/**
 * /client-portal/login — the Secure Client Login (Phase 4).
 *
 * Part of the public website: the public visitor path is
 * public website → Client Portal landing → login → private portal. It uses the
 * public shell, and it is not indexed.
 */
export default function ClientLoginPage() {
  const crumbs: readonly Crumb[] = [
    { label: "Home", href: "/" },
    { label: "Client Portal", href: "/client-portal" },
    { label: "Login" },
  ];

  return (
    <Section tone="subtle" spacing="lg">
      <Container size="narrow">
        <Stack gap="lg">
          <Breadcrumbs items={crumbs} />
          <SectionHeader
            level={1}
            eyebrow="Protected environment"
            title="Secure Client Login"
            lead="Sign in to reach your applications, projects, documents and messages."
          />

          <div className={styles.grid}>
            <div className={styles.formCol}>
              <PortalLoginForm />
            </div>

            <aside className={styles.aside}>
              <Text variant="body-s" tone="default">
                A client account reaches only that client&rsquo;s own applications, projects,
                documents and messages. Internal and confidential MAP Holding material is not part
                of this environment and is never reachable from a client sign-in.
              </Text>
              <ul className={styles.links}>
                <li>
                  <Link href="/client-portal" variant="subtle">
                    Return to the Client Portal
                  </Link>
                </li>
                <li>
                  <Link href="/founding-partners" variant="subtle">
                    Founding Partners
                  </Link>
                </li>
                <li>
                  <Link href="/contact" variant="subtle">
                    Contact MAP Holding
                  </Link>
                </li>
              </ul>
            </aside>
          </div>
        </Stack>
      </Container>
    </Section>
  );
}
