import type { Metadata } from "next";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Grid } from "@/components/layout/Grid";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Breadcrumbs, type Crumb } from "@/components/layout/Breadcrumbs";
import { Heading, Text } from "@/components/typography/Text";
import { Badge } from "@/components/feedback/Badge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ImageSlot } from "@/components/media/ImageSlot";
import styles from "./page.module.css";

/**
 * MAP HOLDING — PUBLIC GALLERY (placeholder structure only).
 *
 * This page is a reserved structure: every frame is an empty labelled
 * `ImageSlot` (or `EmptyState`). No media is generated, sourced or embedded
 * here. The owner supplies the actual photographs and videos; each one
 * replaces its slot without any layout change (fixed aspect ratios).
 *
 * Counts and slot labels are structural data — they are not claims about the
 * business, and nothing on this page is indexed content beyond its honest
 * statement that the gallery is awaiting real media.
 */

/** Reserved frame counts. Structural data only — no media of any kind. */
const PHOTO_SLOTS = 6;
const VIDEO_SLOTS = 3;

function pad(index: number): string {
  return String(index).padStart(2, "0");
}

export const metadata: Metadata = {
  title: "Gallery — MAP Holding",
  description:
    "The MAP Holding gallery — reserved frames for photographs and videos. No media is published until it is supplied by MAP Holding.",
};

export default function GalleryPage() {
  const crumbs: readonly Crumb[] = [{ label: "Home", href: "/" }, { label: "Gallery" }];
  return (
    <>
      <Section tone="navy-deep" spacing="none" as="div">
        <Container className={styles.heroInner}>
          <Stack gap="md" align="start">
            <Breadcrumbs items={crumbs} />
            <Badge tone="brand">Media</Badge>
            <Heading level={1} variant="display-l" tone="strong">
              Gallery
            </Heading>
            <Text variant="body-l" tone="default" className={styles.lead}>
              Reserved space for the group&apos;s photographs and videos. Every frame below is an
              empty placeholder — real media will appear here as it is supplied by MAP Holding.
            </Text>
          </Stack>
        </Container>
      </Section>

      <Section tone="default" spacing="lg">
        <Container>
          <Stack gap="lg">
            <SectionHeader
              eyebrow="Photographs"
              title="Photograph gallery"
              lead="Each frame is reserved at a fixed 4/3 aspect ratio so that when a real photograph is added, the layout never shifts."
            />
            <Grid min="16rem" gap="md">
              {Array.from({ length: PHOTO_SLOTS }, (_, i) => (
                <div key={i} className={styles.mediaCard}>
                  <ImageSlot
                    label={`Photograph — reserved slot ${pad(i + 1)}`}
                    ratio="4/3"
                    className={styles.mediaFrame}
                  />
                </div>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Section>

      <Section tone="subtle" spacing="lg">
        <Container>
          <Stack gap="lg">
            <SectionHeader
              eyebrow="Video"
              title="Video gallery"
              lead="Reserved 16/9 frames for group film. Nothing is embedded until real video is supplied."
            />
            <Grid min="20rem" gap="md">
              {Array.from({ length: VIDEO_SLOTS }, (_, i) => (
                <div key={i} className={styles.mediaCard}>
                  <ImageSlot
                    label={`Video — reserved frame ${pad(i + 1)}`}
                    ratio="16/9"
                    className={styles.mediaFrame}
                  />
                </div>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Section>

      <Section tone="navy-deep" spacing="lg">
        <Container>
          <EmptyState
            title="No media published yet"
            body="No stock photographs or videos are used anywhere on this page. Frames remain labelled placeholders until real media is supplied by MAP Holding — the moment it arrives, it replaces its slot with no structural change."
          />
        </Container>
      </Section>
    </>
  );
}
