# MAP HOLDING — PHASE 2

## Brand Foundation in Code + Logo System + Validation Gallery

> **Outcome:** the MAP Holding brand foundation is implemented in code and validated in a live
> internal gallery. **No website pages, client portal, authentication, database or API were built.**
> Awaiting approval before Phase 3.

Authoritative specification: `docs/PHASE-1-ARCHITECTURE.md` (read in full; no Phase 1 decision was
redesigned).

Also produced: `docs/BRAND-GUIDELINES.md` — logo usage rules, the sampled colour system and the
accessibility rules.

---

## A. FILES CREATED / CHANGED

### Configuration (new)

| File                                                | Purpose                                                                                                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                                      | Next 16.3.8 · React 19.3.0 · TypeScript 5.9 · ESLint 9 · Prettier 3. Scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `format`, `format:check` |
| `tsconfig.json`                                     | strict, `@/*` path alias (Next added `jsx: react-jsx`)                                                                                               |
| `next.config.ts`                                    | `reactStrictMode`                                                                                                                                    |
| `eslint.config.mjs`                                 | Flat config built on `eslint-config-next/core-web-vitals`, plus a scoped override for brand assets                                                   |
| `.prettierrc.json`, `.prettierignore`, `.gitignore` | Formatting and ignore rules                                                                                                                          |

### Brand assets (new) — `public/brand/`

`logo-primary-dark.png` · `logo-light.png` · `logo-horizontal-dark.png` · `icon-navy.png` ·
`icon-ivory.png` · `icon-gold.png` · `icon-navy-transparent.png` · `icon-gold-transparent.png` ·
`icon-256.png`

Plus `src/app/icon.png` (favicon).

### Design tokens (new) — `src/styles/tokens/`

`color.css` · `type.css` · `space.css` · `radius.css` · `shadow.css` · `border.css` · `motion.css` ·
`layout.css`

### Base layer (new) — `src/styles/base/`

`reset.css` · `globals.css`

### Components (new)

| Path                                        | Exports                                |
| ------------------------------------------- | -------------------------------------- |
| `src/components/brand/Logo.tsx`             | `Logo`                                 |
| `src/components/brand/TokenSwatch.tsx`      | `TokenSwatch` (live token resolution)  |
| `src/components/brand/ContrastPair.tsx`     | `ContrastPair` (live WCAG measurement) |
| `src/components/layout/Container.tsx`       | `Container`                            |
| `src/components/layout/Section.tsx`         | `Section` (surface + theme primitive)  |
| `src/components/layout/Divider.tsx`         | `Divider`, `Rule`                      |
| `src/components/layout/GradientSurface.tsx` | `GradientSurface`                      |
| `src/components/typography/Text.tsx`        | `Text`, `Heading`, `Eyebrow`           |
| `src/components/controls/Button.tsx`        | `Button`                               |
| `src/components/controls/Link.tsx`          | `Link`, `LinkList`                     |
| `src/components/feedback/StatusBadge.tsx`   | `StatusBadge`                          |
| `src/components/motion/Reveal.tsx`          | `Reveal`                               |
| `src/components/motion/MotionLab.tsx`       | `MotionLab`                            |

Each has a co-located CSS Module.

### Libs (new) — `src/lib/`

`cn.ts` · `brand.ts` (logo asset registry) · `tokens.ts` (computed-token resolution) ·
`contrast.ts` (WCAG maths) · `use-token-value.ts`

### Routes (new) — `src/app/`

`layout.tsx` (fonts + token imports + metadata) · `page.tsx` (redirects `/` → `/brand`) ·
`brand/page.tsx` + `brand/gallery.module.css` (the validation gallery)

### Unchanged from Phase 1

`docs/PHASE-1-ARCHITECTURE.md` and `preview/index.html` (the Phase 1 static preview, kept as a
visual record and deliberately excluded from lint/format).

---

## B. BRAND COLOURS

Sampled by pixel analysis of `MAP Holding Brand Identity Board.png` — per-channel medians per hue
family, averaged across the three lockups and the app-icon tiles. Full table in
`docs/BRAND-GUIDELINES.md` §2.2.

**Core production values**

| Token                  | Phase 1 provisional | Phase 2 production | Delta                                                                      |
| ---------------------- | ------------------- | ------------------ | -------------------------------------------------------------------------- |
| MAP Gold (`gold-500`)  | `#D99A3C`           | **`#f39639`**      | lighter, more saturated ribbon amber                                       |
| MAP Blue (`blue-500`)  | `#1E4FB0`           | **`#003ba3`**      | deeper, fully saturated royal                                              |
| MAP Teal (`teal-500`)  | `#18B4AE`           | **`#0092ba`**      | the ribbon's cool end is cyan-teal, not green-teal                         |
| MAP Navy (`navy-900`)  | `#0A1026`           | **`#080b1e`**      | marginal                                                                   |
| Deep navy (`navy-950`) | `#070C1E`           | **`#04060f`**      | board vignette is much deeper                                              |
| Ivory (`ivory-50`)     | `#F7F2E7`           | **`#faf8f4`**      | **largest correction — the board's light ground is near-white, not cream** |
| Ink (`ink-900`)        | `#111418`           | **`#0b0f19`**      | darker, navy-tinted                                                        |

Also re-anchored to samples: `gold-300/400/600/700`, `blue-400/600/700`, `teal-400/700`,
`navy-800`, `ivory-100`.

**New token group added:** `metal-300/500/700` (`#e8d3aa` / `#d1a660` / `#b07f40`). Sampling showed
the identity contains **two distinct golds** — the vivid ribbon amber and a metallic champagne gold
used for the wordmark and the gold app tile. Merging them would have misrepresented both.

**Unchanged:** the neutral ramp (`neutral-0…900`) — functional greys, not logo-derived. Semantic
relationships are preserved (`success` = MAP Teal, `info` = ribbon blue, `warning`/`pending` = MAP
Gold; `danger #c0392b` remains the one functional red the identity does not provide).

---

## C. LOGO SYSTEM

The logo was **never redrawn**. Every asset is a faithful rectangular crop of the approved board at
its intrinsic proportions, retaining the board's own approved ground and clear space.

| Variant                 | Asset                       | Intrinsic  | Min width | Approved ground               |
| ----------------------- | --------------------------- | ---------- | --------- | ----------------------------- |
| `primary-dark`          | `logo-primary-dark.png`     | 1004 × 761 | 220 px    | MAP Navy / near-black         |
| `light`                 | `logo-light.png`            | 531 × 477  | 180 px    | Ivory / white                 |
| `horizontal-dark`       | `logo-horizontal-dark.png`  | 532 × 191  | 180 px    | Navy (nav, footer, signature) |
| `icon-navy`             | `icon-navy.png`             | 152 × 152  | 24 px     | Light grounds / favicon       |
| `icon-ivory`            | `icon-ivory.png`            | 152 × 152  | 24 px     | Navy or photographic          |
| `icon-gold`             | `icon-gold.png`             | 152 × 152  | 24 px     | Any ground                    |
| `icon-navy-transparent` | `icon-navy-transparent.png` | 152 × 152  | 24 px     | Any branded surface           |
| `icon-gold-transparent` | `icon-gold-transparent.png` | 152 × 152  | 24 px     | Any branded surface           |

Rules enforced **in code** by `<Logo>`: aspect ratio locked to the asset (height always derived from
width, so a lockup can never stretch), min legible width enforced, source never substituted.

Verified in the built page: `1004×761 → 300×227`, `532×191 → 320×115`, `531×477 → 240×216` — all
ratios preserved to integer-pixel rounding.

**Known limitation (needs the brand owner):** the lockups exist only inside the identity-board
raster. True-vector, transparent SVGs (`logo-primary.svg`, `logo-light.svg`,
`logo-horizontal.svg`, app-icon SVGs) **do not exist yet** and must be exported from the original
vector source before the public site ships. The two `*-transparent.png` icons are the only
alpha-matted assets (produced by removing the board's white surround, not by re-drawing).

---

## D. DESIGN TOKENS

`src/styles/tokens/`, one file per concern, all consumed as CSS custom properties:

| File         | Groups                                                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `color.css`  | brand gold / metal / blue / teal, grounds (navy, ivory, ink), neutrals, semantic + deep variants, light & dark semantic aliases, tone-adaptive accents, 5 gradients |
| `type.css`   | families, weights, 14 fluid sizes, line heights, tracking                                                                                                           |
| `space.css`  | `space-0…11` (4px base, 8px rhythm) + section rhythm                                                                                                                |
| `radius.css` | `xs → full` (restrained; default `md`)                                                                                                                              |
| `shadow.css` | `shadow-1/2/3` navy-tinted + `shadow-gold` (CTA hover)                                                                                                              |
| `border.css` | hair / 1px / 2px widths, light & dark colours, focus ring                                                                                                           |
| `motion.css` | 4 durations, 3 easings, 3 distances, stagger — **plus the reduced-motion override**                                                                                 |
| `layout.css` | containers (1280 / 880 / 1440), fluid gutter, grid, breakpoints, z-index                                                                                            |

Semantic tokens are wired through a `Section` theme primitive: dark tones re-point
`--color-text-*`, `--color-border-*`, `--color-accent*` and `--color-bg-raised` locally, so
components need **no per-theme variants**. The gallery proves this by rendering the same card,
badge, button and link on ivory, white, navy and gradient grounds.

---

## E. TYPOGRAPHY

**Sora** (display/headings, weights 400 + 600) and **Inter** (body/UI/numerals, 400 + 500 + 600),
loaded via `next/font/google` so they are **self-hosted at build time — no runtime font-CDN
dependency**. Verified: 9 `.woff2` files emitted to `.next/static/media/`, and the built CSS wires
`--font-family-display: var(--font-sora), system-ui, …`.

The approved Phase 1 type scale is implemented exactly (14 variants, fluid clamps between the
desktop and mobile values, tracking including the `0.18em` eyebrow that mirrors
`PEOPLE • RESOURCES • OPPORTUNITY`).

---

## F. VALIDATION GALLERY

Route `/brand` (10 numbered sections), built entirely from the foundation primitives:

1. **Logo system** — all 8 variants on their approved grounds, with intrinsic size, min width and
   usage notes; clear-space rule; explicit "never" list.
2. **Colour** — every brand ramp, neutrals and semantic tokens as swatches that print the token name
   **and the value the browser resolves at runtime**.
3. **Brand gradients** — all 5 gradient tokens (resolved live) plus applied surfaces and the brand
   rule.
4. **Typography** — display-xl → metric, each with usage, size token, weight, line-height, tracking.
5. **Buttons & links** — variants, sizes, disabled / `aria-disabled`, anchor buttons, links.
6. **Surfaces & theme** — 8 ground tones, each rendering the same button/badge to prove the theme
   flip; cards, dark card and brand gradient panel.
7. **Status states** — success / warning / danger (error) / info / pending / neutral badges on ivory
   **and** navy, plus four message panels.
8. **Motion** — live `prefers-reduced-motion` readout, replayable staggered reveal, motion token
   readout.
9. **Accessibility** — a contrast table that **measures** every pair against the shipped tokens.
10. **Responsive** — breakpoint tokens and the desktop/tablet/mobile behaviour contract.

`/` redirects to `/brand`; there is no homepage content. The page is `noindex, nofollow` (verified
in the built HTML).

---

## G. ACCESSIBILITY

Contrast is **measured at runtime from the shipped tokens**, not asserted. Every pair in the
gallery resolves both custom properties, computes the WCAG ratio and grades it against the
requirement that actually applies (text 4.5:1, large text 3:1, non-text/UI 3:1 per WCAG 1.4.11).

Verified results:

| Pair                                           | Ratio   | Grade                |
| ---------------------------------------------- | ------- | -------------------- |
| `ivory-50` on `navy-900` (body)                | 18.38:1 | AAA                  |
| `ivory-50` on `navy-950` (body)                | 19.07:1 | AAA                  |
| `gold-300` on `navy-900` (headings)            | 14.87:1 | AAA                  |
| `ink-900` on `ivory-50` (body)                 | 18.05:1 | AAA                  |
| `blue-500` on `ivory-50` (headings/links)      | 9.19:1  | AAA                  |
| `blue-300` on `navy-900` (link text on dark)   | 7.90:1  | AAA                  |
| `blue-400` on `navy-900` (focus ring)          | 4.24:1  | Non-text (3:1)       |
| `focus-ring` on `ivory-50`                     | 4.33:1  | Non-text (3:1)       |
| `ink-900` on `gold-500` (primary button label) | 8.42:1  | AAA                  |
| `ink-900` on `gold-300`                        | 14.61:1 | AAA                  |
| `ink-900` on `metal-500`                       | 8.51:1  | AAA                  |
| `teal-700` on `ivory-50` (success text)        | 5.61:1  | AA                   |
| `danger-deep` on `ivory-50` (error text)       | 7.91:1  | AAA                  |
| Guard rail: `teal-500` as body text on ivory   | 3.40:1  | **Fail — forbidden** |
| Guard rail: `gold-500` as text on ivory        | 2.14:1  | **Fail — forbidden** |

**Defect found and fixed by this validation.** The first build fed `blue-400` to `--color-accent` on
dark grounds, which made link text on navy 4.24:1 — a fail for AA text. The token was changed so
that `blue-300` (7.90:1, AAA) is the dark-ground link colour and `blue-400` is reserved for the
focus ring, where 4.24:1 satisfies the 3:1 non-text requirement Phase 1 §L actually specifies. The
global `a` rule was also switched from a hard-coded `blue-500` to the theme-adaptive
`--color-accent`, so a bare anchor is now safe on navy too. The two "guard rail" rows are kept
visible in the gallery as deliberate, documented failures.

Other accessibility work: semantic landmarks (`header`/`main`/`section`/`footer`), **exactly one
`h1`** with a correct descending outline, native `button`/`a` controls, `:focus-visible` ring that
is never removed, table with `caption` + `th scope`, `aria-hidden` on decorative dots and glyphs,
status always labelled (never colour-only), 44 × 44 px minimum targets, and reduced motion honoured
as a hard requirement.

### Reduced motion — verified

With `prefers-reduced-motion: reduce` emulated, the computed values change exactly as specified:

|                            | default                | reduced motion |
| -------------------------- | ---------------------- | -------------- |
| `--motion-duration-reveal` | `.7s`                  | **`.01ms`**    |
| reveal element `opacity`   | `0`                    | **`1`**        |
| reveal element `transform` | `matrix(1,0,0,1,0,24)` | **`none`**     |

---

## H. RESPONSIVE VALIDATION

One implementation — no per-viewport components. Containers use a fluid gutter, type sizes are fluid
clamps, and grids reflow with `auto-fit`.

Measured `document.scrollWidth` vs viewport (Chrome DevTools Protocol, real device metrics):

| Viewport          | `scrollWidth` | Horizontal overflow |
| ----------------- | ------------- | ------------------- |
| 320 px            | 320           | none                |
| 375 px            | 375           | none                |
| 390 px            | 390           | none                |
| 768 px (tablet)   | 768           | none                |
| 1024 px           | 1024          | none                |
| 1280 px           | 1280          | none                |
| 1440 px (desktop) | 1440          | none                |

Three overflow defects were found and fixed during this validation:

1. **Long unbreakable strings** (asset paths, token names) forced flex children wider than the
   viewport. Fixed with `min-width: 0` on the relevant flex/grid children plus `overflow-wrap:
anywhere`.
2. **The 5-column contrast table** widened the whole document. Fixed by wrapping it in a
   `max-width: 100%; overflow-x: auto` container — verified containing 408 px of table inside a
   265 px box at 390 px, and 198 px at 320 px, without the page overflowing.
3. A `StatusBadge` with `white-space: nowrap` and a long label pushed the page 17 px wide below
   340 px; the primitive now allows wrapping, and the offending label was shortened.

Screenshots were reviewed at 390 / 768 / 1440 px. Note: headless Chrome's `--window-size` hits a
macOS minimum window width and can crop a wider layout, producing a false overflow signal — the
final numbers above come from real device-metrics emulation.

---

## I. TESTS

All commands run in `/Users/dcv/Downloads/MAP HOLDING`. Results are actual output, not expectations.

| Command                  | Result                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| `npx tsc --noEmit`       | **exit 0** — no type errors under `strict`                                                           |
| `npx eslint .`           | **exit 0** — no errors, no warnings                                                                  |
| `npx prettier --check .` | **exit 0** — "All matched files use Prettier code style!"                                            |
| `npx next build`         | **exit 0** — compiled successfully; `/`, `/_not-found`, `/brand`, `/icon.png` all prerendered static |
| `npx next start -p 3100` | **HTTP 200** on `/brand`, `/icon.png` and every `/brand/*` asset; `/` → **307** redirect to `/brand` |

No test runner is configured, because no test framework was introduced in this phase: Phase 1 §N
lists ESLint + Prettier + strict TypeScript as the quality gate, and adding a runner with no
components under test would be scope creep. A DOM/unit layer belongs in Phase 3, alongside the first
real components.

Three lint errors from React 19's `react-hooks/set-state-in-effect` rule were fixed properly rather
than suppressed — browser state reads moved to `useSyncExternalStore`, and the
IntersectionObserver fallback deferred to an animation frame.

Verified against the built output (not just the source): the sampled token values are present in the
shipped CSS, `--font-family-display` resolves to the self-hosted `--font-sora`, the page emits
`noindex, nofollow`, and all logo `<img>` elements carry the correct intrinsic width/height.

---

## J. PHASE 2 SCOPE VERIFICATION

Confirmed **not** created in this phase:

- No homepage, About, Business Areas, Projects, Partnerships or Contact page. `/` redirects to the
  internal gallery.
- No client portal, no Founding Partners surface.
- No authentication, no session, no roles.
- No database, no ORM, no schema, no migrations.
- No API routes, no route handlers, no server actions, no data fetching.
- No AI assistant, no CMS, no content collections.
- No deployment configuration, no analytics, no environment secrets.
- No DCV / Agnes / Commander / A14 code, naming or assumptions.

The only dependencies installed are `next`, `react`, `react-dom` and their type/lint/format tooling.
No UI framework, no animation library, no CSS-in-JS runtime, no component library.

---

## K. PHASE 3 RECOMMENDATION

**Phase 3 — Public shell.** Build the structural chrome every later public page mounts into, still
with no marketing content:

1. `Header` / `PrimaryNav` / `MobileNav` (accessible drawer: focus trap, `Esc`, focus restore) /
   `Footer` / `FooterColumns` / `LegalBar`, using the `horizontal-dark` lockup on navy.
2. Promote `Section` + `Container` + `Grid` / `Stack` into reusable page scaffolding.
3. Route scaffolding for the Phase 1 information architecture with placeholder `SectionHeader` and
   `EmptyState` content only — no fabricated copy or claims.
4. Add the primitives the shell needs: `EyebrowLabel`, `SectionHeader`, `Breadcrumbs`, `IconButton`,
   `Badge`/`Tag`, `Skeleton`.
5. Introduce a DOM/unit test layer (Vitest + Testing Library) with keyboard-navigation and landmark
   assertions on the shell.

**Before Phase 3 starts, please supply** the true-vector logo lockups (SVG, transparent) so the
header and footer are not built on opaque raster crops.

Awaiting approval — Phase 2 stops here.
