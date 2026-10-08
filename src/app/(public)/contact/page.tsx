import type { Metadata } from "next";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Breadcrumbs, type Crumb } from "@/components/layout/Breadcrumbs";
import { Heading, Text } from "@/components/typography/Text";
import { Button } from "@/components/controls/Button";
import { Badge } from "@/components/feedback/Badge";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Contact — MAP Holding",
  description: "Contact MAP Holding for business enquiries, partnership discussions and client access.",
};

export default function ContactPage() {
  const crumbs: readonly Crumb[] = [{ label: "Home", href: "/" }, { label: "Contact" }];
  return (
    <>
      <Section tone="navy-deep" spacing="none" as="div">
        <Container className={styles.heroInner}>
          <Stack gap="md" align="start">
            <Breadcrumbs items={crumbs} />
            <Badge tone="brand">Contact</Badge>
            <Heading level={1} variant="display-l" tone="strong">Get in touch</Heading>
            <Text variant="body-l" tone="default" className={styles.lead}>
              Whether you are a potential client, investor, partner or supplier, reach out. All enquiries are treated with full confidentiality.
            </Text>
          </Stack>
        </Container>
      </Section>

      <Section tone="default" spacing="lg">
        <Container>
          <Stack gap="lg">
            <SectionHeader level={2} eyebrow="Enquiries" title="How to reach us"
              lead="MAP Holding receives enquiries from a wide range of sources. Select the category that best matches your interest and we will direct your message to the right team."
            />
            <div className={styles.grid}>
              <ContactCard title="General enquiries" desc="Questions about MAP Holding, our business areas or how we work." />
              <ContactCard title="Investment opportunities" desc="For investors and capital providers exploring opportunities with the group." />
              <ContactCard title="Project submissions" desc="For project sponsors seeking partnership, funding or advisory support." />
              <ContactCard title="Client access" desc="For existing or prospective clients who need help with the client portal." />
            </div>
          </Stack>
        </Container>
      </Section>

      <Section tone="subtle" spacing="lg">
        <Container>
          <Stack gap="lg">
            <SectionHeader level={2} eyebrow=" Confidentiality"
              title="All enquiries are confidential"
              lead="MAP Holding treats every enquiry with strict confidentiality. We do not disclose the existence of a conversation or the nature of any opportunity discussed without explicit permission."
            />
            <div className={styles.confidenceBox}>
              <Text variant="body" tone="default">
                You may reach out by phone or email. A member of the MAP Holding team will respond within one business day. For urgent matters, please indicate the urgency in your initial message.
              </Text>
            </div>
          </Stack>
        </Container>
      </Section>

      <Section tone="navy" spacing="lg">
        <Container>
          <Stack gap="md" align="start">
            <Heading level={2} className={styles.ctaTitle}>Ready to start a conversation?</Heading>
            <Text variant="body" tone="default" className={styles.ctaBody}>
              The fastest way to reach MAP Holding is through the client portal if you are an existing client, or by contacting us directly for new enquiries.
            </Text>
            <div className={styles.ctaActions}>
              <Button href="/client-portal" variant="primary" size="lg">Client portal</Button>
              <Button href="/about" variant="outline" size="lg">About the group</Button>
            </div>
          </Stack>
        </Container>
      </Section>
    </>
  );
}

function ContactCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className={styles.card}>
      <Heading level={3} className={styles.cardTitle}>{title}</Heading>
      <Text variant="body" tone="default" className={styles.cardDesc}>{desc}</Text>
    </div>
  );
}
