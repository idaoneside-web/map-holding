# MAP HOLDING — PHASE 1

## Brand System + Website & Client-Portal Architecture Proposal

> **Status:** Phase 1 deliverable — architecture only. **No pages, components, routes, database, auth, API or deployment have been created.**
> **Source of truth:** `MAP Holding Brand Identity Board.png`. Everything below is derived _logo → colors → type → system → site → portal → imagery → video_.

---

## 0. CONTEXT & GROUND RULES

| Item                 | Value                                                                          |
| -------------------- | ------------------------------------------------------------------------------ |
| Workspace            | `/Users/dcv/Downloads/MAP HOLDING`                                             |
| Nature               | Greenfield. No legacy MAP Holding code exists (verified: directory empty).     |
| Scope                | MAP Holding only. No DCV / Agnes / Commander / A14 code, terms or assumptions. |
| Brand statement      | **PEOPLE • RESOURCES • OPPORTUNITY**                                           |
| This phase ends with | This proposal. **Awaiting approval before build.**                             |

**Reading of the identity board (authoritative):**

1. **Primary lockup (dark)** — ribbon-M above `MAP / HOLDING` wordmark on deep navy, gold-gradient wordmark, tagline in tracked small caps.
2. **Primary lockup (light)** — same mark on ivory, near-black wordmark.
3. **Horizontal lockup** — mark left, stacked wordmark + tagline right (nav, footer, signatures).
4. **App-icon set** — rounded-square tiles: navy, ivory, solid-gold variants + a single-color/negative M silhouette.
5. **Pillar strip** — PEOPLE / RESOURCES / OPPORTUNITY with cinematic imagery (city-at-dusk, mining/earthworks, skyline/infrastructure).

---

## A. BRAND SYSTEM — PALETTE (derived from the logo)

The ribbon-M moves through **amber-gold → deep blue → teal**; those three are the primary hues and their interaction _is_ the gradient system. Navy and ivory are the grounds.

### A.1 Core brand ramps

| Token       | Name                   | HEX       | Usage                                       |
| ----------- | ---------------------- | --------- | ------------------------------------------- |
| `gold-300`  | Amber Light            | `#F3C56B` | Highlights, hover glow, active text on navy |
| `gold-400`  | Amber                  | `#E8862B` | Logo left-ribbon top, energy accents        |
| `gold-500`  | **MAP Gold (primary)** | `#D99A3C` | Primary buttons, key rules, brand accent    |
| `gold-600`  | Gold Deep              | `#B4761F` | Pressed states, gold-on-ivory text          |
| `blue-400`  | Ribbon Blue Light      | `#2E6BE0` | Links, focus rings, data accents            |
| `blue-500`  | **MAP Blue (primary)** | `#1E4FB0` | Primary brand blue, headings on light       |
| `blue-700`  | Blue Deep              | `#143174` | Gradients, portal chrome                    |
| `teal-400`  | Ribbon Teal Light      | `#37D3C6` | Positive status, teal accents               |
| `teal-500`  | **MAP Teal (primary)** | `#18B4AE` | Secondary actions, success, metrics         |
| `navy-950`  | Board Navy             | `#070C1E` | Hero/dark section ground                    |
| `navy-900`  | **MAP Navy (primary)** | `#0A1026` | Portal ground, footer, dark surfaces        |
| `navy-800`  | Navy Surface           | `#101A38` | Cards/panels on dark                        |
| `ivory-50`  | Ivory                  | `#F7F2E7` | Light ground, editorial sections            |
| `ivory-100` | Ivory Shade            | `#EFE7D6` | Dividers, subtle panels on ivory            |
| `ink-900`   | Wordmark Ink           | `#111418` | Wordmark/body on light                      |

### A.2 Neutral / functional ramp

| Token         | HEX       | Usage                   |
| ------------- | --------- | ----------------------- |
| `neutral-0`   | `#FFFFFF` | Max-contrast surfaces   |
| `neutral-100` | `#F2F3F5` | Portal app background   |
| `neutral-300` | `#D7DBE0` | Borders on light        |
| `neutral-500` | `#8A929C` | Muted text              |
| `neutral-700` | `#3C444F` | Secondary text on light |
| `neutral-850` | `#1C2430` | Borders on dark         |
| `neutral-900` | `#0F141B` | Deep UI text            |

### A.3 Semantic / status

| Token     | HEX                  | Notes                                  |
| --------- | -------------------- | -------------------------------------- |
| `success` | `#18B4AE` (MAP Teal) | Teal doubles as success — brand-native |
| `info`    | `#2E6BE0`            | Ribbon blue                            |
| `warning` | `#E8862B`            | Amber                                  |
| `danger`  | `#C0392B`            | Restrained red (functional necessity)  |
| `pending` | `#D99A3C`            | Gold                                   |

### A.4 Gradient relationships (brand-derived only)

| Token        | Definition                            | Use                                     |
| ------------ | ------------------------------------- | --------------------------------------- |
| `grad-brand` | `135° gold-300 → blue-500 → teal-500` | Mark's own logic; hero rules, CTA fills |
| `grad-warm`  | `135° gold-300 → gold-500`            | Gold wordmark, primary CTA              |
| `grad-cool`  | `135° blue-500 → teal-500`            | Portal headers, data viz                |
| `grad-navy`  | `180° navy-900 → navy-950`            | Dark section grounds                    |
| `grad-ivory` | `180° ivory-50 → ivory-100`           | Editorial grounds                       |

**Rule:** gradients interpolate only between brand hues, in the mark's amber→blue→teal order (or adjacent pairs). No generic purple/neon.

### A.5 Contrast pairs (WCAG AA target)

| Foreground | Background | Intent            |
| ---------- | ---------- | ----------------- |
| `ivory-50` | `navy-900` | AAA body          |
| `gold-300` | `navy-900` | AA large/headings |
| `ink-900`  | `ivory-50` | AAA body          |
| `blue-500` | `ivory-50` | AA body           |
| `ink-900`  | `gold-300` | AA buttons/icons  |

---

## B. TYPOGRAPHY SYSTEM

Direction: modern, premium, international, geometric-humanist. The wordmark's wide-tracked `HOLDING` and angular `A` inform the _tracking and geometry_ of headings — not a decorative face.

### B.1 Families

| Role                     | Recommendation                                 | Fallback stack                                     | Why                                            |
| ------------------------ | ---------------------------------------------- | -------------------------------------------------- | ---------------------------------------------- |
| Display / headings       | **Sora** (alt: `Fraunces` serif for editorial) | `system-ui, -apple-system, "Segoe UI", sans-serif` | Geometric, corporate, matches angular wordmark |
| Body / UI                | **Inter**                                      | `system-ui, -apple-system, "Segoe UI", sans-serif` | Exceptional legibility at UI density           |
| Numerals / data (portal) | **Inter** + `tabular-nums`                     | —                                                  | Aligned tables/metrics                         |
| Tagline / eyebrows       | Inter, uppercase, `letter-spacing: .18em`      | —                                                  | Mirrors `PEOPLE • RESOURCES • OPPORTUNITY`     |

Both are self-hostable open-source fonts; no runtime font-CDN dependency required.

### B.2 Hierarchy (fluid where sensible)

| Token           | Size (desktop → mobile) | Weight | Line-height | Tracking | Use             |
| --------------- | ----------------------- | ------ | ----------- | -------- | --------------- |
| `display-xl`    | 72 → 40px               | 600    | 1.05        | -0.02em  | Hero            |
| `display-l`     | 56 → 34px               | 600    | 1.08        | -0.02em  | Section openers |
| `h1`            | 48 → 30px               | 600    | 1.10        | -0.015em | Page title      |
| `h2`            | 36 → 26px               | 600    | 1.15        | -0.010em | Section         |
| `h3`            | 28 → 21px               | 600    | 1.20        | -0.005em | Card title      |
| `h4`            | 22 → 18px               | 600    | 1.25        | 0        | Sub-card        |
| `body-l`        | 18 → 17px               | 400    | 1.60        | 0        | Lead paragraphs |
| `body`          | 16 → 16px               | 400    | 1.60        | 0        | Default         |
| `body-s`        | 14 → 14px               | 400    | 1.55        | 0        | Captions/UI     |
| `caption`       | 12 → 12px               | 500    | 1.40        | 0.02em   | Meta            |
| `eyebrow`       | 12 → 11px               | 600    | 1.30        | 0.18em   | Tagline/labels  |
| `button`        | 15 → 15px               | 600    | 1.00        | 0.01em   | Buttons         |
| `nav`           | 15 → 15px               | 500    | 1.00        | 0.01em   | Navigation      |
| `portal-metric` | 32 → 26px               | 600    | 1.05        | -0.01em  | Dashboard KPIs  |

---

## C. DESIGN TOKENS

A single source of truth (`tokens/`) consumed by CSS custom properties, and later by any JS theme layer. Tokens only — no styled output in Phase 1.

### C.1 Color

`color.brand.*`, `color.neutral.*`, `color.semantic.*` as defined in **A**. Every component references tokens, never raw hex.

### C.2 Typography

`font.family.display|body|mono`, `font.size.*`, `font.weight.*`, `font.lineHeight.*`, `font.tracking.*` as in **B**.

### C.3 Spacing (4px base, 8px rhythm)

| Token      | px  |
| ---------- | --- |
| `space-1`  | 4   |
| `space-2`  | 8   |
| `space-3`  | 12  |
| `space-4`  | 16  |
| `space-5`  | 24  |
| `space-6`  | 32  |
| `space-7`  | 48  |
| `space-8`  | 64  |
| `space-9`  | 96  |
| `space-10` | 128 |
| `space-11` | 160 |

### C.4 Radius (controlled, restrained)

| Token         | px   | Use               |
| ------------- | ---- | ----------------- |
| `radius-xs`   | 4    | Inputs, tags      |
| `radius-sm`   | 6    | Buttons           |
| `radius-md`   | 10   | Cards on light    |
| `radius-lg`   | 16   | Panels            |
| `radius-xl`   | 24   | Hero media frames |
| `radius-full` | 9999 | Pills, avatars    |

Brand is _premium-editorial_, so default cards lean _squarer_ (`radius-md`), not pill-heavy.

### C.5 Shadows (restrained, navy-tinted)

| Token         | Value                             | Use                    |
| ------------- | --------------------------------- | ---------------------- |
| `shadow-1`    | `0 1px 2px rgba(10,16,38,.06)`    | Raised inputs          |
| `shadow-2`    | `0 4px 16px rgba(10,16,38,.08)`   | Cards                  |
| `shadow-3`    | `0 12px 32px rgba(10,16,38,.12)`  | Modals/overlays        |
| `shadow-gold` | `0 8px 28px rgba(217,154,60,.28)` | Primary CTA hover only |

### C.6 Borders

`border-w-hair .5px`, `border-w-1 1px`, `border-w-2 2px`; colors from `color.neutral.300` (light) / `color.neutral.850` (dark); brand emphasis via `border.gold`.

### C.7 Motion (see Section I)

`motion.duration.*`, `motion.ease.*`, `motion.distance.*`.

### C.8 Layout

| Token              | Value                                  |
| ------------------ | -------------------------------------- |
| `container-max`    | 1280px                                 |
| `container-narrow` | 880px (editorial/prose)                |
| `container-portal` | 1440px                                 |
| `gutter`           | 16 → 40px fluid                        |
| `grid-columns`     | 12 (desktop) / 8 (tablet) / 4 (mobile) |

---

## D. WEBSITE INFORMATION ARCHITECTURE (public)

```
/                         HOME
/about                    ABOUT (story, vision, mission, philosophy, global position)
/business-areas           BUSINESS AREAS (index)
/business-areas/[slug]    Business-area detail (data-driven)
/projects                 PROJECTS / OPPORTUNITIES (index, filterable)
/projects/[slug]          Project detail
/partnerships             PARTNERSHIPS
/contact                  CONTACT
/client-portal            CLIENT PORTAL entry (auth-gated downstream)
/founding-partners        FOUNDING PARTNERS (protected/private experience)
/legal/privacy  /legal/terms  /legal/cookies
/404
/sitemap.xml  /robots.txt
```

**Page intent**

| Route                    | Purpose                                                                                                                     | Primary components                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `/`                      | Cinematic hero + `PEOPLE • RESOURCES • OPPORTUNITY`; group intro; business-area grid; featured projects; global vision; CTA | `HeroCinematic`, `PillarStrip`, `BusinessAreaGrid`, `ProjectCard`, `StatBand`, `CTA` |
| `/about`                 | Story, vision, mission, philosophy, global positioning (structured placeholders where facts are not yet supplied)           | `EditorialLayout`, `Timeline`, `QuotePanel`                                          |
| `/business-areas`        | Premium grid of the group's sectors                                                                                         | `BusinessAreaGrid`, `FilterBar`                                                      |
| `/business-areas/[slug]` | Sector detail: overview, capabilities, related projects/opportunities                                                       | `ImagePanel`, `ProjectCard`, `OpportunityCard`                                       |
| `/projects`              | Projects & investment/strategic opportunities, data-driven                                                                  | `FilterBar`, `ProjectCard`, `OpportunityCard`, `EmptyState`                          |
| `/projects/[slug]`       | Project detail: narrative, gallery, status, opportunity info                                                                | `ImageGallery`, `StatBand`, `StatusBadge`                                            |
| `/partnerships`          | Strategic-partnership positioning                                                                                           | `EditorialLayout`, `LogoMarquee`                                                     |
| `/contact`               | Professional business contact experience                                                                                    | `ContactForm`, `MapPanel`                                                            |
| `/client-portal`         | Premium entry into private environment                                                                                      | `AuthEntryPanel` (UI only in Phase 1)                                                |
| `/founding-partners`     | Separate protected experience                                                                                               | `AuthEntryPanel` (distinct namespace)                                                |

**Business-area taxonomy (presentation-neutral; no fabricated claims):** Gold/Mining · Gold-area Rental · Real Estate · Lithium · Cement · Waste-to-Energy · Basalt · International Solar/PV · Oil Machinery · Technology · AI Products & Services · AI Agents · Security/Fraud Detection · Affiliate/Merchandising · Autonomous Drones/Robotics · Future Ventures.

---

## E. CLIENT PORTAL ARCHITECTURE (private)

Distinct app shell from the public site, at `/client-portal/*`, sharing brand tokens.

```
/client-portal                  Dashboard
/client-portal/applications     Applications (list)
/client-portal/applications/[id] Application detail
/client-portal/projects         Projects
/client-portal/projects/[id]    Project detail
/client-portal/documents        Documents
/client-portal/messages         Messages
/client-portal/notifications    Notifications
/client-portal/profile          Profile
/client-portal/settings         Settings
```

**Founding Partners** lives in a **separate namespace** (`/founding-partners/*`) with its own gated shell, because its audience, data scope and information density differ from the general client portal.

**Portal index**

| Route              | Content                                      | Key components                                             |
| ------------------ | -------------------------------------------- | ---------------------------------------------------------- |
| Dashboard          | KPIs, recent activity, reminders, next steps | `PortalMetric`, `ActivityFeed`, `PortalCard`, `EmptyState` |
| Applications       | List + status filters                        | `DataTable`, `StatusBadge`, `FilterBar`                    |
| Application detail | Stage tracker, submitted docs, timeline      | `Stepper`, `DocumentList`, `Timeline`                      |
| Projects           | Portfolio the client is party to             | `PortalCard`, `ProjectCard`, `StatusBadge`                 |
| Documents          | Downloads, categories                        | `DataTable`, `DocumentList`                                |
| Messages           | Threaded comms                               | `MessageThread`, `Composer`                                |
| Notifications      | System + human events                        | `ActivityFeed`                                             |
| Profile            | Identity, company linkage                    | `FormSection`, `AvatarPanel`                               |
| Settings           | Prefs, access, notifications                 | `FormSection`, `Toggle`                                    |

**Portal shell:** persistent left rail (collapsible), top bar with search + notifications + account, content region on `container-portal`. Visual system is the _same brand_, but denser and more operational than the editorial public site (see Section 16 alignment).

---

## F. COMPONENT ARCHITECTURE (reusable inventory)

**Layout / chrome:** `Container` · `Section` · `Grid` · `Stack` · `Divider` · `Rule` (brand gradient rule).

**Navigation:** `Header` · `PrimaryNav` · `MegaMenu` (Business Areas) · `MobileNav` (drawer) · `Breadcrumbs` · `Footer` · `FooterColumns` · `LegalBar`.

**Hero / marketing:** `HeroCinematic` (video/poster) · `PillarStrip` (PEOPLE/RESOURCES/OPPORTUNITY) · `SectionHeader` · `EyebrowLabel` · `StatBand` · `Timeline` · `QuotePanel` · `LogoMarquee` · `CTASection` · `ImagePanel` · `ImageGallery`.

**Cards:** `BusinessAreaCard` · `ProjectCard` · `OpportunityCard` · `PortalCard` · `MetricCard`.

**Forms & controls:** `Button` (primary/secondary/ghost/link) · `IconButton` · `Input` · `Textarea` · `Select` · `Checkbox` · `RadioGroup` · `Toggle` · `FileDropzone` · `FormSection` · `FormField` (label/help/error) · `ContactForm`.

**Feedback & state:** `Badge` · `StatusBadge` · `Tag` · `Toast` · `Banner` · `Modal` · `Drawer` · `Tooltip` · `Skeleton` (loading) · `EmptyState` · `ErrorState` · `Spinner` · `Pagination`.

**Portal-specific:** `PortalShell` · `PortalRail` · `PortalTopBar` · `PortalNav` · `DataTable` · `ActivityFeed` · `MessageThread` · `Composer` · `Stepper` · `DocumentList` · `NotificationItem` · `AvatarPanel`.

**Media:** `ResponsiveImage` · `VideoPlayer` · `VideoHero` · `PosterFrame`.

Each component is brand-token driven, accessibility-first (semantic element + ARIA where needed), and states (`:default :hover :focus-visible :active :disabled`) are part of the component contract.

---

## G. CONTENT MODEL (data-first, presentation-agnostic)

Content lives in typed data/collections, **not** hard-coded in layouts. No fabricated data — schemas only.

### G.1 BusinessArea

```
id            slug
name          string
tagline       string
description   rich text
image         asset ref
category      enum (sector taxonomy)
status        enum: active | developing | future
capabilities  string[]
projects      ref[] -> Project
opportunities ref[] -> Opportunity
cta           { label, href }
order         number
```

### G.2 Project

```
id            slug
title         string
category      ref -> BusinessArea (or sector enum)
location      { country, region, display }
summary       string
description   rich text
media         { hero, gallery[] }
status        enum: concept | development | active | delivered
opportunity   ref -> Opportunity | null
metrics       { label, value, unit }[]   // only when factual
partners      ref[] -> Partner
order         number
```

### G.3 Opportunity

```
id            slug
title         string
category      ref -> BusinessArea
description   rich text
status        enum: open | reviewing | closed | future
eligibility   string[]
cta           { label, href }
visibility    enum: public | client | founding-partner
```

### G.4 Supporting entities

`Partner` (name, logo, relationship, link) · `Document` (title, type, size, ref, visibility) · `Application` (stages, submitted docs, timeline) · `Message` (threads) · `Notification` · `UserProfile` (portal).

Content/render separation: renderers consume these shapes; swapping a CMS in later changes only the data adapter.

---

## H. RESPONSIVE STRATEGY

**Breakpoints:** `sm 480` · `md 768` · `lg 1024` · `xl 1280` · `2xl 1536` (desktop-first design intent, mobile-first implementation).

| Element     | Desktop (≥1024)                       | Tablet (768–1023)          | Mobile (<768)                              |
| ----------- | ------------------------------------- | -------------------------- | ------------------------------------------ |
| Navigation  | Full nav + mega menu                  | Condensed nav              | Hamburger → full-screen drawer             |
| Hero        | Split/asymmetric w/ video, large type | Reduced type, video→poster | Stacked, poster-first, largest tap targets |
| Typography  | Full fluid scale                      | Mid scale                  | `display-xl`→40, `h1`→30, body stays 16    |
| Grids       | 12-col, 3–4 cards                     | 8-col, 2 cards             | 4-col, 1 card                              |
| Cards       | Image-led horizontal                  | Compressed                 | Vertical, image top                        |
| Portal rail | Persistent rail                       | Icon rail                  | Off-canvas drawer                          |
| Tables      | Full columns                          | Priority columns           | Card-per-row transform                     |
| Forms       | 2-col                                 | 2-col                      | 1-col, 44px min targets                    |
| Images      | Art-directed crops (`<picture>`)      | Re-crop                    | Square/portrait crop                       |

Mobile is designed first for content priority, not shrunk desktop.

---

## I. MOTION STRATEGY (premium, restrained)

**Tokens**

| Token             | Value                      |
| ----------------- | -------------------------- |
| `duration-fast`   | 150ms                      |
| `duration-base`   | 240ms                      |
| `duration-slow`   | 420ms                      |
| `duration-reveal` | 700ms                      |
| `ease-standard`   | `cubic-bezier(.2,.6,.2,1)` |
| `ease-entrance`   | `cubic-bezier(.16,1,.3,1)` |
| `ease-exit`       | `cubic-bezier(.4,0,1,1)`   |

**Allowed**

- Subtle fade + controlled rise on scroll-in (IntersectionObserver, staggered ≤ 80ms).
- Slow image reveal (mask/scale 1.04→1.0) inside `PosterFrame`.
- Gentle parallax on hero imagery only (translateY ≤ 8%).
- Hover transitions: elevation + subtle gold glow on primary CTA; image zoom ≤ 1.03.

**Forbidden:** bounce/spring overshoot, flashing, auto-playing marquees that can't pause, motion that blocks reading, parallax on body text.

**Reduced motion:** `prefers-reduced-motion: reduce` disables transforms/parallax and reduces durations to ~0; content appears instantly. This is a hard requirement, not optional.

---

## J. VIDEO STRATEGY

Supported placements: homepage hero, business-area headers, project presentations, brand film, opportunity presentations.

Architecture:

- `VideoHero` renders a **poster first** (LCP is the poster image, never the video).
- Sources: `webm` (VP9/AV1) + `mp4` (H.264) via `<video>` with `<source>`; `muted · playsinline · loop · autoplay` only for _decorative_ hero, and only after `prefers-reduced-motion`/connection checks.
- `preload="none"` + lazy attach on intersection; play only when visible, pause when off-screen or tab hidden.
- Text/captions overlay always rendered in HTML (never baked into video) for a11y + SEO.
- Above-the-fold decorative video exempt from autoplay when `saveData` or reduced-motion is set — falls back to poster.
- Long-form (brand film) uses a user-initiated player with controls and captions (VTT).

Performance guardrails: max hero video ~ 2–4MB, ≤1080p, short loop; never blocks first paint.

---

## K. PERFORMANCE STRATEGY

| Area        | Approach                                                                                                                                                                   |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rendering   | Static-first / SSG for public pages; minimal client JS; islands for interactive widgets                                                                                    |
| Images      | AVIF/WebP with `<picture>` fallbacks, responsive `srcset`/`sizes`, explicit width/height to prevent CLS, `loading="lazy"` below fold, `fetchpriority="high"` for LCP image |
| Video       | Poster-first, lazy, connection-aware (see J)                                                                                                                               |
| Fonts       | Self-hosted, `font-display: swap`, subset to used glyphs, preload the primary display weight only                                                                          |
| CSS         | Token-driven, critical CSS inlined for the shell, no unused utility bloat                                                                                                  |
| JS          | Code-split per route; portal app lazy-loads its shell; no heavy chart lib until needed                                                                                     |
| Caching     | Immutable hashed assets, long-lived; HTML revalidated                                                                                                                      |
| Budgets     | LCP < 2.5s, CLS < 0.1, INP < 200ms on mid-tier mobile; per-route JS budget tracked                                                                                         |
| Measurement | Lighthouse CI in the pipeline (introduced in a later phase, not Phase 1)                                                                                                   |

---

## L. ACCESSIBILITY STRATEGY

- Semantic landmarks: `header/nav/main/section/article/aside/footer`; one `h1` per page; logical heading order.
- Full keyboard operability; visible `:focus-visible` ring using `blue-400` (≥3:1 against ground).
- Contrast: AA minimum (AAA for body where possible) per Section A.5.
- `aria-*` only where native semantics are insufficient (menus, modals, tabs, live regions).
- Modals/drawers: focus trap, `Esc` to close, restore focus on close.
- Forms: programmatic labels, `aria-describedby` for help/error, error text tied to field, no color-only signaling.
- Media: meaningful `alt` (empty `alt` for decorative), captions/transcripts for video.
- Motion & time: honor `prefers-reduced-motion`; no time-limited interactions.
- Target sizes ≥ 44×44px; touch targets spaced to avoid mis-taps.

---

## M. SEO STRATEGY

- **Titles/descriptions:** templated per route (`MAP Holding — {Page} | People · Resources · Opportunity`), unique descriptions, ≤ 60/155 chars.
- **Clean URLs:** `/business-areas/gold-mining`, `/projects/{slug}` — stable, lowercase, hyphenated (mirrors route map D).
- **Metadata layer:** a single `head`/SEO component consuming per-page front-matter (title, description, canonical, OG, Twitter).
- **Open Graph / social:** per-page OG image (brand template: navy ground, gold rule, title) + Twitter `summary_large_image`.
- **Structured data:** `Organization` on home, `BreadcrumbList` on nested routes, `WebSite` + `SearchAction` if search ships.
- **Crawl:** generated `sitemap.xml`, `robots.txt`, canonical tags, `hreflang` reserved for future locales.
- **Content semantics:** descriptive headings, real text for indexable content (never text-baked-into-image).
- **Founding-partners/portal:** `noindex` — private surfaces never indexed.

---

## N. TECH STACK (recommended, with reasoning)

Chosen for premium marketing performance **and** a business-grade portal, without over-engineering.

| Layer                  | Recommendation                                                             | Reasoning                                                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework              | **Next.js (App Router) + TypeScript**                                      | SSG/ISR for the public site (fast, SEO) and a real app shell for the portal in one codebase. Widely supported.                                                |
| Styling                | **CSS Modules + CSS custom-property design tokens** (Tailwind optional)    | Tokens give a single brand source of truth; CSS Modules keep editorial styling readable. Avoid committing to a utility framework until component work begins. |
| Content/data (Phase-1) | **Typed local data** (`/content` JSON/MDX + TS types)                      | Ships the IA with zero backend; fits "no fake backend."                                                                                                       |
| Content (future)       | Headless CMS adapter behind the same types                                 | Swap in later without touching renderers (see G).                                                                                                             |
| Backend/API (future)   | Route handlers / server actions + a REST/GraphQL API boundary              | Clean seam for applications, documents, messaging; not built in Phase 1.                                                                                      |
| Auth (future)          | Provider-agnostic (e.g., Auth.js/NextAuth-style) behind an `auth` boundary | Role scope: visitor / prospect / client / partner / internal (Section 10). Not built in Phase 1.                                                              |
| Images/video           | Framework image pipeline + native `<video>` (Section J/K)                  | Responsive, modern formats, poster-first.                                                                                                                     |
| Hosting (future)       | Static-edge + server functions (e.g., Vercel-class)                        | Matches SSG+portal split; not configured in Phase 1.                                                                                                          |
| Quality                | ESLint + Prettier + TypeScript strict; accessibility linting               | Consistency and a11y from day one.                                                                                                                            |

Explicitly **not** added in Phase 1: database, auth provider, CMS, AI backend, analytics, deployment config. Each is a clean future boundary.

---

## O. PROJECT STRUCTURE (proposed directory tree)

```
MAP HOLDING/
├─ docs/
│  └─ PHASE-1-ARCHITECTURE.md        # this proposal
├─ public/
│  ├─ brand/                         # logo lockups (dark/light/horizontal), app icons
│  ├─ imagery/                       # pillar + sector imagery
│  ├─ video/                         # posters + sources (future)
│  └─ fonts/                         # self-hosted Sora + Inter
├─ [app]/                            # created in a LATER phase (Next App Router)
│  ├─ (marketing)/                   # home, about, business-areas, projects, partnerships, contact
│  ├─ (portal)/client-portal/        # private client portal
│  └─ (portal)/founding-partners/    # separate protected experience
├─ [src]/
│  ├─ components/                    # Section F inventory
│  │  ├─ layout/  navigation/  marketing/  cards/  forms/
│  │  ├─ feedback/  portal/  media/
│  ├─ styles/
│  │  ├─ tokens/                     # color, type, space, radius, shadow, motion
│  │  └─ base/                       # reset, globals
│  ├─ content/                       # business areas, projects, opportunities (typed)
│  ├─ lib/                           # content adapters, seams for future API/auth
│  └─ types/                         # Section G models
└─ (config files created in build phase)
```

_(Brackets `[app]`/`[src]` indicate planned directories — not created during Phase 1.)_

---

## P. IMPLEMENTATION ROADMAP (sequential)

1. **Phase 1 — Architecture (this doc).** Await approval. _No code._
2. **Phase 2 — Brand foundation in code.** Export logo lockups + app icons from the board; author `styles/tokens/*`; base reset/globals; font loading; a private token/component gallery page for validation.
3. **Phase 3 — Public shell.** App shell, `Header`/`Footer`/`MobileNav`, `Container`/`Section`/`Grid`, buttons, typography primitives. No marketing content yet.
4. **Phase 4 — Home.** Cinematic hero (poster-first, video-ready), pillar strip, business-area grid, featured projects, CTA.
5. **Phase 5 — Business Areas.** Content model + index + detail templated from data.
6. **Phase 6 — Projects/Opportunities.** Filterable index + detail; opportunity visibility model.
7. **Phase 7 — About / Partnerships / Contact.** Editorial layouts, form UI (front-end only), SEO/metadata layer.
8. **Phase 8 — Portal shell (client).** Gated shell, dashboard, applications, documents, messages, profile, settings using mock typed data behind the auth seam.
9. **Phase 9 — Founding Partners.** Separate namespace + gated shell.
10. **Phase 10 — Backend boundaries.** Wire API/auth/CMS behind existing seams (only when approved).

---

## Q. FIRST IMPLEMENTATION STEP (after approval)

**Phase 2, step 1 — Brand foundation, not pages:**

1. Create `public/brand/` and export the exact lockups from the board: `logo-primary.svg` (dark), `logo-light.svg` (ivory), `logo-horizontal.svg`, `icon-navy|ivory|gold.svg`, plus PNG fallbacks and `favicon`.
2. Create `src/styles/tokens/` with `color.css`, `type.css`, `space.css`, `radius.css`, `shadow.css`, `motion.css`, `layout.css` — values exactly as in Sections A–C.
3. Create `src/styles/base/reset.css` + `globals.css` wiring tokens and fonts.
4. Render a throwaway **tokens gallery** route to visually validate palette, type scale, spacing, gradients and states against the board.

No marketing pages, no portal, no routing tree, no data model, no auth yet. This step proves the brand system in real code before anything is built on top of it.

---

## PHASE 1 HARD STOP — CONFIRMED

- No pages, components, routes, database, auth, API integrations or deployment config were created.
- No dependencies were installed. Nothing was deployed. No unrelated projects were touched.
- No DCV / Agnes / Commander / A14 code, terminology or assumptions were referenced.
- The only artifact produced is this architecture proposal, in `docs/PHASE-1-ARCHITECTURE.md`.

**MAP HOLDING — PEOPLE • RESOURCES • OPPORTUNITY** — awaiting approval to begin Phase 2.
