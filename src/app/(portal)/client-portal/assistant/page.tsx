import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Text } from "@/components/typography/Text";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { ClientAssistantPanel } from "@/components/agent/ClientAssistant";

export const metadata: Metadata = {
  title: "Assistant",
  description: "Your private advisory assistant in the MAP Holding client environment.",
  robots: { index: false, follow: false },
};

/**
 * /client-portal/assistant — the client's private advisory assistant.
 *
 * A DISTINCT experience from the owners' Business Agent: it speaks only to
 * the worker's `/client-agent/*` boundary (the CLIENTS roster, a client-
 * scoped prompt, no internal data), keeps conversations in its own storage
 * key, and renders nothing that is not a genuine service response. While
 * the service is unconfigured it says exactly that and makes no calls.
 */
export default function PortalAssistantPage() {
  return (
    <Container size="portal">
      <Stack gap="xl">
        <PortalPageHeader
          eyebrow="Your Assistant"
          title="Private assistant"
          lead="Advisory help for your client environment: how things work, what terms mean, and how to request information."
        />

        <ClientAssistantPanel />

        <Text variant="body-s" tone="muted">
          This assistant is scoped to your account. It does not read your records or perform any
          actions, and it has no access to internal or company projects, documents or data.
        </Text>
      </Stack>
    </Container>
  );
}
