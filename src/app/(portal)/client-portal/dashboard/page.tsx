import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { ImageSlot } from "@/components/media/ImageSlot";
import { Button } from "@/components/controls/Button";
import { Text } from "@/components/typography/Text";
import { Reveal } from "@/components/motion/Reveal";
import { Panel } from "@/components/portal/Panel";
import { AssistantCard } from "@/components/portal/AssistantCard";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { MetricStrip } from "@/components/portal/MetricStrip";
import { ProgressTracker } from "@/components/portal/ProgressTracker";
import { ActivityList } from "@/components/portal/ActivityList";
import {
  portalActivity,
  portalApplications,
  portalNextAction,
  portalProjects,
  portalUser,
} from "@/content/portal";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "MAP Holding client environment dashboard.",
  robots: { index: false, follow: false },
};

/**
 * /client-portal/dashboard — the signed-in client's dashboard.
 *
 * It answers four questions in order: who is signed in, what they hold, what
 * requires attention, and what happens next. Every figure is a sample fixture;
 * nothing here is a real client record.
 */
export default function PortalDashboardPage() {
  const application = portalApplications[0];
  const project = portalProjects[0];

  return (
    <Container size="portal">
      <Stack gap="xl">
        <PortalPageHeader
          eyebrow="Your MAP Holding client environment"
          title={`Welcome back, ${portalUser.firstName}`}
          lead={portalUser.company}
        />

        <Reveal>
          <MetricStrip />
        </Reveal>

        {/* The client's agent, visible on arrival — not just a nav item:
         * continues this browser's open thread with one click. */}
        <Reveal>
          <AssistantCard />
        </Reveal>

        <div className={styles.columns}>
          <Reveal>
            <Panel eyebrow="Current activity" title={project.name} level={2}>
              <div className={styles.project}>
                <div className={styles.visual}>
                  <ImageSlot label={project.imageLabel} ratio="4/3" />
                </div>
                <div className={styles.projectBody}>
                  <Text variant="body-s" tone="muted">
                    Application {application.reference} · {application.status}
                  </Text>
                  <ProgressTracker stages={application.stages} />
                  <div className={styles.actions}>
                    <Button href="/client-portal/applications" variant="outline" size="sm">
                      View application
                    </Button>
                  </div>
                </div>
              </div>
            </Panel>
          </Reveal>

          <Reveal delay={80}>
            <Panel tone="accent" eyebrow="Next action" title={portalNextAction.title} level={2}>
              <div className={styles.next}>
                <Text variant="body" tone="default">
                  {portalNextAction.detail}
                </Text>
                <Button href={portalNextAction.actionHref} variant="primary" size="sm">
                  {portalNextAction.actionLabel}
                </Button>
              </div>
            </Panel>
          </Reveal>
        </div>

        <Reveal>
          <Panel eyebrow="Recent activity" title="What has changed" level={2}>
            <ActivityList entries={portalActivity} />
          </Panel>
        </Reveal>
      </Stack>
    </Container>
  );
}
