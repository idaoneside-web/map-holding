import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Text } from "@/components/typography/Text";
import { Reveal } from "@/components/motion/Reveal";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { DocumentList } from "@/components/portal/DocumentList";
import { portalDocuments } from "@/content/portal";

export const metadata: Metadata = {
  title: "My Documents",
  description: "Documents released to you in the MAP Holding client environment.",
  robots: { index: false, follow: false },
};

/**
 * /client-portal/documents — the client's documents, grouped by purpose.
 *
 * Only documents explicitly released to the client can appear. Internal MAP
 * Holding reports, assessments, financial information and working notes are
 * structurally unreachable by a client principal and are never rendered here —
 * not even as hidden elements (see `src/lib/access`).
 */
export default function PortalDocumentsPage() {
  return (
    <Container size="portal">
      <Stack gap="xl">
        <PortalPageHeader
          eyebrow="My Documents"
          title="Your documents"
          lead="Grouped by what each document is for. Required items show whether they have been received or are still waiting on you."
        />

        <DocumentList documents={portalDocuments} />

        <Reveal>
          <Text variant="body-s" tone="muted">
            Internal MAP Holding material — reports, assessments and working notes — is never
            published to a client environment. What appears here is limited to documents explicitly
            released to you.
          </Text>
        </Reveal>
      </Stack>
    </Container>
  );
}
