import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Button } from "@/components/controls/Button";
import { Badge } from "@/components/feedback/Badge";
import { StatusBadge, type StatusTone } from "@/components/feedback/StatusBadge";
import { ImageSlot } from "@/components/media/ImageSlot";
import { Heading, Text } from "@/components/typography/Text";
import { Reveal } from "@/components/motion/Reveal";
import { Panel } from "@/components/portal/Panel";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { portalProjects, type PortalProject } from "@/content/portal";
import styles from "./page.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return portalProjects.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const found = portalProjects.find((p) => p.id === id);
  return {
    title: found ? `${found.name} — Project` : "Project",
    robots: { index: false, follow: false },
  };
}

const STATUS_TONE: Record<string, StatusTone> = {
  active: "success",
  "in-review": "warning",
  pipeline: "info",
  complete: "neutral",
};

export default async function PortalProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = portalProjects.find((p) => p.id === id);
  if (!project) notFound();

  return (
    <Container size="portal">
      <Stack gap="xl">
        <PortalPageHeader
          eyebrow="Project details"
          title={project.name}
          lead={`Reference ${project.ref} · ${project.sector}`}
        />

        <Reveal>
          <Panel title="Project overview" level={2}>
            <div className={styles.overview}>
              <div className={styles.visual}>
                <ImageSlot label={project.imageLabel} ratio="16/9" />
                <span className={styles.ref}>{project.ref}</span>
              </div>
              <div className={styles.info}>
                <div className={styles.statusRow}>
                  <StatusBadge tone={STATUS_TONE[project.status] ?? "neutral"}>
                    {project.statusLabel}
                  </StatusBadge>
                  {project.isSample ? <Badge tone="gold">Sample record</Badge> : null}
                </div>
                <dl className={styles.meta}>
                  <div className={styles.metaItem}>
                    <dt className={styles.metaTerm}>Sector</dt>
                    <dd className={styles.metaValue}>{project.sector}</dd>
                  </div>
                  <div className={styles.metaItem}>
                    <dt className={styles.metaTerm}>Location</dt>
                    <dd className={styles.metaValue}>{project.location}</dd>
                  </div>
                  {project.applicationRef ? (
                    <div className={styles.metaItem}>
                      <dt className={styles.metaTerm}>Application</dt>
                      <dd className={styles.metaValue}>{project.applicationRef}</dd>
                    </div>
                  ) : null}
                </dl>
                <Text variant="body" tone="default" className={styles.description}>
                  {project.description}
                </Text>
              </div>
            </div>
          </Panel>
        </Reveal>

        <Reveal>
          <Panel title="What you can see" level={2}>
            <Text variant="body-s" tone="muted">
              This page shows only information released to you as a client. Internal MAP Holding
              reports, assessments, financial details and working notes are never published to a
              client environment. If you need more detail, contact MAP Holding through your
              messages area.
            </Text>
          </Panel>
        </Reveal>

        <div className={styles.back}>
          <Button href="/client-portal/projects" variant="outline" size="sm">
            Back to projects
          </Button>
        </div>
      </Stack>
    </Container>
  );
}
