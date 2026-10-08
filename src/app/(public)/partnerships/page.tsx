import type { Metadata } from "next";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Breadcrumbs, type Crumb } from "@/components/layout/Breadcrumbs";
import { Heading, Text } from "@/components/typography/Text";
import { Button } from "@/components/controls/Button";
import { Badge } from "@/components/feedback/Badge";
import { Grid } from "@/components/layout/Grid";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Partnerships — MAP Holding",
  description: "MAP Holding partnership approach — how the group works with investors, project sponsors and strategic allies.",
};

const PARTNER_TYPES = [
  { title: "Investors", desc: "Capital providers seeking exposure to resource sectors, infrastructure and technology. MAP Holding structures investments to align with each investor\s return expectations and risk profile.", examples: ["Private equity and family offices", "Institutional investors", "Development finance institutions", "Strategic corporate investors"] },
  { title: "Project Sponsors", desc: "Sponsors with viable projects who need the group\s network, structuring expertise and access to capital to move forward.", examples: ["Resource developers", "Infrastructure sponsors", "Technology entrepreneurs", "Real estate developers"] },
  { title: "Strategic Partners", desc: "Organizations and firms that bring complementary capabilities — technical, regulatory, commercial or geographic — to shared opportunities.", examples: ["Engineering and technical firms", "Legal and regulatory advisors", "Market-entry consultants", "Industry associations"] },
  { title: "Government & Agencies", desc: "Public-sector bodies and development agencies that work with MAP Holding on projects of strategic economic importance.", examples: ["National and regional governments", "Economic-development agencies", "Multilateral development banks", "Export-credit agencies"] },
];

export default function PartnershipsPage() {
  const crumbs: readonly Crumb[] = [{ label: "Home", href: "/" }, { label: "Partnerships" }];
  return (
    <>
      <Section tone="navy-deep" spacing="none" as="div">
        <Container className={styles.heroInner}>
          <Stack gap="md" align="start">
            <Breadcrumbs items={crumbs} />
            <Badge tone="brand">Partnerships</Badge>
            <Heading level={1} variant="display-l" tone="strong">Partners & Alliances</Heading>
            <Text variant="body-l" tone="default" className={styles.lead}>
              MAP Holding\s strength lies in its network. The group works alongside investors, project sponsors, strategic partners and public-sector bodies to structure and advance opportunities.
            </Text>
          </Stack>
        </Container>
      </Section>

      <Section tone="default" spacing="lg">
        <Container>
          <Stack gap="lg">
            <SectionHeader level={2} eyebrow="Who we work with" title="Partner types"
              lead="Each category of partner brings something different. MAP Holding structures relationships to match the specific value each party contributes."
            />
            <Grid min="20rem" gap="md">
              {PARTNER_TYPES.map((pt) => (
                <PartnerCard key={pt.title} {...pt} />
              ))}
            </Grid>
          </Stack>
        </Container>
      </Section>

      <Section tone="subtle" spacing="lg">
        <Container>
          <Stack gap="lg">
            <SectionHeader level={2} eyebrow="How we partner" title="The partnership process"
              lead="Every partnership follows a clear process — from initial introduction through due diligence to structured agreement."
            />
            <div className={styles.steps}>
              {["Initial introduction and confidentiality agreement","Preliminary assessment of alignment","Technical and commercial due diligence","Partnership structuring and agreement","Execution and ongoing management"].map((step, i) => (
                <div key={step} className={styles.step}>
                  <span className={styles.stepNum}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={styles.stepLabel}>{step}</span>
                </div>
              ))}
            </div>
          </Stack>
        </Container>
      </Section>

      <Section tone="navy" spacing="lg">
        <Container>
          <Stack gap="md" align="start">
            <Heading level={2} className={styles.ctaTitle}>Explore a partnership</Heading>
            <Text variant="body" tone="default" className={styles.ctaBody}>
              Whether you are an investor, project sponsor or strategic organization, reach out to discuss how MAP Holding can add value to your opportunity.
            </Text>
            <div className={styles.ctaActions}>
              <Button href="/contact" variant="primary" size="lg">Contact us</Button>
              <Button href="/client-portal" variant="outline" size="lg">Client portal</Button>
            </div>
          </Stack>
        </Container>
      </Section>
    </>
  );
}

function PartnerCard({ title, desc, examples }: { title: string; desc: string; examples: string[] }) {
  return (
    <div className={styles.card}>
      <Heading level={3} className={styles.cardTitle}>{title}</Heading>
      <Text variant="body" tone="default" className={styles.cardDesc}>{desc}</Text>
      <ul className={styles.examples}>
        {examples.map((e) => <li key={e} className={styles.example}>{e}</li>)}
      </ul>
    </div>
  );
}
