import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ContrastPair } from "@/components/brand/ContrastPair";
import { Logo } from "@/components/brand/Logo";
import { TokenSwatch } from "@/components/brand/TokenSwatch";
import { Button } from "@/components/controls/Button";
import { Link } from "@/components/controls/Link";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { Container } from "@/components/layout/Container";
import { Divider, Rule } from "@/components/layout/Divider";
import { GradientSurface } from "@/components/layout/GradientSurface";
import { Section } from "@/components/layout/Section";
import { MotionLab } from "@/components/motion/MotionLab";
import { Eyebrow, Heading, Text, type TextVariant } from "@/components/typography/Text";
import { logoAssets, type LogoVariant } from "@/lib/brand";

import styles from "./gallery.module.css";

export const metadata: Metadata = {
  title: "Brand Foundation — Validation Gallery",
  description:
    "Internal MAP Holding foundation check: logo system, tokens, type, states and motion.",
  /* This surface is internal tooling. It must never be indexed, and it now sits
     outside the public shell, so it declares its own robots policy rather than
     inheriting the public one (Phase 1 §M). */
  robots: { index: false, follow: false },
};

/* ---------------------------------------------------------------- data ---- */

interface SwatchSpec {
  token: string;
  label: string;
}

const brandRamps: ReadonlyArray<{ title: string; note: string; swatches: readonly SwatchSpec[] }> =
  [
    {
      title: "MAP Gold — ribbon amber",
      note: "Sampled from the warm lobes of the ribbon-M across all three board lockups.",
      swatches: [
        { token: "--color-brand-gold-300", label: "gold-300 · ribbon highlight" },
        { token: "--color-brand-gold-400", label: "gold-400 · ribbon upper lobe" },
        { token: "--color-brand-gold-500", label: "gold-500 · MAP Gold (primary)" },
        { token: "--color-brand-gold-600", label: "gold-600 · ribbon shadow" },
        { token: "--color-brand-gold-700", label: "gold-700 · ribbon deepest" },
      ],
    },
    {
      title: "MAP metallic gold — wordmark & gold app tile",
      note: "The champagne gold of the wordmark and the gold icon tile. Distinct from the ribbon amber.",
      swatches: [
        { token: "--color-brand-metal-300", label: "metal-300 · wordmark median" },
        { token: "--color-brand-metal-500", label: "metal-500 · gold tile median" },
        { token: "--color-brand-metal-700", label: "metal-700 · tile / wordmark dark" },
      ],
    },
    {
      title: "MAP Blue — ribbon centre",
      note: "Sampled across the blue mid-section of the ribbon in each lockup.",
      swatches: [
        { token: "--color-brand-blue-300", label: "blue-300 · light step" },
        { token: "--color-brand-blue-400", label: "blue-400 · ribbon bright (links, focus)" },
        { token: "--color-brand-blue-500", label: "blue-500 · MAP Blue (primary)" },
        { token: "--color-brand-blue-600", label: "blue-600 · ribbon shadow" },
        { token: "--color-brand-blue-700", label: "blue-700 · ribbon deepest" },
      ],
    },
    {
      title: "MAP Teal — ribbon right",
      note: "Sampled from the cyan-to-teal descent on the right of the ribbon.",
      swatches: [
        { token: "--color-brand-teal-300", label: "teal-300 · light step" },
        { token: "--color-brand-teal-400", label: "teal-400 · ribbon teal tip" },
        { token: "--color-brand-teal-500", label: "teal-500 · MAP Teal (success)" },
        { token: "--color-brand-teal-700", label: "teal-700 · deep / text on ivory" },
      ],
    },
    {
      title: "Grounds",
      note: "MAP Navy and the board's near-white light ground, plus the sampled wordmark ink.",
      swatches: [
        { token: "--color-brand-navy-950", label: "navy-950 · deepest ground" },
        { token: "--color-brand-navy-900", label: "navy-900 · MAP Navy (primary)" },
        { token: "--color-brand-navy-800", label: "navy-800 · navy surface" },
        { token: "--color-brand-ivory-50", label: "ivory-50 · light ground" },
        { token: "--color-brand-ivory-100", label: "ivory-100 · ivory shade" },
        { token: "--color-brand-ink-900", label: "ink-900 · wordmark ink" },
      ],
    },
  ];

const neutralRamp: readonly SwatchSpec[] = [
  { token: "--color-neutral-0", label: "neutral-0" },
  { token: "--color-neutral-100", label: "neutral-100" },
  { token: "--color-neutral-300", label: "neutral-300" },
  { token: "--color-neutral-500", label: "neutral-500" },
  { token: "--color-neutral-700", label: "neutral-700" },
  { token: "--color-neutral-850", label: "neutral-850" },
  { token: "--color-neutral-900", label: "neutral-900" },
];

const semanticTokens: readonly SwatchSpec[] = [
  { token: "--color-semantic-success", label: "success · MAP Teal" },
  { token: "--color-semantic-warning", label: "warning · MAP Gold" },
  { token: "--color-semantic-danger", label: "danger · functional red" },
  { token: "--color-semantic-info", label: "info · ribbon blue" },
  { token: "--color-semantic-pending", label: "pending · MAP Gold" },
];

const gradients: readonly SwatchSpec[] = [
  { token: "--gradient-brand", label: "grad-brand · gold → blue → teal" },
  { token: "--gradient-warm", label: "grad-warm · gold-300 → gold-500" },
  { token: "--gradient-cool", label: "grad-cool · blue-500 → teal-500" },
  { token: "--gradient-navy", label: "grad-navy · navy-900 → navy-950" },
  { token: "--gradient-ivory", label: "grad-ivory · ivory-50 → ivory-100" },
];

const typeSpecimens: ReadonlyArray<{
  variant: TextVariant;
  sample: string;
  usage: string;
  sizeToken: string;
  weight: number;
  lineHeight: string;
  tracking: string;
}> = [
  {
    variant: "display-xl",
    sample: "People. Resources. Opportunity.",
    usage: "Hero",
    sizeToken: "--font-size-display-xl",
    weight: 600,
    lineHeight: "1.05",
    tracking: "-0.02em",
  },
  {
    variant: "display-l",
    sample: "A diversified global holding group",
    usage: "Section opener",
    sizeToken: "--font-size-display-l",
    weight: 600,
    lineHeight: "1.08",
    tracking: "-0.02em",
  },
  {
    variant: "h1",
    sample: "Business Areas",
    usage: "Page title",
    sizeToken: "--font-size-h1",
    weight: 600,
    lineHeight: "1.10",
    tracking: "-0.015em",
  },
  {
    variant: "h2",
    sample: "Gold and Mining",
    usage: "Section heading",
    sizeToken: "--font-size-h2",
    weight: 600,
    lineHeight: "1.15",
    tracking: "-0.010em",
  },
  {
    variant: "h3",
    sample: "Real Estate Development",
    usage: "Card title",
    sizeToken: "--font-size-h3",
    weight: 600,
    lineHeight: "1.20",
    tracking: "-0.005em",
  },
  {
    variant: "h4",
    sample: "International Solar / PV",
    usage: "Sub-card title",
    sizeToken: "--font-size-h4",
    weight: 600,
    lineHeight: "1.25",
    tracking: "0",
  },
  {
    variant: "body-l",
    sample:
      "A holding group built on people, resources and opportunity across international markets.",
    usage: "Lead paragraph",
    sizeToken: "--font-size-body-l",
    weight: 400,
    lineHeight: "1.60",
    tracking: "0",
  },
  {
    variant: "body",
    sample:
      "Default body copy at 16px with a 1.6 line height — the base reading size for editorial and portal content.",
    usage: "Default body",
    sizeToken: "--font-size-body",
    weight: 400,
    lineHeight: "1.60",
    tracking: "0",
  },
  {
    variant: "body-s",
    sample: "Captions, table cells and dense UI text.",
    usage: "Small / UI",
    sizeToken: "--font-size-body-s",
    weight: 400,
    lineHeight: "1.55",
    tracking: "0",
  },
  {
    variant: "caption",
    sample: "Ref. MH-2026-014",
    usage: "Meta",
    sizeToken: "--font-size-caption",
    weight: 500,
    lineHeight: "1.40",
    tracking: "0.02em",
  },
  {
    variant: "eyebrow",
    sample: "People • Resources • Opportunity",
    usage: "Tagline / labels",
    sizeToken: "--font-size-eyebrow",
    weight: 600,
    lineHeight: "1.30",
    tracking: "0.18em",
  },
  {
    variant: "button",
    sample: "Request an introduction",
    usage: "Buttons",
    sizeToken: "--font-size-button",
    weight: 600,
    lineHeight: "1.00",
    tracking: "0.01em",
  },
  {
    variant: "nav",
    sample: "Business Areas",
    usage: "Navigation",
    sizeToken: "--font-size-nav",
    weight: 500,
    lineHeight: "1.00",
    tracking: "0.01em",
  },
  {
    variant: "metric",
    sample: "1,284",
    usage: "Portal KPIs",
    sizeToken: "--font-size-portal-metric",
    weight: 600,
    lineHeight: "1.05",
    tracking: "-0.01em",
  },
];

const logoStages: ReadonlyArray<{
  variant: LogoVariant;
  stage: "navy" | "ivory" | "white" | "gradient" | "panel";
  size: number;
}> = [
  { variant: "primary-dark", stage: "navy", size: 300 },
  { variant: "light", stage: "white", size: 240 },
  { variant: "horizontal-dark", stage: "navy", size: 320 },
  { variant: "icon-navy", stage: "ivory", size: 96 },
  { variant: "icon-ivory", stage: "navy", size: 96 },
  { variant: "icon-gold", stage: "white", size: 96 },
  { variant: "icon-navy-transparent", stage: "gradient", size: 96 },
  { variant: "icon-gold-transparent", stage: "panel", size: 96 },
];

/* Documentation readout of the motion tokens (see MotionLab for live state). */
const MOTION_VALUES: Record<string, string> = {
  "--motion-duration-fast": "150ms",
  "--motion-duration-base": "240ms",
  "--motion-duration-slow": "420ms",
  "--motion-duration-reveal": "700ms",
  "--motion-ease-standard": "cubic-bezier(.2, .6, .2, 1)",
  "--motion-ease-entrance": "cubic-bezier(.16, 1, .3, 1)",
};

const contrastPairs: ReadonlyArray<{
  fg: string;
  bg: string;
  intent: string;
  largeText?: boolean;
  nonText?: boolean;
}> = [
  {
    fg: "--color-brand-ivory-50",
    bg: "--color-brand-navy-900",
    intent: "Body copy on the MAP Navy ground",
  },
  {
    fg: "--color-brand-ivory-50",
    bg: "--color-brand-navy-950",
    intent: "Body copy on the deepest navy",
  },
  {
    fg: "--color-brand-gold-300",
    bg: "--color-brand-navy-900",
    intent: "Headings and accents on navy",
    largeText: true,
  },
  { fg: "--color-brand-ink-900", bg: "--color-brand-ivory-50", intent: "Body copy on ivory" },
  {
    fg: "--color-brand-blue-500",
    bg: "--color-brand-ivory-50",
    intent: "Headings and links on ivory",
  },
  {
    fg: "--color-brand-blue-300",
    bg: "--color-brand-navy-900",
    intent: "Link text on navy (the dark-theme accent token)",
  },
  {
    fg: "--color-brand-blue-400",
    bg: "--color-brand-navy-900",
    intent: "Focus ring on navy — WCAG 1.4.11 non-text contrast",
    nonText: true,
  },
  {
    fg: "--color-focus-ring",
    bg: "--color-brand-ivory-50",
    intent: "Focus ring on ivory — WCAG 1.4.11 non-text contrast",
    nonText: true,
  },
  {
    fg: "--color-brand-ink-900",
    bg: "--color-brand-gold-500",
    intent: "Primary button label (shipped)",
  },
  {
    fg: "--color-brand-ink-900",
    bg: "--color-brand-gold-300",
    intent: "Icons and labels on light gold",
  },
  {
    fg: "--color-brand-ink-900",
    bg: "--color-brand-metal-500",
    intent: "Labels on the gold app tile",
  },
  {
    fg: "--color-semantic-success-deep",
    bg: "--color-brand-ivory-50",
    intent: "Success text on ivory (teal-700)",
  },
  {
    fg: "--color-semantic-danger-deep",
    bg: "--color-brand-ivory-50",
    intent: "Error text on ivory",
  },
  {
    fg: "--color-semantic-success",
    bg: "--color-brand-ivory-50",
    intent: "Guard rail: teal-500 as body text on ivory is forbidden — use teal-700",
  },
  {
    fg: "--color-brand-gold-500",
    bg: "--color-brand-ivory-50",
    intent: "Guard rail: MAP Gold as text on ivory is forbidden — decorative only",
  },
];

/* ------------------------------------------------------------ helpers ----- */

function SectionIntro({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.sectionHead}>
      <span className={styles.sectionIndex}>{index}</span>
      <Heading level={2} tone="strong">
        {title}
      </Heading>
      <Text variant="body" tone="default">
        {children}
      </Text>
    </div>
  );
}

/* ---------------------------------------------------------- component ----- */

export default function BrandGalleryPage() {
  return (
    <main className={styles.page}>
      <Section as="header" tone="navy" spacing="md" className={styles.masthead}>
        <Container>
          <div className={styles.mastheadInner}>
            <div className={styles.stackSm}>
              <Logo variant="horizontal-dark" size={300} priority />
              <Text variant="caption" tone="muted">
                Brand foundation · Phase 2
              </Text>
            </div>
            <div className={styles.mastheadText}>
              <Eyebrow>Internal validation surface</Eyebrow>
              <Heading level={1} variant="display-l" tone="strong">
                Brand foundation — validation gallery
              </Heading>
              <Text variant="body" tone="default">
                Phase 2 proves the MAP Holding identity in code. Every colour, size and ratio below
                is read live from the shipped design tokens rather than restated by hand. This page
                is an internal check, not the website — the public site begins in Phase 3.
              </Text>
              <p className={styles.notice}>
                <span aria-hidden="true">▲</span> Internal only · excluded from indexing · not the
                homepage
              </p>
            </div>
          </div>
        </Container>
      </Section>
      {/* ------------------------------------------------------- 01 logo ---- */}
      <Section id="logo" tone="default" spacing="lg">
        <Container>
          <SectionIntro index="01" title="Logo system">
            Every variant is a faithful crop of the approved brand board shown on its approved
            ground. Aspect ratio is locked to the asset, so a lockup can never be stretched, and the
            source artwork is never redrawn, recoloured or substituted.
          </SectionIntro>

          <div className={styles.gridLogos}>
            {logoStages.map(({ variant, stage, size }) => {
              const asset = logoAssets[variant];
              const stageClass = {
                navy: styles.stageNavy,
                ivory: styles.stageIvory,
                white: styles.stageWhite,
                gradient: styles.stageGradient,
                panel: styles.stagePanel,
              }[stage];

              return (
                <figure key={variant} className={styles.card}>
                  <div className={`${styles.logoStage} ${stageClass}`}>
                    <Logo variant={variant} size={size} alt={asset.label} />
                  </div>
                  <figcaption className={styles.stackSm}>
                    <Heading level={4} tone="strong">
                      {asset.label}
                    </Heading>
                    <Text variant="body-s" tone="default">
                      {asset.description}
                    </Text>
                    <ul className={styles.metaList}>
                      <li className={styles.metaRow}>
                        <span className={styles.metaKey}>asset</span>
                        <span className={styles.metaVal}>{asset.src}</span>
                      </li>
                      <li className={styles.metaRow}>
                        <span className={styles.metaKey}>intrinsic</span>
                        <span className={styles.metaVal}>
                          {asset.width} × {asset.height}
                        </span>
                      </li>
                      <li className={styles.metaRow}>
                        <span className={styles.metaKey}>min width</span>
                        <span className={styles.metaVal}>{asset.minWidth}px</span>
                      </li>
                    </ul>
                  </figcaption>
                </figure>
              );
            })}
          </div>

          <Divider spaced />

          <div className={styles.gridAutoWide}>
            <div className={styles.stackSm}>
              <Heading level={3} tone="strong">
                Clear space
              </Heading>
              <Text variant="body-s" tone="default">
                Each lockup is a full panel crop of the approved board, so the mark&apos;s own clear
                space is already built in. When a lockup is placed into new layout, keep a minimum
                clear space of half the ribbon-M height on all four sides.
              </Text>
            </div>
            <div className={styles.stackSm}>
              <Heading level={3} tone="strong">
                Never
              </Heading>
              <ul className={styles.misuse}>
                {[
                  "Stretch, squash or crop the mark",
                  "Rotate or skew the ribbon",
                  "Recolour, re-gradient or trace the logo",
                  "Substitute another mark or icon set",
                  "Add drop shadows, outlines or bevels",
                  "Put a dark-ground lockup on a mid-tone surface",
                ].map((item) => (
                  <li key={item} className={styles.misuseItem}>
                    <span className={styles.misuseMark} aria-hidden="true">
                      ✕
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>
      {/* ---------------------------------------------------- 02 colour ---- */}
      <Section id="colour" tone="subtle" spacing="lg">
        <Container>
          <SectionIntro index="02" title="Colour">
            Palette values were sampled from the approved brand board rather than assumed, then
            compared against the Phase 1 provisional values. Each swatch prints the token name and
            the value the browser resolves at runtime.
          </SectionIntro>

          <div className={styles.stack}>
            {brandRamps.map((ramp) => (
              <div key={ramp.title} className={styles.stackSm}>
                <Heading level={3} tone="strong">
                  {ramp.title}
                </Heading>
                <Text variant="body-s" tone="muted">
                  {ramp.note}
                </Text>
                <div className={styles.gridAuto}>
                  {ramp.swatches.map((swatch) => (
                    <TokenSwatch key={swatch.token} token={swatch.token} label={swatch.label} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Divider spaced />

          <div className={styles.gridAutoWide}>
            <div className={styles.stackSm}>
              <Heading level={3} tone="strong">
                Neutrals
              </Heading>
              <Text variant="body-s" tone="muted">
                Functional ramp from Phase 1 §A.2 — not logo-derived, unchanged.
              </Text>
              <div className={styles.gridAuto}>
                {neutralRamp.map((swatch) => (
                  <TokenSwatch key={swatch.token} token={swatch.token} label={swatch.label} />
                ))}
              </div>
            </div>
            <div className={styles.stackSm}>
              <Heading level={3} tone="strong">
                Semantic / status
              </Heading>
              <Text variant="body-s" tone="muted">
                Brand-native wherever the identity provides a hue. Only danger introduces a hue the
                logo does not contain.
              </Text>
              <div className={styles.gridAuto}>
                {semanticTokens.map((swatch) => (
                  <TokenSwatch key={swatch.token} token={swatch.token} label={swatch.label} />
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------ 03 gradients ---- */}
      <Section id="gradients" tone="default" spacing="lg">
        <Container>
          <SectionIntro index="03" title="Brand gradients">
            Only gradients derived from the logo are available, interpolating in the ribbon&apos;s
            own amber → blue → teal order. There is no purple, magenta, neon or rainbow option in
            the token set.
          </SectionIntro>

          <div className={styles.gridAuto}>
            {gradients.map((gradient) => (
              <TokenSwatch
                key={gradient.token}
                token={gradient.token}
                label={gradient.label}
                kind="gradient"
              />
            ))}
          </div>

          <Divider spaced />

          <div className={styles.stackSm}>
            <Heading level={3} tone="strong">
              Applied as surfaces
            </Heading>
            <div className={styles.rowWrap}>
              <GradientSurface gradient="brand" padded>
                <Text variant="h4">brand</Text>
              </GradientSurface>
              <GradientSurface gradient="warm" padded>
                <Text variant="h4">warm</Text>
              </GradientSurface>
              <GradientSurface gradient="cool" padded>
                <Text variant="h4">cool</Text>
              </GradientSurface>
              <GradientSurface gradient="navy" padded>
                <Text variant="h4">navy</Text>
              </GradientSurface>
              <GradientSurface gradient="ivory" padded>
                <Text variant="h4">ivory</Text>
              </GradientSurface>
            </div>
          </div>

          <Divider spaced />

          <div className={styles.stackSm}>
            <Heading level={3} tone="strong">
              Brand rule
            </Heading>
            <Text variant="body-s" tone="muted">
              <code>Rule</code> / <code>Divider variant=&quot;brand&quot;</code> — the logo gradient
              used as a separator.
            </Text>
            <Rule />
          </div>
        </Container>
      </Section>
      {/* ---------------------------------------------- 04 typography ---- */}
      <Section id="typography" tone="subtle" spacing="lg">
        <Container>
          <SectionIntro index="04" title="Typography">
            Sora carries display and headings; Inter carries body, UI and numerals. Sizes are fluid
            between the desktop and mobile values specified in Phase 1 §B.2, so a single
            implementation serves every viewport.
          </SectionIntro>

          <div className={styles.stack}>
            {typeSpecimens.map((specimen) => (
              <div key={specimen.variant} className={styles.gridType}>
                <div className={styles.stackSm}>
                  <Text variant="body-s" tone="strong">
                    {specimen.usage}
                  </Text>
                  <code className={styles.sectionIndex}>{specimen.variant}</code>
                </div>
                <div className={styles.specimen}>
                  <Text variant={specimen.variant} tone="strong">
                    {specimen.sample}
                  </Text>
                  <p className={styles.specimenMeta}>
                    <span>{specimen.sizeToken}</span>
                    <span>weight {specimen.weight}</span>
                    <span>line-height {specimen.lineHeight}</span>
                    <span>tracking {specimen.tracking}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------- 05 buttons ---- */}
      <Section id="buttons" tone="default" spacing="lg">
        <Container>
          <SectionIntro index="05" title="Buttons and links">
            One actionable primitive with the Phase 1 state contract: default, hover, focus-visible,
            active and disabled. Sizes <code>md</code> and above meet the 44 × 44 minimum target.
            Tab through this section to see the focus ring on every control.
          </SectionIntro>

          <div className={styles.stack}>
            <div className={styles.stackSm}>
              <Heading level={3} tone="strong">
                Variants
              </Heading>
              <div className={styles.rowWrap}>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Text link</Button>
              </div>
            </div>

            <Divider />

            <div className={styles.stackSm}>
              <Heading level={3} tone="strong">
                Sizes
              </Heading>
              <div className={styles.rowWrap}>
                <Button size="sm">Small · 38px</Button>
                <Button size="md">Medium · 44px</Button>
                <Button size="lg">Large · 52px</Button>
              </div>
            </div>

            <Divider />

            <div className={styles.stackSm}>
              <Heading level={3} tone="strong">
                States
              </Heading>
              <div className={styles.rowWrap}>
                <Button variant="primary" disabled>
                  Disabled primary
                </Button>
                <Button variant="outline" disabled>
                  Disabled outline
                </Button>
                <Button variant="primary" aria-disabled="true">
                  aria-disabled
                </Button>
                <Button href="#buttons" variant="primary">
                  Anchor as primary
                </Button>
                <Button href="https://example.com" target="_blank" variant="outline">
                  External link button
                </Button>
              </div>
              <Text variant="body-s" tone="muted">
                Hover an enabled button for the elevation and gold glow; focus is drawn with a 2px
                blue-400 ring that holds at least 3:1 against both grounds.
              </Text>
            </div>

            <Divider />

            <div className={styles.stackSm}>
              <Heading level={3} tone="strong">
                Links
              </Heading>
              <div className={styles.rowWrap}>
                <Link href="#buttons">Standalone link</Link>
                <Link href="#buttons" variant="subtle">
                  Subtle link
                </Link>
                <Link href="#buttons" variant="nav">
                  Nav link
                </Link>
                <Link href="https://example.com">External link</Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>
      {/* ------------------------------------------------ 06 surfaces ---- */}
      <Section id="surfaces" tone="subtle" spacing="lg">
        <Container>
          <SectionIntro index="06" title="Surfaces and theme">
            The <code>Section</code> primitive owns the ground and re-points the semantic text,
            border and accent tokens for its descendants. Components therefore need no per-theme
            variants — the same card, badge and button stay correct on ivory, white and navy.
          </SectionIntro>
        </Container>

        <div className={styles.stack}>
          {(
            [
              { tone: "default", label: "Ivory ground", note: "--color-bg-default" },
              { tone: "raised", label: "White surface", note: "--color-bg-raised" },
              { tone: "subtle", label: "Ivory shade", note: "--color-bg-subtle" },
              { tone: "navy", label: "MAP Navy", note: "--color-brand-navy-900" },
              { tone: "navy-deep", label: "Navy deep", note: "--color-brand-navy-950" },
              { tone: "navy-raised", label: "Navy raised", note: "--color-brand-navy-800" },
              { tone: "gradient-navy", label: "Gradient navy", note: "--gradient-navy" },
              { tone: "gradient-ivory", label: "Gradient ivory", note: "--gradient-ivory" },
            ] as const
          ).map((surface) => (
            <Section as="div" key={surface.tone} tone={surface.tone} spacing="md">
              <Container>
                <div className={styles.rowWrap}>
                  <div className={styles.stackSm}>
                    <Heading level={4} tone="strong">
                      {surface.label}
                    </Heading>
                    <Text variant="body-s" tone="muted">
                      <code>{surface.note}</code>
                    </Text>
                  </div>
                  <div className={styles.rowWrap}>
                    <Button size="sm" variant="primary">
                      Primary
                    </Button>
                    <Button size="sm" variant="outline">
                      Outline
                    </Button>
                    <StatusBadge tone="success">Success</StatusBadge>
                  </div>
                </div>
              </Container>
            </Section>
          ))}
        </div>

        <Container>
          <Divider spaced />

          <div className={styles.stackSm}>
            <Heading level={3} tone="strong">
              Cards and panels
            </Heading>
            <div className={styles.gridAutoWide}>
              <div className={styles.card}>
                <Eyebrow tone="gold">Panel · light</Eyebrow>
                <Heading level={4} tone="strong">
                  Card on ivory
                </Heading>
                <Text variant="body-s" tone="default">
                  Raised surface with the navy-tinted shadow-2 token and the restrained radius-md
                  corner. Cards lean squarer than pill-heavy by design.
                </Text>
                <Button size="sm" variant="outline">
                  Action
                </Button>
              </div>

              <div className={`${styles.card} ${styles.cardDark}`}>
                <Eyebrow tone="gold">Panel · dark</Eyebrow>
                <Heading level={4} tone="strong">
                  Card on navy
                </Heading>
                <Text variant="body-s" tone="default">
                  The same component and the same tokens; only the inherited theme changed. No
                  component-level dark variant was written.
                </Text>
                <Button size="sm" variant="outline">
                  Action
                </Button>
              </div>

              <GradientSurface gradient="brand" radius="md" padded>
                <div className={styles.stackSm}>
                  <Eyebrow tone="inherit">Gradient panel</Eyebrow>
                  <Heading level={4} tone="inherit">
                    Brand gradient surface
                  </Heading>
                  <Text variant="body-s" tone="inherit">
                    The ribbon&apos;s own amber → blue → teal progression, used with restraint for
                    accents and decorative elements.
                  </Text>
                </div>
              </GradientSurface>
            </div>
          </div>
        </Container>
      </Section>
      {/* -------------------------------------------------- 07 states ---- */}
      <Section id="states" tone="default" spacing="lg">
        <Container>
          <SectionIntro index="07" title="Status states">
            Status is always carried by a label, never by colour alone. The tone drives the dot, the
            tint and the border only, so the same badge stays legible on ivory and navy grounds
            without a per-theme variant.
          </SectionIntro>

          <div className={styles.gridAutoWide}>
            {(["light", "dark"] as const).map((theme) => (
              <div
                key={theme}
                className={theme === "dark" ? `${styles.card} ${styles.cardDark}` : styles.card}
              >
                <Heading level={3} tone="strong">
                  {theme === "dark" ? "On navy" : "On ivory"}
                </Heading>
                <div className={styles.rowWrap}>
                  <StatusBadge tone="success">Active</StatusBadge>
                  <StatusBadge tone="pending">Pending</StatusBadge>
                  <StatusBadge tone="info">In review</StatusBadge>
                  <StatusBadge tone="warning">Attention</StatusBadge>
                  <StatusBadge tone="danger">Blocked</StatusBadge>
                  <StatusBadge tone="neutral">Archived</StatusBadge>
                </div>
              </div>
            ))}
          </div>

          <Divider spaced />

          <div className={styles.stackSm}>
            <Heading level={3} tone="strong">
              Messages
            </Heading>
            <div className={styles.gridAutoWide}>
              {(
                [
                  {
                    tone: "success",
                    title: "Submission received",
                    body: "Your documents are queued for review.",
                    role: "status",
                  },
                  {
                    tone: "warning",
                    title: "Incomplete application",
                    body: "Two documents are still outstanding.",
                    role: "status",
                  },
                  {
                    tone: "danger",
                    title: "Upload failed",
                    body: "The file exceeded the 25 MB limit.",
                    role: "alert",
                  },
                  {
                    tone: "info",
                    title: "Scheduled maintenance",
                    body: "The portal will be unavailable Sunday 02:00–04:00 UTC.",
                    role: "status",
                  },
                ] as const
              ).map((message) => (
                <div
                  key={message.tone}
                  className={styles.message}
                  data-tone={message.tone}
                  role={message.role}
                >
                  <StatusBadge tone={message.tone}>{message.tone}</StatusBadge>
                  <Heading level={4} tone="strong">
                    {message.title}
                  </Heading>
                  <Text variant="body-s" tone="default">
                    {message.body}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* -------------------------------------------------- 08 motion ---- */}
      <Section id="motion" tone="navy" spacing="lg">
        <Container>
          <SectionIntro index="08" title="Motion">
            Premium and restrained: durations, easings and distances are tokens, and the
            scroll-reveal is the only entrance motion in the foundation. Reduced motion is a hard
            requirement — the same CSS shows content instantly and removes the stagger, so nothing
            depends on animation. Change your OS setting to see this section respond.
          </SectionIntro>

          <MotionLab />

          <Divider spaced />

          <div className={styles.gridAuto}>
            {(
              [
                "--motion-duration-fast",
                "--motion-duration-base",
                "--motion-duration-slow",
                "--motion-duration-reveal",
                "--motion-ease-standard",
                "--motion-ease-entrance",
              ] as const
            ).map((token) => (
              <div key={token} className={styles.stackSm}>
                <Text variant="body-s" tone="muted">
                  <code>{token}</code>
                </Text>
                <Text variant="body" tone="strong">
                  {MOTION_VALUES[token]}
                </Text>
              </div>
            ))}
          </div>
        </Container>
      </Section>
      {/* ------------------------------------------ 09 accessibility ---- */}
      <Section id="accessibility" tone="subtle" spacing="lg">
        <Container>
          <SectionIntro index="09" title="Accessibility">
            Contrast is computed live from the shipped tokens rather than asserted. Each row
            resolves both custom properties, measures the WCAG ratio and grades it. The final two
            rows are guard rails: combinations the brand explicitly forbids for text.
          </SectionIntro>

          <div className={styles.card}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <caption className="u-visually-hidden">
                  WCAG contrast validation of MAP Holding brand colour pairs
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Sample</th>
                    <th scope="col">Pair</th>
                    <th scope="col">Intended use</th>
                    <th scope="col">Ratio</th>
                    <th scope="col">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {contrastPairs.map((pair) => (
                    <ContrastPair
                      key={`${pair.fg}|${pair.bg}`}
                      foreground={pair.fg}
                      background={pair.bg}
                      intent={pair.intent}
                      largeText={pair.largeText}
                      nonText={pair.nonText}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Divider spaced />

          <div className={styles.gridAutoWide}>
            <div className={styles.stackSm}>
              <Heading level={3} tone="strong">
                Focus visibility
              </Heading>
              <Text variant="body-s" tone="default">
                Tab through these controls: every focusable element receives a 2px blue-400 outline
                with a 2px offset. Focus indication is never removed, only suppressed for pointer
                users via <code>:focus:not(:focus-visible)</code>.
              </Text>
              <div className={styles.focusRow}>
                <Button size="sm" variant="primary">
                  Focusable button
                </Button>
                <Button size="sm" variant="outline">
                  Focusable outline
                </Button>
                <Link href="#accessibility">Focusable link</Link>
              </div>
            </div>

            <div className={styles.stackSm}>
              <Heading level={3} tone="strong">
                Structure
              </Heading>
              <ul className={styles.metaList}>
                {[
                  "One h1, then descending heading levels.",
                  "Landmarks: header, main, section, footer.",
                  "Controls are native button and anchor elements.",
                  "Status carries a text label, never colour alone.",
                  "Tables use caption, th scope and header cells.",
                  "Decorative dots and glyphs are aria-hidden.",
                  "Reduced motion honoured as a hard requirement.",
                ].map((item) => (
                  <li key={item}>
                    <Text variant="body-s" tone="default">
                      {item}
                    </Text>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>
      {/* -------------------------------------------- 10 responsive ---- */}
      <Section id="responsive" tone="default" spacing="lg">
        <Container>
          <SectionIntro index="10" title="Responsive behaviour">
            One implementation, no duplicated per-viewport components. Containers use a fluid
            gutter, type sizes are fluid clamps between the Phase 1 desktop and mobile values, and
            grids reflow with auto-fit. Resize this window to verify.
          </SectionIntro>

          <div className={styles.gridAutoWide}>
            {(
              [
                {
                  title: "Desktop · 1024+",
                  body: "Full container width, 12-column intent, type at the top of the fluid range, 44px targets.",
                },
                {
                  title: "Tablet · 768–1023",
                  body: "Mid fluid type, two-up card grids, gutters settle between 24 and 32px.",
                },
                {
                  title: "Mobile · under 768",
                  body: "display-xl collapses to 40px, h1 to 30px, body holds at 16px, grids collapse to a single column.",
                },
              ] as const
            ).map((viewport) => (
              <div key={viewport.title} className={styles.card}>
                <Heading level={3} tone="strong">
                  {viewport.title}
                </Heading>
                <Text variant="body-s" tone="default">
                  {viewport.body}
                </Text>
              </div>
            ))}
          </div>

          <Divider spaced />

          <div className={styles.stackSm}>
            <Heading level={3} tone="strong">
              Breakpoints
            </Heading>
            <div className={styles.gridAuto}>
              {(
                [
                  ["sm", "480px"],
                  ["md", "768px"],
                  ["lg", "1024px"],
                  ["xl", "1280px"],
                  ["2xl", "1536px"],
                ] as const
              ).map(([name, px]) => (
                <div key={name} className={styles.stackSm}>
                  <Text variant="body-s" tone="muted">
                    <code>--breakpoint-{name}</code>
                  </Text>
                  <Text variant="h4" tone="strong">
                    {px}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------- footer ---- */}
      <Section as="footer" tone="navy-deep" spacing="md" className={styles.footer}>
        <Container>
          <div className={styles.mastheadInner}>
            <Logo variant="primary-dark" size={240} alt="MAP Holding" />
            <div className={styles.stackSm}>
              <Eyebrow>People • Resources • Opportunity</Eyebrow>
              <Text variant="body-s" tone="muted">
                Phase 2 — brand foundation and validation gallery. No website pages, client portal,
                authentication, database or API are part of this phase.
              </Text>
              <Text variant="caption" tone="muted">
                Source of truth: MAP Holding Brand Identity Board · tokens in src/styles/tokens ·
                assets in public/brand
              </Text>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
