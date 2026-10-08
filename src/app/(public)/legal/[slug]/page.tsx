import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Stack } from "@/components/layout/Stack";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Breadcrumbs, type Crumb } from "@/components/layout/Breadcrumbs";
import { ContentPlaceholder } from "@/components/feedback/ContentPlaceholder";
import { Text } from "@/components/typography/Text";
import { legalSlugs, type LegalSlug } from "@/content/navigation";

/** Document titles for the legal template. Presentation only — no claims. */
const LEGAL_TITLES: Record<LegalSlug, string> = {
  privacy: "Privacy Notice",
  terms: "Terms of Use",
  cookies: "Cookie Notice",
};

/** What each document must cover. This is a brief for counsel, not the text. */
const LEGAL_REQUIREMENTS: Record<LegalSlug, readonly string[]> = {
  privacy: [
    "Controller identity and legal entity details",
    "Categories of personal data processed",
    "Lawful bases and retention periods",
    "Data subject rights and how to exercise them",
    "International transfer position",
    "Contact route for privacy requests",
  ],
  terms: [
    "Legal entity and jurisdiction",
    "Acceptable use and permitted access",
    "Intellectual property position, including the brand assets",
    "Disclaimers and limitation of liability",
    "Governing law and dispute resolution",
  ],
  cookies: [
    "Categories of cookies and similar technologies used",
    "Purpose and duration of each",
    "Consent mechanism and how to withdraw it",
    "Third parties involved, if any",
  ],
};

export function generateStaticParams() {
  return legalSlugs.map((slug) => ({ slug }));
}

/** Only the three registered documents exist; anything else is a 404. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isLegalSlug(slug)) return {};
  return {
    title: LEGAL_TITLES[slug],
    description: `${LEGAL_TITLES[slug]} placeholder — content to be supplied by MAP Holding.`,
  };
}

function isLegalSlug(value: string): value is LegalSlug {
  return (legalSlugs as readonly string[]).includes(value);
}

/**
 * /legal/[slug] — the controlled legal placeholder (Phase 3 §1).
 *
 * No legal text is written here. Inventing a privacy notice, terms of use or
 * cookie policy would be a fabricated legal claim, so this route states exactly
 * which documents must exist and what each must cover, and nothing more.
 */
export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isLegalSlug(slug)) notFound();

  const crumbs: readonly Crumb[] = [{ label: "Home", href: "/" }, { label: LEGAL_TITLES[slug] }];

  return (
    <Section tone="default" spacing="lg">
      <Container size="narrow">
        <Stack gap="lg">
          <Breadcrumbs items={crumbs} />
          <SectionHeader
            level={1}
            eyebrow="Legal"
            title={LEGAL_TITLES[slug]}
            lead="This document does not exist yet. It must be drafted or approved by MAP Holding's legal advisers — this project does not invent legal text."
          />

          <ContentPlaceholder
            variant="panel"
            label={`${LEGAL_TITLES[slug]} must cover`}
            detail="Structure reserved so the document can be dropped in without re-laying out the page."
            items={LEGAL_REQUIREMENTS[slug]}
          />

          <Text variant="body-s" tone="muted">
            Until this document is supplied, the route deliberately publishes nothing beyond this
            notice. A placeholder is honest; plausible-sounding terms would not be.
          </Text>
        </Stack>
      </Container>
    </Section>
  );
}
