import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { MessagesWorkspace } from "@/components/portal/MessagesWorkspace";
import { portalMessages } from "@/content/portal";

export const metadata: Metadata = {
  title: "Messages",
  description: "Secure messages between you and MAP Holding.",
  robots: { index: false, follow: false },
};

/**
 * /client-portal/messages — the secure communication environment.
 *
 * This is a communication *layout*, not a communication system: there is no
 * composer, no delivery path and no fabricated reply history. The conversations
 * shown are sample fixtures for interface development only.
 */
export default function PortalMessagesPage() {
  return (
    <Container size="portal">
      <Stack gap="xl">
        <PortalPageHeader
          eyebrow="Messages"
          title="Your messages"
          lead="Everything MAP Holding sends you about your applications and projects is kept here."
        />

        <MessagesWorkspace threads={portalMessages} />
      </Stack>
    </Container>
  );
}
