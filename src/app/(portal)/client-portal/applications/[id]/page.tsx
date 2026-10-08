import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Button } from "@/components/controls/Button";
import { Badge } from "@/components/feedback/Badge";
import { StatusBadge, type StatusTone } from "@/components/feedback/StatusBadge";
import { Heading, Text } from "@/components/typography/Text";
import { Reveal } from "@/components/motion/Reveal";
import { Panel } from "@/components/portal/Panel";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { ProgressTracker } from "@/components/portal/ProgressTracker";
import { portalApplications, type PortalApplication } from "@/content/portal";
import styles from "./page.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return portalApplications.map((a) => ({ id: a.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const found = portalApplications.find((a) => a.id === id);
  return {
    title: found ? `${found.reference} — ${found.subject}` : "Application",
    robots: { index: false, follow: false },
  };
}

const STATUS_TONE: Record<string, StatusTone> = {
  "Under review": "warning",
  "Submitted": "info",
  "Approved": "success",
  "Rejected": "danger",
  pending: "pending",
};

export default async function PortalApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = portalApplications.find((a) => a.id === id);
  if (!application) notFound();

  return (
    <Container size="portal">
      <Stack gap="xl">
        <PortalPageHeader
          eyebrow="Application details"
          title={`${application.reference} — ${application.subject}`}
          lead={`Status: ${application.status}`}
        />

        <Reveal>
          <Panel
            eyebrow="Application"
            title={`${application.reference} — ${application.subject}`}
            level={2}
            action={<StatusBadge tone={STATUS_TONE[application.status] ?? "neutral"}>{application.status}</StatusBadge>}
          >
            <div className={styles.application}>
              <Text variant="body-s" tone="muted" className={styles.meta}>
                Submitted: {application.submittedOn}
              </Text>
              <ProgressTracker stages={application.stages} />
              <p className={styles.note}>
                Stage detail, correspondence and the decision itself are released here as the
                application progresses. Nothing is shown to you before it is decided upon.
              </p>
            </div>
          </Panel>
        </Reveal>

        <Reveal>
          <Panel title="Related documents" level={2}>
            <Text variant="body-s" tone="muted">
              Documents related to this application are available in the{" "}
              <Button href="/client-portal/documents" variant="link" size="sm">
                Documents
              </Button>{" "}
              area. Required documents show whether they have been received or are still waiting on
              you.
            </Text>
          </Panel>
        </Reveal>

        <Reveal>
          <Panel title="What this means" level={2}>
            <Text variant="body-s" tone="muted">
              {application.status === "Under review"
                ? "Your application is currently being reviewed by the MAP Holding team. We will notify you here when a decision has been made."
                : application.status === "Submitted"
                ? "Your application has been received and is awaiting initial processing."
                : application.status === "Approved"
                ? "Your application has been approved. Next steps will be communicated through this environment."
                : "Please contact MAP Holding if you have questions about this application status."}
            </Text>
          </Panel>
        </Reveal>

        <div className={styles.back}>
          <Button href="/client-portal/applications" variant="outline" size="sm">
            Back to applications
          </Button>
        </div>
      </Stack>
    </Container>
  );
}
