import type { Metadata } from "next";
import { Breadcrumbs, type Crumb } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Stack } from "@/components/layout/Stack";
import { Heading, Text } from "@/components/typography/Text";
import { Button } from "@/components/controls/Button";
import { Link } from "@/components/controls/Link";
import { Badge } from "@/components/feedback/Badge";
import { Hero3D } from "@/components/media/Hero3D";
import { Reveal } from "@/components/motion/Reveal";
import { BRAND_STATEMENT_UPPER } from "@/content/navigation";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Client Portal",
  description: "The MAP Holding Client Portal \u2014 secure access to your applications, projects, documents and messages.",
};

const CAPABILITIES = [
  { title: "Applications and status", body: "Follow each application from submission through review to decision, and see what is waiting on you." },
  { title: "Projects you are a party to", body: "Projects you are a party to, with only the information released to you." },
  { title: "Documents released to you", body: "Only the documents explicitly released to you. Internal MAP Holding material never appears." },
  { title: "Secure messages", body: "Communication about your applications and projects, kept in one place." },
  { title: "Your account", body: "Your profile and account details, and how MAP Holding reaches you." },
  { title: "Notifications", body: "Told when something needs you, and when the status of an application changes." },
];

export default function ClientPortalLandingPage() {
  const crumbs: readonly Crumb[] = [{ label: "Home", href: "/" }, { label: "Client Portal" }];
  return (
    <>
      <Section tone="navy-deep" spacing="none" as="div" className={styles.hero}>
        <div className={styles.heroLayer}><Hero3D /></div>
        <Container className={styles.heroInner}>
          <Stack gap="lg" align="start">
            <Breadcrumbs items={crumbs} />
            <div className={styles.heroText}>
              <p className={styles.statement}>{BRAND_STATEMENT_UPPER}</p>
              <Heading level={1} variant="display-l" tone="strong" className={styles.heroTitle}>
                Client Portal
              </Heading>
              <Text variant="body-l" tone="default" className={styles.heroLead}>
                A private environment for MAP Holding clients. Access your applications, projects, documents and messages — all in one secure place.
              </Text>
            </div>
            <div className={styles.heroActions}>
              <Button href="/client-portal/login" variant="primary" size="lg">Secure Client Login</Button>
              <Button href="/about" variant="outline" size="lg">Explore the group</Button>
            </div>
          </Stack>
        </Container>
      </Section>

      <Section tone="default" spacing="lg">
        <Container>
          <Stack gap="xl">
            <SectionHeader level={2} eyebrow="What you get" title="Your client environment"
              lead="Everything you need to manage your relationship with MAP Holding, from one signed-in location."
            />
            <Grid min="18rem" gap="md">
              {CAPABILITIES.map((cap) => (
                <CapabilityCard key={cap.title} {...cap} />
              ))}
            </Grid>
          </Stack>
        </Container>
      </Section>

      <Section tone="navy" spacing="lg">
        <Container>
          <Stack gap="lg" align="start">
            <SectionHeader level={2} eyebrow="Access" title="Secure Client Login"
              lead="Sign in to reach your applications, projects, documents and messages."
            />
            <div className={styles.heroActions}>
              <Button href="/client-portal/login" variant="primary" size="lg">Sign in to the Client Portal</Button>
            </div>
            <Text variant="body-s" tone="muted">
              Not a client? The Client Portal is a separate protected environment. If you believe you should have access, contact MAP Holding through the{" "}
              <Link href="/contact" variant="subtle">contact page</Link>.
            </Text>
          </Stack>
        </Container>
      </Section>
    </>
  );
}

function CapabilityCard({ title, body }: { title: string; body: string }) {
  return (
    <div className={styles.feature}>
      <Heading level={3} className={styles.featureTitle}>{title}</Heading>
      <Text variant="body-s" tone="default" className={styles.featureBody}>{body}</Text>
    </div>
  );
}
