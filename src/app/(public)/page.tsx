import { Breadcrumbs, type Crumb } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
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
 * The homepage is the CINEMATIC SCROLL JOURNEY — fifteen approved chapters.
 *
 * One continuous experience: a fixed WebGL2 world (`ScrollStory`) morphs through
 * the chapters as the visitor scrolls. Each chapter below is a full-height
 * editorial station carrying the real MAP Holding copy — no card grid, no
 * invented facts. Scroll drives the world; the copy reveals at the right moment.
 *
 * Scene indexes (must match scroll-story.ts, which morphs across 15 scenes):
 *
 *    0  Opportunity                 8  Partner Coordination
 *    1  Mining & Minerals           9  Licensing & Consultancy
 *    2  Energy & Infrastructure    10  Direct Investment
 *    3  Real Estate & Materials    11  People
 *    4  Technology & Innovation    12  Connected World
 *    5  Industrial Manufacturing   13  MAP Holding Convergence
 *    6  Strategic Development      14  Final MAP M
 *    7  Project Identification
 *
 * VIDEO COVERAGE: chapters 01-07 have their confirmed clip. Chapters 08-15 have
 * no clip yet, so their video slot is deliberately empty — no placeholder, no
 * stand-in, no reuse of unrelated footage. Add the chapter's entry to
 * `VIDEO_BY_SCENE` when its clip is supplied; the chapter then lights up with no
 * structural change.
 */

/** A chapter's cinematic clip. A chapter without one renders no video at all. */
interface ChapterMedia {
  readonly src: string;
  readonly poster: string;
}

/**
 * The confirmed clips, by scene index.
 *
 * Only chapters whose video exists appear here. Every chapter absent from this
 * map falls back to the 3D world alone, which is the intended state until its
 * clip is supplied.
 *
 * The seven unused assets in `/public/video` — `aerial`, `international`,
 * `modern-city`, `modern-video`, `sophisticated-modern`,
 * `sophisticated-international` and `vast-aerial` — are intentionally NOT
 * referenced here. They are legacy/unmatched and are not assigned to any
 * chapter, so the homepage never downloads them.
 */
const VIDEO_BY_SCENE: Readonly<Partial<Record<number, ChapterMedia>>> = {
  0: { src: "/video/home.mp4", poster: "/video/strategic.jpg" },
  1: { src: "/video/mining.mp4", poster: "/video/strategic.jpg" },
  2: { src: "/video/energy.mp4", poster: "/video/strategic.jpg" },
  3: { src: "/video/realestate.mp4", poster: "/video/strategic.jpg" },
  4: { src: "/video/tech.mp4", poster: "/video/strategic.jpg" },
  5: { src: "/video/industrial.mp4", poster: "/video/strategic.jpg" },
  6: { src: "/video/strategic.mp4", poster: "/video/strategic.jpg" },
};

type ChapterKind = "hero" | "chapter" | "identity";

interface Chapter {
  /** 0-based scene index that drives the shader world for this chapter. */
  readonly scene: number;
  readonly title: string;
  readonly kind: ChapterKind;
  /** Approved taxonomy tags — only the business-area chapters carry these. */
  readonly tags?: readonly string[];
  /** Approved body copy. Omitted where MAP Holding has not supplied it yet. */
  readonly body?: string;
}

/**
 * The fifteen chapters, in order.
 *
 * Chapters 02-07 copy is verbatim from the approved business taxonomy.
 * Chapters 08-11 copy is the approved group operating model. Chapters 14-15 use
 * the approved group positioning and identity copy that already ran on this
 * page. Nothing here is invented.
 *
 * Chapters 12 ("People") and 13 ("Connected World") render their approved title
 * and nothing else, because no approved body copy exists for them yet — adding
 * prose would invent a claim about the group.
 */
const CHAPTERS: readonly Chapter[] = [
  { scene: 0, kind: "hero", title: "Opportunity" },
  {
    scene: 1,
    kind: "chapter",
    title: "Mining & Minerals",
    tags: ["Gold", "Lithium", "Basalt"],
    body: "Resource development and commodity exposure through direct projects and strategic partnerships across Africa and beyond.",
  },
  {
    scene: 2,
    kind: "chapter",
    title: "Energy & Infrastructure",
    tags: ["Waste-to-Energy", "Solar", "Renewables"],
    body: "Transition-energy projects and infrastructure development, from waste-to-energy plants to utility-scale solar installations.",
  },
  {
    scene: 3,
    kind: "chapter",
    title: "Real Estate & Materials",
    tags: ["Property", "Cement", "Construction"],
    body: "Real estate investment and building-materials operations, including cement production and downstream construction supply.",
  },
  {
    scene: 4,
    kind: "chapter",
    title: "Technology & Innovation",
    tags: ["AI", "Robotics", "Security"],
    body: "Technology ventures spanning artificial intelligence, autonomous systems, and security and fraud-detection solutions.",
  },
  {
    scene: 5,
    kind: "chapter",
    title: "Industrial Manufacturing",
    tags: ["Oil Machinery", "Merchandising"],
    body: "Specialized manufacturing and industrial supply, including oil-field machinery and traded commodities.",
  },
  {
    scene: 6,
    kind: "chapter",
    title: "Strategic Development",
    tags: ["Consultancy", "Project Structuring", "Investment"],
    body: "Advisory, licensing and business-development services that connect opportunities with the capital and partners needed to execute.",
  },
  {
    scene: 7,
    kind: "chapter",
    title: "Project Identification",
    body: "The group sources and assesses opportunities across its focused sectors, evaluating commercial viability, regulatory fit and partnership potential before advancing.",
  },
  {
    scene: 8,
    kind: "chapter",
    title: "Partner Coordination",
    body: "MAP Holding acts as a convenor — connecting project sponsors with investors, technical partners and regulatory advisors to structure deals that work for all parties.",
  },
  {
    scene: 9,
    kind: "chapter",
    title: "Licensing & Consultancy",
    body: "The group provides licensing, business-development and strategic-advisory services to clients navigating complex multi-jurisdictional opportunities.",
  },
  {
    scene: 10,
    kind: "chapter",
    title: "Direct Investment",
    body: "In select cases the group takes equity or operating positions in projects where its sector expertise and partner network create decisive advantage.",
  },
  /* No approved body copy exists for these two yet — title only. */
  { scene: 11, kind: "chapter", title: "People" },
  { scene: 12, kind: "chapter", title: "Connected World" },
  {
    scene: 13,
    kind: "chapter",
    title: "MAP Holding Convergence",
    body: "Across mining and minerals, energy and infrastructure, real estate and materials, technology and innovation, industrial manufacturing and strategic development — MAP Holding connects the opportunity with the partners and capital needed to execute.",
  },
  {
    scene: 14,
    kind: "identity",
    title: "Final MAP M",
    body: "Finds opportunities. Structures them. Connects people, resources, expertise and capital. Develops selected opportunities. Invests where appropriate.",
  },
];

export default function HomePage() {
  const crumbs: readonly Crumb[] = [{ label: "Home" }];

  return (
    <>
      {/* The single fixed 3D world behind every chapter. */}
      <ScrollStory />

      <div className={styles.journey}>
        {CHAPTERS.map((chapter) => {
          const number = String(chapter.scene + 1).padStart(2, "0");
          const media = VIDEO_BY_SCENE[chapter.scene];

          return (
            <section
              key={chapter.scene}
              className={styles.beat}
              data-scene={chapter.scene}
              data-chapter={number}
            >
              {/* No clip for this chapter yet: the 3D world carries it alone. */}
              {media ? <VideoScene src={media.src} poster={media.poster} /> : null}
              <span className={styles.scrim} aria-hidden="true" />
              <Container className={styles.beatInner}>
                {chapter.kind === "hero" ? (
                  <Stack gap="lg" align="start">
                    <Breadcrumbs items={crumbs} />
                    <div className={styles.textBlock}>
                      <p className={styles.statement}>{BRAND_STATEMENT_UPPER}</p>
                      <Heading level={1} variant="display-xl" tone="strong">
                        MAP Holding
                      </Heading>
                      <Text variant="body-l" tone="default" className={styles.lead}>
                        A diversified holding platform connecting projects, opportunities,
                        resources, partners and investors across strategic sectors including mining,
                        energy, real estate, technology and materials.
                      </Text>
                    </div>
                    <div className={styles.actions}>
                      <Button href="/business-areas" variant="primary" size="lg">
                        Business Areas
                      </Button>
                      <Button href="/about" variant="outline" size="lg">
                        About the group
                      </Button>
                      <Button href="/client-portal" variant="outline" size="lg">
                        Client Login
                      </Button>
                    </div>
                    <Text variant="body-s" tone="muted" className={styles.hint}>
                      Scroll to travel the story
                    </Text>
                  </Stack>
                ) : (
                  <Reveal className={styles.textBlock}>
                    <p className={styles.eyebrow}>
                      Chapter {number} — {chapter.title}
                    </p>
                    <Heading level={2} variant="display-l" tone="strong">
                      {chapter.title}
                    </Heading>
                    {chapter.tags ? (
                      <div className={styles.tags}>
                        {chapter.tags.map((t) => (
                          <Tag key={t} className={styles.tag}>
                            {t}
                          </Tag>
                        ))}
                      </div>
                    ) : null}
                    {chapter.body ? (
                      <Text variant="body-l" tone="default" className={styles.lead}>
                        {chapter.body}
                      </Text>
                    ) : null}
                    {chapter.kind === "identity" ? (
                      <>
                        <p className={styles.statement}>{BRAND_STATEMENT_UPPER}</p>
                        <div className={styles.actions}>
                          <Button href="/client-portal" variant="primary" size="lg">
                            Secure Client Login
                          </Button>
                          <Button href="/about" variant="outline" size="lg">
                            Explore the group
                          </Button>
                        </div>
                      </>
                    ) : null}
                  </Reveal>
                )}
              </Container>
            </section>
          );
        })}
      </div>
    </>
  );
}
