import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Stack } from "@/components/layout/Stack";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Breadcrumbs, type Crumb } from "@/components/layout/Breadcrumbs";
import { Grid } from "@/components/layout/Grid";
import { Heading, Text } from "@/components/typography/Text";
import { ContentPlaceholder } from "@/components/feedback/ContentPlaceholder";
import { ImageSlot } from "@/components/media/ImageSlot";
import type { PageScaffoldDefinition } from "@/content/pages";
import styles from "./PageScaffold.module.css";

export interface PageScaffoldProps {
  page: PageScaffoldDefinition;
}

/**
 * PageScaffold — the controlled placeholder structure shared by every public
 * page in Phase 3 (Phase 3 §6).
 *
 * Why one shared component: it guarantees the six routes exercise the *same*
 * shell, the same type scale, the same section rhythm, the same imagery slots
 * and the same heading outline, so this phase genuinely proves the structure
 * rather than six hand-written approximations of it.
 *
 * It renders no fabricated business content. Each section states what it will
 * hold, and lists the named content MAP Holding still has to supply.
 */
export function PageScaffold({ page }: PageScaffoldProps) {
  const crumbs: readonly Crumb[] = [{ label: "Home", href: "/" }, { label: page.title }];

  return (
    <>
      <Section tone="navy" spacing="md" as="div">
        <Container>
          <Stack gap="md">
            <Breadcrumbs items={crumbs} />
            <SectionHeader level={1} eyebrow={page.eyebrow} title={page.title} lead={page.intro} />
          </Stack>
        </Container>
      </Section>

      {page.sections.map((section, index) => (
        <Section
          key={section.heading}
          id={toId(section.heading)}
          tone={index % 2 === 1 ? "subtle" : "default"}
          spacing="lg"
        >
          <Container>
            <Stack gap="lg">
              <SectionHeader level={2} title={section.heading} lead={section.note} />

              {section.imageSlots && section.imageSlots.length > 0 ? (
                <Grid min="16rem" gap="md">
                  {section.imageSlots.map((slot, slotIndex) => (
                    <ImageSlot
                      key={`${slot.label}-${slotIndex}`}
                      label={slot.label}
                      ratio={slot.ratio}
                    />
                  ))}
                </Grid>
              ) : null}

              {section.emptyState ? (
                <EmptyBlock
                  title={section.emptyState.title}
                  body={section.emptyState.body}
                  placeholders={section.placeholders}
                />
              ) : (
                <ContentPlaceholder
                  variant="panel"
                  label={`Content required for “${section.heading}”`}
                  items={section.placeholders}
                />
              )}
            </Stack>
          </Container>
        </Section>
      ))}

      <Section tone="navy" spacing="md">
        <Container>
          <Stack gap="md" align="start">
            <Heading level={2} className={styles.nextTitle}>
              Where this goes next
            </Heading>
            <Text variant="body" tone="default" className={styles.nextBody}>
              This page is structural scaffolding. Editorial content, real imagery and the
              interactive elements arrive in later phases, behind the same shell you are looking at
              now.
            </Text>
            <div className={styles.nextActions}>
              <Link className={styles.nextLink} href="/">
                Return to the home route
              </Link>
            </div>
          </Stack>
        </Container>
      </Section>
    </>
  );
}

/** Renders the section as an `EmptyState` plus the named outstanding content. */
function EmptyBlock({
  title,
  body,
  placeholders,
}: {
  title: string;
  body: string;
  placeholders: readonly string[];
}) {
  return (
    <div className={styles.emptyWrap}>
      <div className={styles.emptyState}>
        <Heading level={3} className={styles.emptyTitle}>
          {title}
        </Heading>
        <Text variant="body" tone="default" className={styles.emptyBody}>
          {body}
        </Text>
      </div>
      <ContentPlaceholder
        variant="panel"
        label="Content required"
        items={placeholders}
        detail="Listed so nothing has to be invented to make this page look finished."
      />
    </div>
  );
}

/** Stable, readable anchor ids for section landmarks. */
function toId(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
