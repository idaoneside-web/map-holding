import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { Text } from "@/components/typography/Text";
import { Reveal } from "@/components/motion/Reveal";
import { Panel } from "@/components/portal/Panel";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { ProgressTracker } from "@/components/portal/ProgressTracker";
import { portalApplications } from "@/content/portal";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "My Applications",
  description: "Your applications and where each one has reached.",
  robots: { index: false, follow: false },
};

/**
 * /client-portal/applications — the guided application process.
 *
 * Presented as a process rather than a table: each application shows the same
 * four stages, so the client can read at a glance what is done, what is
 * happening now and what happens next.
 */
export default function PortalApplicationsPage() {
  return (
    <Container size="portal">
      <Stack gap="xl">
        <PortalPageHeader
          eyebrow="My Applications"
          title="Your applications"
          lead="Every application moves through the same four stages. This shows where each one has reached and what, if anything, is waiting on you."
        />

        {portalApplications.map((application, index) => (
          <Reveal key={application.id} delay={index * 80}>
            <Panel
              eyebrow="Application"
              title={`${application.reference} — ${application.subject}`}
              level={2}
              action={<StatusBadge tone="warning">{application.status}</StatusBadge>}
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
        ))}
      </Stack>
    </Container>
  );
}
