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
  title: "Business Areas — MAP Holding",
  description: "MAP Holding business areas: mining, energy, real estate, materials, technology and strategic development.",
};

const AREAS = [
  { id: "mining", title: "Mining & Minerals", tags: ["Gold","Lithium","Basalt"],
    body: "MAP Holding develops resource projects and commodity positions across the mining value chain. Current focus areas include gold exploration and production, lithium for battery supply chains, and basalt for construction and industrial applications. The group works through direct projects, joint ventures and strategic partnerships.",
    details: ["Gold exploration and development", "Lithium supply-chain projects", "Basalt mining and processing", "Commodity trading and merchandising"] },
  { id: "energy", title: "Energy & Infrastructure", tags: ["Waste-to-Energy","Solar","Renewables"],
    body: "The group is active in transition-energy projects that deliver both environmental and commercial returns. Waste-to-energy facilities convert municipal and industrial waste into usable power, while solar and renewable installations serve utility-scale and commercial clients across multiple markets.",
    details: ["Waste-to-energy plant development", "Utility-scale solar installations", "Renewable energy project structuring", "Energy infrastructure financing"] },
  { id: "realestate", title: "Real Estate & Materials", tags: ["Property","Cement","Construction"],
    body: "Real estate and building materials represent a substantial part of the group'\''s portfolio. Operations span property investment and development, cement manufacturing and distribution, and downstream construction supply chain services.",
    details: ["Commercial and industrial property", "Cement production and distribution", "Construction materials supply", "Property development and management"] },
  { id: "tech", title: "Technology & Innovation", tags: ["AI","Robotics","Security"],
    body: "Technology ventures within the group cover artificial intelligence applications, autonomous and robotic systems, and security and fraud-detection solutions. These areas are selected for their convergence with the group'\''s other sectors — for example, AI-driven fraud detection in financial services or robotics in industrial operations.",
    details: ["Artificial intelligence solutions", "Autonomous and robotic systems", "Security and fraud-detection technology", "Digital platform development"] },
  { id: "industrial", title: "Industrial Manufacturing", tags: ["Oil Machinery","Merchandising"],
    body: "Industrial manufacturing and specialized equipment represent another pillar of the group'\''s activities. This includes oil-field machinery and equipment supply, alongside broader merchandising operations that connect industrial buyers with verified suppliers.",
    details: ["Oil-field machinery and equipment", "Industrial equipment supply", "Commodity merchandising", "Technical trading services"] },
  { id: "strategic", title: "Strategic Development", tags: ["Consultancy","Licensing","Project Structuring"],
    body: "The strategic-development arm provides advisory, licensing and business-development services. MAP Holding assists clients with market entry strategy, regulatory navigation, project structuring and partner identification across complex, multi-jurisdictional environments.",
    details: ["Market-entry consultancy", "Business licensing and compliance", "Project structuring and feasibility", "Partner and investor coordination"] },
];

export default function BusinessAreasPage() {
  const crumbs: readonly Crumb[] = [{ label: "Home", href: "/" }, { label: "Business Areas" }];
  return (
    <>
      <Section tone="navy-deep" spacing="none" as="div">
        <Container className={styles.heroInner}>
          <Stack gap="md" align="start">
            <Breadcrumbs items={crumbs} />
            <Badge tone="brand">Business Areas</Badge>
            <Heading level={1} variant="display-l" tone="strong">What we do</Heading>
            <Text variant="body-l" tone="default" className={styles.lead}>
              MAP Holding operates across six business areas, each representing a distinct line of activity where the group brings together capital, expertise and partnerships.
            </Text>
          </Stack>
        </Container>
      </Section>

      {AREAS.map((area, i) => (
        <Section key={area.id} tone={i % 2 === 0 ? "default" : "subtle"} spacing="lg">
          <Container>
            <Stack gap="lg">
              <div className={styles.areaHeader}>
                <Heading level={2} className={styles.areaTitle}>{area.title}</Heading>
                <div className={styles.tags}>{area.tags.map((t) => <Badge key={t} tone="brand">{t}</Badge>)}</div>
              </div>
              <div className={styles.areaBody}>
                <Text variant="body" tone="default" className={styles.bodyText}>{area.body}</Text>
                <ul className={styles.detailList}>
                  {area.details.map((d) => (
                    <li key={d} className={styles.detailItem}>{d}</li>
                  ))}
                </ul>
              </div>
            </Stack>
          </Container>
        </Section>
      ))}

      <Section tone="navy" spacing="lg">
        <Container>
          <Stack gap="md" align="start">
            <Heading level={2} className={styles.ctaTitle}>Discuss an opportunity</Heading>
            <Text variant="body" tone="default" className={styles.ctaBody}>
              If you have a project or investment to discuss, contact us directly. All enquiries are treated with full confidentiality.
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
