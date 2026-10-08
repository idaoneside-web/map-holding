import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { MessagesWorkspace } from "@/components/portal/MessagesWorkspace";
import { getPortalThread, portalMessages } from "@/content/portal";

/** Only the sample conversations exist; anything else is a genuine 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return portalMessages.map((thread) => ({ thread: thread.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ thread: string }>;
}): Promise<Metadata> {
  const { thread } = await params;
  const found = getPortalThread(thread);
  return {
    title: found ? found.subject : "Message",
    robots: { index: false, follow: false },
  };
}

/**
 * /client-portal/messages/[thread] — one conversation, open.
 *
 * The thread id is resolved from the sample fixtures; an unknown id is a 404
 * rather than an empty page.
 */
export default async function PortalMessagePage({
  params,
}: {
  params: Promise<{ thread: string }>;
}) {
  const { thread } = await params;
  const found = getPortalThread(thread);
  if (!found) notFound();

  return (
    <Container size="portal">
      <Stack gap="xl">
        <PortalPageHeader eyebrow="Messages" title={found.subject} />
        <MessagesWorkspace threads={portalMessages} activeId={found.id} />
      </Stack>
    </Container>
  );
}
