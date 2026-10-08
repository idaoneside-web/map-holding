import type { Metadata } from "next";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Breadcrumbs, type Crumb } from "@/components/layout/Breadcrumbs";
import { Heading, Text } from "@/components/typography/Text";
import { Button } from "@/components/controls/Button";
import { Badge } from "@/components/feedback/Badge";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About MAP Holding",
  description: "About the MAP Holding group — its positioning, structure and approach.",
};

export default function AboutPage() {
  const crumbs: readonly Crumb[] = [{ label: "Home", href: "/" }, { label: "About" }];
  return (
    <>
      <Section tone="navy-deep" spacing="none" as="div">
        <Container className={styles.heroInner}>
          <Stack gap="md" align="start">
            <Breadcrumbs items={crumbs} />
            <Badge tone="brand">About the group</Badge>
            <Heading level={1} variant="display-l" tone="strong">MAP Holding</Heading>
            <Text variant="body-l" tone="default" className={styles.lead}>
              People · Resources · Opportunity
            </Text>
            <Text variant="body" tone="muted" className={styles.lead}>
              A diversified holding platform that connects projects, partners and capital across strategic sectors.
            </Text>
          </Stack>
        </Container>
      </Section>

      <Section tone="default" spacing="lg">
        <Container>
          <Stack gap="lg">
            <SectionHeader level={2} eyebrow="Overview" title="Who we are"
              lead="MAP Holding operates as a diversified business platform. The group identifies and structures opportunities, brings together the right partners and investors, and supports projects from concept through to operation."
            />
            <div className={styles.grid}>
              <InfoCard title="Diversified platform"
                body="The group works across multiple sectors — mining and materials, energy and infrastructure, real estate, and technology. This diversification is deliberate: it spreads risk and allows cross-sector opportunities to emerge." />
              <InfoCard title="Connector role"
                body="MAP Holding does not simply invest — it connects. The group brings together project sponsors, capital providers, technical partners and regulatory advisors to structure deals that work for all parties."
              />
              <InfoCard title="Strategic approach"
                body="Every opportunity is assessed on commercial merit, regulatory fit and the availability of the right partners. The group does not chase volume — it selects projects where its expertise and network create decisive advantage."
              />
              <InfoCard title="Long-term perspective"
                body="MAP Holding takes a long-term view. Projects are structured for sustainable returns, not quick exits. The group builds relationships with partners and investors that endure beyond any single transaction."
              />
            </div>
          </Stack>
        </Container>
      </Section>

      <Section tone="subtle" spacing="lg">
        <Container>
          <Stack gap="lg">
            <SectionHeader level={2} eyebrow="Sectors" title="Where we operate"
              lead="The group'\''s activities span resource sectors, infrastructure, technology and strategic materials."
            />
            <div className={styles.sectorGrid}>
              <SectorItem label="Mining & Minerals" sectors={["Gold","Lithium","Basalt"]} />
              <SectorItem label="Energy & Infrastructure" sectors={["Waste-to-Energy","Solar","Renewables"]} />
              <SectorItem label="Real Estate & Materials" sectors={["Property","Cement","Construction"]} />
              <SectorItem label="Industrial Manufacturing" sectors={["Oil Machinery","Merchandising"]} />
              <SectorItem label="Technology & Innovation" sectors={["AI","Robotics","Security"]} />
              <SectorItem label="Strategic Development" sectors={["Consultancy","Licensing","Project Structuring"]} />
            </div>
          </Stack>
        </Container>
      </Section>

      <Section tone="navy" spacing="lg">
        <Container>
          <Stack gap="md" align="start">
            <Heading level={2} className={styles.ctaTitle}>Work with MAP Holding</Heading>
            <Text variant="body" tone="default" className={styles.ctaBody}>
              If you have a project, opportunity or investment to discuss, reach out through our contact page. All enquiries are treated with confidentiality.
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

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className={styles.infoCard}>
      <Heading level={3} className={styles.infoTitle}>{title}</Heading>
      <Text variant="body" tone="default" className={styles.infoBody}>{body}</Text>
    </div>
  );
}

function SectorItem({ label, sectors }: { label: string; sectors: string[] }) {
  return (
    <div className={styles.sectorCard}>
      <Heading level={3} className={styles.sectorLabel}>{label}</Heading>
      <div className={styles.sectorTags}>{sectors.map((s) => <Badge key={s} tone="brand">{s}</Badge>)}</div>
    </div>
  );
}
