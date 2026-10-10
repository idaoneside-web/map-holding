import type { Metadata } from "next";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Breadcrumbs, type Crumb } from "@/components/layout/Breadcrumbs";
import { Heading, Text } from "@/components/typography/Text";
import { Button } from "@/components/controls/Button";
import { Badge } from "@/components/feedback/Badge";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { ImageSlot } from "@/components/media/ImageSlot";
import { Grid } from "@/components/layout/Grid";
import { PROJECTS, type ProjectRecord } from "@/content/projects";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Projects — MAP Holding",
  description:
    "MAP Holding projects and opportunities across mining, energy, real estate and technology.",
};

const STATUS_TONE: Record<ProjectRecord["status"], "success" | "warning" | "info"> = {
  AVAILABLE: "success",
  "UNDER REVIEW": "warning",
  "COMING SOON": "info",
};

const PROJECT_CATEGORIES = [
  {
    title: "Mining & Resource Projects",
    items: [
      "Gold exploration and development",
      "Lithium supply-chain projects",
      "Basalt quarrying and processing",
    ],
    desc: "Resource projects spanning exploration, development and production across multiple jurisdictions.",
  },
  {
    title: "Energy Projects",
    items: [
      "Waste-to-energy facility development",
      "Utility-scale solar installations",
      "Renewable energy structuring",
    ],
    desc: "Transition-energy projects delivering both environmental impact and commercial returns.",
  },
  {
    title: "Real Estate & Infrastructure",
    items: [
      "Commercial property investment",
      "Cement and building materials",
      "Construction supply chain",
    ],
    desc: "Property and materials operations serving both domestic and international markets.",
  },
  {
    title: "Technology Ventures",
    items: [
      "AI and data-analytics solutions",
      "Autonomous and robotic systems",
      "Security and fraud-detection platforms",
    ],
    desc: "Technology businesses that leverage AI and automation across industrial and financial sectors.",
  },
  {
    title: "Strategic Opportunities",
    items: ["Joint-venture structuring", "Market-entry advisory", "Partner and investor matching"],
    desc: "Opportunities where MAP Holding'\''s network and expertise create decisive advantage.",
  },
];

export default function ProjectsPage() {
  const crumbs: readonly Crumb[] = [{ label: "Home", href: "/" }, { label: "Projects" }];
  return (
    <>
      <Section tone="navy-deep" spacing="none" as="div">
        <Container className={styles.heroInner}>
          <Stack gap="md" align="start">
            <Breadcrumbs items={crumbs} />
            <Badge tone="brand">Projects</Badge>
            <Heading level={1} variant="display-l" tone="strong">
              Projects & Opportunities
            </Heading>
            <Text variant="body-l" tone="default" className={styles.lead}>
              MAP Holding identifies, structures and advances projects across mining, energy, real
              estate, materials and technology. The portfolio includes direct investments, joint
              ventures and advisory mandates.
            </Text>
          </Stack>
        </Container>
      </Section>

      <Section tone="default" spacing="lg">
        <Container>
          <Stack gap="lg">
            <SectionHeader
              level={2}
              eyebrow="Portfolio"
              title="Project categories"
              lead="Each category represents a distinct line of activity. The group moves between categories depending on where the right opportunities exist."
            />
            <Grid min="20rem" gap="md">
              {PROJECT_CATEGORIES.map((cat) => (
                <ProjectCategory key={cat.title} {...cat} />
              ))}
            </Grid>
          </Stack>
        </Container>
      </Section>

      <Section tone="subtle" spacing="lg">
        <Container>
          <Stack gap="lg">
            <SectionHeader
              level={2}
              eyebrow="Active portfolio"
              title="Approved projects"
              lead="The following projects have been confirmed by MAP Holding. Status reflects current availability or development stage."
            />
            <Grid min="24rem" gap="lg">
              {PROJECTS.map((project, index) => (
                <ProjectCard key={project.ref} project={project} delay={index * 80} />
              ))}
            </Grid>
          </Stack>
        </Container>
      </Section>

      <Section tone="subtle" spacing="lg">
        <Container>
          <Stack gap="lg">
            <SectionHeader
              level={2}
              eyebrow="How it works"
              title="From opportunity to execution"
              lead="MAP Holding'\''s project lifecycle runs from identification through structuring, partner coordination and ultimately to operation. Clients engaged through the portal receive updates at each stage."
            />
            <div className={styles.steps}>
              {[
                "Opportunity identification",
                "Commercial assessment",
                "Partner & investor coordination",
                "Project structuring",
                "Execution & monitoring",
                "Return realization",
              ].map((step, i) => (
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
            <Heading level={2} className={styles.ctaTitle}>
              Discuss a project
            </Heading>
            <Text variant="body" tone="default" className={styles.ctaBody}>
              Whether you are seeking investment, looking for a strategic partner, or have a project
              to develop — reach out. All conversations are confidential.
            </Text>
            <div className={styles.ctaActions}>
              <Button href="/contact" variant="primary" size="lg">
                Contact us
              </Button>
              <Button href="/client-portal" variant="outline" size="lg">
                Client portal
              </Button>
            </div>
          </Stack>
        </Container>
      </Section>
    </>
  );
}

function ProjectCategory({ title, desc, items }: { title: string; desc: string; items: string[] }) {
  return (
    <div className={styles.catCard}>
      <Heading level={3} className={styles.catTitle}>
        {title}
      </Heading>
      <Text variant="body" tone="default" className={styles.catDesc}>
        {desc}
      </Text>
      <ul className={styles.catItems}>
        {items.map((item) => (
          <li key={item} className={styles.catItem}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProjectCard({ project, delay }: { project: ProjectRecord; delay: number }) {
  return (
    <article className={styles.projectCard}>
      <div className={styles.projectVisual}>
        <ImageSlot label={`${project.name} — ${project.sector}`} ratio="16/9" />
        <span className={styles.projectRef}>{project.ref}</span>
      </div>
      <div className={styles.projectBody}>
        <div className={styles.projectHead}>
          <Heading level={3} className={styles.projectName}>
            {project.name}
          </Heading>
          <StatusBadge tone={STATUS_TONE[project.status]}>
            {project.status.replace(/_/g, " ")}
          </StatusBadge>
        </div>
        <dl className={styles.projectMeta}>
          <div className={styles.metaItem}>
            <dt className={styles.metaTerm}>Location</dt>
            <dd className={styles.metaValue}>{project.location}</dd>
          </div>
          <div className={styles.metaItem}>
            <dt className={styles.metaTerm}>Sector</dt>
            <dd className={styles.metaValue}>{project.sector}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
