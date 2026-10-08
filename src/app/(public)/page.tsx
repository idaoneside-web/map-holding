import { Breadcrumbs, type Crumb } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { Grid } from "@/components/layout/Grid";
import { Stack } from "@/components/layout/Stack";
import { Heading, Text } from "@/components/typography/Text";
import { Button } from "@/components/controls/Button";
import { Tag } from "@/components/feedback/Badge";
import { ScrollStory } from "@/components/media/ScrollStory";
import { VideoScene } from "@/components/media/VideoScene";
import { Reveal } from "@/components/motion/Reveal";
import { BRAND_STATEMENT_UPPER } from "@/content/navigation";
import styles from "./home.module.css";

/**
 * The homepage is the CINEMATIC SCROLL JOURNEY.
 *
 * One continuous experience: a fixed WebGL2 world (`ScrollStory`) morphs through
 * nine business beats as the visitor scrolls. Each beat below is a full-height
 * editorial station with the real MAP Holding copy — no card grid, no invented
 * facts. Scroll drives the world; the copy reveals at the right moment.
 *
 * Scene indexes (must match scroll-story.ts): 0 Opportunity · 1 Mining ·
 * 2 Energy · 3 Real Estate · 4 Technology · 5 Industrial · 6 Strategic ·
 * 7 Operations · 8 MAP Holding.
 */

interface Beat {
  readonly scene: number;
  readonly eyebrow: string;
  readonly title: string;
  readonly tags: readonly string[];
  readonly body: string;
}

/** Business beats 1-6 — copy verbatim from the approved business taxonomy. */
const BEATS: readonly Beat[] = [
  {
    scene: 1,
    eyebrow: "Chapter 02 — Mining & Minerals",
    title: "Mining & Minerals",
    tags: ["Gold", "Lithium", "Basalt"],
    body: "Resource development and commodity exposure through direct projects and strategic partnerships across Africa and beyond.",
  },
  {
    scene: 2,
    eyebrow: "Chapter 03 — Energy & Infrastructure",
    title: "Energy & Infrastructure",
    tags: ["Waste-to-Energy", "Solar", "Renewables"],
    body: "Transition-energy projects and infrastructure development, from waste-to-energy plants to utility-scale solar installations.",
  },
  {
    scene: 3,
    eyebrow: "Chapter 04 — Real Estate & Materials",
    title: "Real Estate & Materials",
    tags: ["Property", "Cement", "Construction"],
    body: "Real estate investment and building-materials operations, including cement production and downstream construction supply.",
  },
  {
    scene: 4,
    eyebrow: "Chapter 05 — Technology & Innovation",
    title: "Technology & Innovation",
    tags: ["AI", "Robotics", "Security"],
    body: "Technology ventures spanning artificial intelligence, autonomous systems, and security and fraud-detection solutions.",
  },
  {
    scene: 5,
    eyebrow: "Chapter 06 — Industrial Manufacturing",
    title: "Industrial Manufacturing",
    tags: ["Oil Machinery", "Merchandising"],
    body: "Specialized manufacturing and industrial supply, including oil-field machinery and traded commodities.",
  },
  {
    scene: 6,
    eyebrow: "Chapter 07 — Strategic Development",
    title: "Strategic Development",
    tags: ["Consultancy", "Project Structuring", "Investment"],
    body: "Advisory, licensing and business-development services that connect opportunities with the capital and partners needed to execute.",
  },
];

/** The cinematic videos for each beat — your Video_Studio clips. */
const VIDEO_BY_SCENE: Record<number, { src: string; poster: string }> = {
  0: { src: "/video/home.mp4", poster: "/video/strategic.jpg" },
  1: { src: "/video/mining.mp4", poster: "/video/strategic.jpg" },
  2: { src: "/video/energy.mp4", poster: "/video/strategic.jpg" },
  3: { src: "/video/realestate.mp4", poster: "/video/strategic.jpg" },
  4: { src: "/video/tech.mp4", poster: "/video/strategic.jpg" },
  5: { src: "/video/industrial.mp4", poster: "/video/strategic.jpg" },
  6: { src: "/video/strategic.mp4", poster: "/video/strategic.jpg" },
};

/** The four core ways MAP Holding works — copy verbatim from the group's model. */
const OPERATIONS = [
  { title: "Project identification", body: "The group sources and assesses opportunities across its focused sectors, evaluating commercial viability, regulatory fit and partnership potential before advancing." },
  { title: "Partner coordination", body: "MAP Holding acts as a convenor — connecting project sponsors with investors, technical partners and regulatory advisors to structure deals that work for all parties." },
  { title: "Licensing & consultancy", body: "The group provides licensing, business-development and strategic-advisory services to clients navigating complex multi-jurisdictional opportunities." },
  { title: "Direct investment", body: "In select cases the group takes equity or operating positions in projects where its sector expertise and partner network create decisive advantage." },
];

export default function HomePage() {
  const crumbs: readonly Crumb[] = [{ label: "Home" }];

  return (
    <>
      {/* The single fixed 3D world behind every beat. */}
      <ScrollStory />

      <div className={styles.journey}>
        {/* 01 · OPPORTUNITY — the journey begins. */}
        <section className={styles.beat} data-scene="0">
          {VIDEO_BY_SCENE[0] && <VideoScene src={VIDEO_BY_SCENE[0].src} poster={VIDEO_BY_SCENE[0].poster} />}
          <span className={styles.scrim} aria-hidden="true" />
          <Container className={styles.beatInner}>
            <Stack gap="lg" align="start">
              <Breadcrumbs items={crumbs} />
              <div className={styles.textBlock}>
                <p className={styles.statement}>{BRAND_STATEMENT_UPPER}</p>
                <Heading level={1} variant="display-xl" tone="strong">
                  MAP Holding
                </Heading>
                <Text variant="body-l" tone="default" className={styles.lead}>
                  A diversified holding platform connecting projects, opportunities, resources, partners and investors across strategic sectors including mining, energy, real estate, technology and materials.
                </Text>
              </div>
              <div className={styles.actions}>
                <Button href="/business-areas" variant="primary" size="lg">Business Areas</Button>
                <Button href="/about" variant="outline" size="lg">About the group</Button>
                <Button href="/client-portal" variant="outline" size="lg">Client Login</Button>
              </div>
              <Text variant="body-s" tone="muted" className={styles.hint}>Scroll to travel the story</Text>
            </Stack>
          </Container>
        </section>

        {/* 02-07 · BUSINESS AREAS — one full-height beat each. */}
        {BEATS.map((beat) => {
          const media = VIDEO_BY_SCENE[beat.scene];
          return (
            <section key={beat.scene} className={styles.beat} data-scene={beat.scene}>
              {media && <VideoScene src={media.src} poster={media.poster} />}
              <span className={styles.scrim} aria-hidden="true" />
              <Container className={styles.beatInner}>
                <Reveal className={styles.textBlock}>
                  <p className={styles.eyebrow}>{beat.eyebrow}</p>
                  <Heading level={2} variant="display-l" tone="strong">
                    {beat.title}
                  </Heading>
                  <div className={styles.tags}>
                    {beat.tags.map((t) => (
                      <Tag key={t} className={styles.tag}>{t}</Tag>
                    ))}
                  </div>
                  <Text variant="body-l" tone="default" className={styles.lead}>
                    {beat.body}
                  </Text>
                </Reveal>
              </Container>
            </section>
          );
        })}

        {/* 08 · OPERATIONS — the four ways the group works. */}
        <section className={styles.beat} data-scene="7">
          <span className={styles.scrim} aria-hidden="true" />
          <Container className={styles.beatInner}>
            <Stack gap="lg">
              <Reveal className={styles.textBlock}>
                <p className={styles.eyebrow}>Chapter 08 — How MAP Holding operates</p>
                <Heading level={2} variant="display-l" tone="strong">
                  How MAP Holding operates
                </Heading>
                <Text variant="body-l" tone="default" className={styles.lead}>
                  MAP Holding is not one industry. The group connects opportunities across sectors through four core ways of working.
                </Text>
              </Reveal>
              <Grid min="20rem" gap="md">
                {OPERATIONS.map((op, i) => (
                  <Reveal key={op.title} delay={(i % 2) * 80}>
                    <div className={styles.opCard}>
                      <Heading level={3} className={styles.opTitle}>{op.title}</Heading>
                      <Text variant="body" tone="default">{op.body}</Text>
                    </div>
                  </Reveal>
                ))}
              </Grid>
            </Stack>
          </Container>
        </section>

        {/* 09 · MAP HOLDING — the journey resolves into the identity. */}
        <section className={styles.beat} data-scene="8">
          <span className={styles.scrim} aria-hidden="true" />
          <Container className={styles.beatInner}>
            <Reveal className={styles.textBlock}>
              <p className={styles.statement}>{BRAND_STATEMENT_UPPER}</p>
              <Heading level={2} variant="display-l" tone="strong">
                Finds opportunities. Structures them. Connects people, resources, expertise and capital. Develops selected opportunities. Invests where appropriate.
              </Heading>
              <Text variant="body-l" tone="default" className={styles.lead}>
                Across mining and minerals, energy and infrastructure, real estate and materials, technology and innovation, industrial manufacturing and strategic development — MAP Holding connects the opportunity with the partners and capital needed to execute.
              </Text>
              <div className={styles.actions}>
                <Button href="/client-portal" variant="primary" size="lg">Secure Client Login</Button>
                <Button href="/about" variant="outline" size="lg">Explore the group</Button>
              </div>
            </Reveal>
          </Container>
        </section>
      </div>
    </>
  );
}
