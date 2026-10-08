# MAP HOLDING — PHASE 3: PUBLIC SHELL, 3D HERO EXPERIMENT, ACCESS ARCHITECTURE

> **Status:** Phase 3 deliverable — implemented, validated, awaiting approval.
> **Not built in this phase:** the complete website, business-area content, the client
> portal UI, authentication, APIs, a database, deployment. Phase 3 is the shell, the
> 3D experiment and the access architecture, and nothing beyond that.
>
> Predecessors: `docs/PHASE-1-ARCHITECTURE.md`, `docs/PHASE-2-BRAND-FOUNDATION.md`.
> Companion: `docs/ACCESS-CONTROL-ARCHITECTURE.md`.

Brand statement: **PEOPLE • RESOURCES • OPPORTUNITY**

---

## 1. WHAT THIS PHASE IS

Phase 2 proved the brand system. Phase 3 builds the first real structural layer of the
public website on top of it, and settles the client/internal boundary before any backend
exists.

Twelve deliverables, per the brief:

| #   | Deliverable                     | Where                                                                     |
| --- | ------------------------------- | ------------------------------------------------------------------------- |
| 1   | Public website shell            | `src/app/(public)/layout.tsx`, `src/components/navigation/SiteShell.tsx`  |
| 2   | Header                          | `src/components/navigation/Header.tsx`                                    |
| 3   | Primary navigation              | `src/components/navigation/PrimaryNav.tsx`                                |
| 4   | Mobile navigation               | `src/components/navigation/MobileNav.tsx`                                 |
| 5   | Footer                          | `src/components/navigation/Footer.tsx`                                    |
| 6   | Legal / navigation structure    | `LegalBar.tsx`, `FooterColumns.tsx`, `/legal/[slug]`                      |
| 7   | Public page scaffolding         | `src/components/page/PageScaffold.tsx` + five routes                      |
| 8   | 3D hero experiment              | `src/components/media/Hero3D.tsx`, `hero-shader.ts`, `Hero3DFallback.tsx` |
| 9   | Client vs internal architecture | `src/lib/access/index.ts`                                                 |
| 10  | Portal boundary contracts       | same                                                                      |
| 11  | Live development preview        | `next dev` on port 3100                                                   |
| 12  | Automated validation            | `npm test`, browser harness, `tsc` / `eslint` / `prettier` / `next build` |

---

## 2. THE SHELL

```
SkipLink → <header> (banner) → <main id="main-content"> → <footer> (contentinfo)
```

`SiteShell` is one component used by both route groups, so the public group and the
gated group cannot drift apart while they share the same brand chrome. When the portal
grows its own shell, it replaces its own layout's use of `SiteShell` — it does not fork it.

**Skip link and the focus target.** `<main id="main-content">` deliberately has **no**
`tabIndex="-1"`. Modern browsers set the sequential focus navigation starting point at a
fragment target, so the next `Tab` after activating the skip link lands inside `<main>`.
Adding `tabIndex="-1"` would make the whole page region a focus target and draw a
page-wide focus ring. This is asserted in the browser tests, not assumed:

```
first Tab stop:  "Skip to main content"  href="#main-content"
                 outline 2px solid rgb(31,116,218)   revealed: true
hash after activation: #main-content
next Tab target: A → inMain: true, text "Home"
```

### Design discipline

The header is the approved `horizontal-dark` lockup on the approved MAP Navy ground, one
hairline divider, a compact nav row, and a single restrained CTA. No glass panel, no blur,
no floating pill, no oversized masthead. The `Section` primitive supplies the navy ground
**and** the dark-theme token re-pointing, so nothing in the shell duplicates the theming
that already exists in the brand foundation.

---

## 3. NAVIGATION

### Desktop

Six items from `src/content/navigation.ts`: Home · About · Business Areas · Projects ·
Partnerships · Contact. A right-aligned _Client Portal_ outline button.

The current destination is marked by **three** independent signals, never colour alone:
`aria-current="page"`, a medium font weight, and the brand-gradient indicator bar.

### Mobile drawer (below `lg` = 1024px)

Implemented behaviour, all verified in the browser:

| Requirement                   | Verified result                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| Toggle exposes state          | `aria-expanded="false" → "true"`, `aria-controls` matches the dialog id, `aria-haspopup="dialog"`         |
| Dialog semantics              | `role="dialog"`, `aria-modal="true"`, `aria-label="Site navigation"`                                      |
| Focus enters the dialog       | Focus is on the panel (`tabIndex="-1"`) on open                                                           |
| Tab reaches the first control | `Tab` → first nav link ("Home")                                                                           |
| Focus trap                    | `Shift+Tab` from the first control wraps to the last ("Client Portal")                                    |
| `Escape` closes               | Dialog removed, `aria-expanded="false"`                                                                   |
| Focus restoration             | `document.activeElement ===` the toggle after close                                                       |
| Body scroll handling          | `documentElement.style.overflow === "hidden"` while open, restored on close, scrollbar gutter compensated |
| Closes on navigation          | Tapping "Projects" navigates and removes the drawer, scroll unlocked                                      |
| Touch target                  | Toggle is 44 × 44 px                                                                                      |
| Responsive breakpoint         | Drawer serves tablet _and_ mobile below 1024px                                                            |
| Resize to desktop             | A `matchMedia` listener dismisses the drawer so the scroll lock cannot outlive the layout                 |

**One deviation, documented:** Phase 1 §H describes a "condensed nav" for tablet. Rather
than invent a third variant, the drawer serves both tablet and mobile. The breakpoint
follows the Phase 1 system (`lg` 1024).

### No dead links

Every destination in the nav and footer exists as a real route. Where editorial content
has not been supplied, the route renders a controlled placeholder — it is never a
`#`-link and never a 404.

---

## 4. FOOTER

Navy ground: a brand column, grouped navigation, and a legal bar.

Contains only what MAP Holding has actually supplied — the approved lockup, the brand
statement, and the navigation structure. Everything not yet supplied is an explicit,
visibly marked placeholder:

- **Corporate details** — registered office address, telephone number, general enquiries
  email, legal entity name and registration number, all listed as outstanding. **No
  address, telephone number, email address or registration number is invented anywhere in
  this project.**
- **Group descriptor** — reserved, not fabricated.
- **Copyright** — limited to the copyright convention (`© {year} MAP Holding. All rights
reserved.`). No legal claim beyond that.

The footer also states the access split in public: the client portal and founding partners
are _distinct gated environments_, not one login.

Heading structure: a visually-hidden `<h2>Footer</h2>`, then `<h3>` for each column title,
so the document outline stays strictly descending — the same rule the Phase 2 gallery is
held to.

---

## 5. PAGE SCAFFOLDING

Five routes plus home, all rendering through one `PageScaffold` component driven by
`src/content/pages.ts`. One shared component is the point: it guarantees all six routes
exercise the _same_ shell, type scale, section rhythm, imagery slots and heading outline,
rather than six hand-written approximations of it.

Each section states what it will contain and lists the named content MAP Holding still has
to supply. Empty regions use `EmptyState`, so a reviewer always sees _why_ a region is
empty.

**No fabricated business claims.** The `heading` values are structural section names; the
`note` values describe the site structure, never the business. There is no invented
project, sector, partner, statistic or date.

Imagery slots reserve their aspect ratio at layout time, so dropping real photography in
later causes no layout shift.

### Legal routes

`/legal/[slug]` serves `privacy`, `terms` and `cookies` via `generateStaticParams`, with
`dynamicParams = false`, so anything else is a genuine 404. **No legal text is written.**
Each route lists what the document must cover — effectively a brief for counsel — because
inventing a privacy notice or terms of use would be a fabricated legal claim.

---

## 6. THE 3D HERO EXPERIMENT

### 6.1 Technology decision — no 3D library was installed

| Option                                         | Verdict                                                                                                                                                                                                                    |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **three.js + @react-three/fiber**              | **Rejected.** ~600 KB minified before the React binding, for a single decorative object, on a machine at 99% disk. Two competing libraries were never considered.                                                          |
| **CSS 3D transforms**                          | **Rejected.** Cannot express a curved swept surface, cannot do real lighting, and has no reflection model. The brief asks for realistic lighting, premium materials and soft reflections — CSS 3D can supply none of them. |
| **SVG**                                        | **Rejected for the animated layer** for the same reasons. **Adopted for the static fallback**, where realism is not required.                                                                                              |
| **Raw WebGL2 + a hand-written SDF raymarcher** | **Chosen.**                                                                                                                                                                                                                |

**Why raw WebGL2 is genuinely justified here.** The requirement is real 3D: perspective-
correct depth, surface normals, specular highlights, Fresnel rim light and reflection. A
signed-distance-field raymarcher in a single full-screen fragment shader delivers all of
it, and:

- added runtime dependency surface: **0 packages, 0 bytes**;
- the vertex shader is one line; the fragment shader is ~120 lines of GLSL shipped as a
  string inside the existing JS bundle;
- one full-screen triangle is the cheapest possible draw call, and SDF raymarching handles
  a curved, continuously-varying band — exactly the subject here;
- performance is bounded by construction (see 6.3).

### 6.2 What it renders, and brand discipline

An abstract ribbon following a four-stroke ascending/descending path, displaced along Z so
its normals vary continuously and it reads as a flowing surface in space rather than a
cut-out. Shot with a very slow orbit (period ≈ 2 minutes) and a breathing dolly.

It is **atmospheric brand visualisation**: evocative of the mark's motion, and explicitly
not a redrawing of the logo. The official lockup remains the approved asset rendered by
`Logo`. The host element is `aria-hidden`; the hero's heading carries the meaning.

The material is brushed metal carrying the mark's own amber → blue → teal order, lit by a
warm-neutral studio environment with a warm key, a neutral fill and a weak cool rim.

> The environment is deliberately **warm-neutral, not blue-dominant**. That was a
> _measured_ defect rather than a taste call: a strongly cool environment multiplies the
> amber end of the gradient into a desaturated yellow, and the primary brand colour stops
> reading. Measured after the fix, across the ribbon's own lit pixels: amber 31–79%,
> teal 11–53%, with the blue mid-band reading darkest — which is physically correct, since
> blue is the darkest brand hue.

### 6.3 Performance

| Requirement            | Implementation                                                                                                                                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lazy / controlled init | The canvas element **does not exist until the hero scrolls into view**; initialisation is then deferred to `requestIdleCallback` (timer fallback)                                                                             |
| Does not block load    | The server-rendered static fallback is the LCP element; the canvas is created after hydration and after first paint                                                                                                           |
| Static fallback        | `Hero3DFallback` — pure CSS/SVG, server-rendered, no JavaScript, no filters, no animation                                                                                                                                     |
| Absolute pixel budget  | Render target capped at **430,000 pixels** regardless of display size, so a 4K screen cannot cost 4K of raymarching                                                                                                           |
| DPR clamp              | `min(devicePixelRatio, 1.5)`                                                                                                                                                                                                  |
| Adaptive quality       | One-way degradation: if the rolling frame time exceeds 26 ms, march steps fall toward 44 and render scale toward 0.45. **Observed degrading** under a software rasteriser: `steps 128→96`, `scale 0.72→0.61`                  |
| GPU discipline         | No depth or stencil buffers, no MSAA, one draw call. A second ray march for a "floor reflection" was **removed after measurement** — it hit the ribbon on 0.0–0.1% of pixels while doubling march cost for every downward ray |
| Pauses when unseen     | `IntersectionObserver` stops the loop off-screen; `visibilitychange` stops it on a hidden tab                                                                                                                                 |
| Context loss           | `webglcontextlost` is handled: the loop stops and the static fallback shows                                                                                                                                                   |
| Graceful degradation   | If WebGL2 is absent, or the shader fails to compile or link, the canvas is never attached and the page is unaffected                                                                                                          |
| Observability          | `data-hero3d-state`, `data-hero3d-steps` and `data-hero3d-scale` expose the live state, so degradation is inspectable rather than invisible                                                                                   |

### 6.4 Fallback and reduced motion — verified

**Reduced motion** (`prefers-reduced-motion: reduce`): the hero paints **exactly one** frame
at a fixed composition time and never starts the loop.

```
state under reduced motion: reduced
frames differ: no (effectively static)
motion tokens:  reveal=.01ms  base=.01ms  distance-md=0  stagger=0s  scrollBehaviour=auto
```

**No WebGL** (launched with `--disable-webgl --disable-webgl2 --disable-3d-apis`): the
canvas is never created at all, the static visual remains, and the page is fully usable.

```
info:        { state: "fallback", webgl2: false, canvas: null, fallbackSvg: true }
page usable: { scrollHeight: 4250, h1: "MAP Holding", navLinks: 6,
               footerLinks: 10, primaryButtons: 1, canvas: false }
```

### 6.5 Mobile behaviour

The camera distance adapts to the aspect ratio (`fit = clamp(1.55 / aspect, 1.0, 2.6)`).
This is another **measured fix**: on the phone-sized hero (render canvas ≈ 0.74 aspect) the
ribbon's amber end fell outside the frame, so the gradient rendered as blue and teal only.
A gentle roll (≤ 7°, applied only on tall frames) keeps the band from reading as a thin
stripe across the middle. Measured after the fix, portrait frames retain amber across
4.9–79% of lit ribbon pixels.

### 6.6 How the 3D was verified without being able to see it

Three independent methods, because "it looks fine" is not evidence:

1. **A CPU replica of the shader's geometry** (a harness artifact, not project code)
   raymarched the same SDF on the CPU. Result: 18–23% of rays hit the ribbon at every
   camera phase and at 16:9, square and portrait aspects; the hit rate is independent of
   step count down to 32 steps.
2. **An isolated GPU test** that imports the real shader source from the project, compiles
   it in the page, renders off-screen and reads the pixels back. Result: compiles, links,
   every uniform resolves, `glError 0`, and `uSteps` demonstrably changes the output
   (`steps=0` → max luminance 0.171; `steps=128` → max 0.67).
3. **Pixel analysis of the real composited page** via CDP screenshots, classifying hue.

Method 3 caught both real shader defects (amber cropped to 0% on portrait; the amber end
desaturating under a cool environment) and is how the amber/teal/blue split was measured.

### 6.7 A harness limitation worth recording

Headless Chrome produces **no frames of its own** — measured: `requestAnimationFrame`
stalled at **0 ticks in 1000 ms** — so `IntersectionObserver` callbacks are not delivered
and the hero never initialised. Forcing a single frame made the observer fire immediately.
The fix was to start a CDP screencast, which keeps the compositor producing frames. This is
a property of headless rendering, not of the site: a visible tab produces frames
continuously. Two earlier "the 3D is broken" readings were artifacts of this and of
measurement thresholds, and are documented here so the same false signals are not chased
again.

---

## 7. CLIENT / INTERNAL ACCESS ARCHITECTURE

Full document: **`docs/ACCESS-CONTROL-ARCHITECTURE.md`**. Contract:
`src/lib/access/index.ts`. Executable proof: `src/lib/access/access.test.ts`.

**Principals** — `anonymous` · `client` · `partner` · `staff` · `admin` · `owner`.
A client is never an owner, an administrator, an internal user or a founding partner merely
by being authenticated.

**Visibility classes** — `public` · `client` · `partner` · `internal` · `admin` ·
`confidential`. `internal`, `admin` and `confidential` are `NEVER_CLIENT_REACHABLE`.

**Clearance ceilings** — the mechanism that makes "logged in ⇒ sees everything"
structurally impossible:

| kind       | ceiling        |
| ---------- | -------------- |
| anonymous  | `public`       |
| **client** | **`client`**   |
| partner    | `partner`      |
| staff      | `internal`     |
| admin      | `admin`        |
| owner      | `confidential` |

Authorization requires **both** clearance **and** (ownership ‖ live grant). Clearance is
tested first, so ownership and grants can never lift a principal above its ceiling. In
particular an explicit grant cannot raise a client into `internal` or above, and a plain
client is denied a `founding-partner` record **even when it owns it**.

`staff` and `admin` do not reach `confidential`; only `owner` does, guarded by a second
independent check.

**Founding Partners** is an _entitlement_ (`entitlements: ["founding-partner"]`), not a
principal kind and not a visibility class — so it is never inferred from identity, can be
revoked, and is additive only.

The forbidden pattern is named in the contract itself:

```ts
// NEVER DO THIS
if (user.loggedIn) return everything();
```

### Documented at the type level, not just in prose

```ts
export type ClientVisibleResource = AccessControlledResource & {
  visibility: "public" | "client";
};

type ClientVisibleLeaks = Extract<ClientVisibleResource["visibility"], NeverClientReachable>;
const CLIENT_VISIBLE_IS_SEALED: ClientVisibleLeaks extends never ? true : false = true;
```

If anyone ever widens the client-visible union to include `internal`, `admin` or
`confidential`, **`tsc --noEmit` fails the build**. "Clients must never see internal data"
is a build error, not a convention.

**No fake backend.** No authentication, no sessions, no database, no API routes, no fake
login form, no fake confidential report, no fake client data. The fixtures live only inside
the test file.

### The gated routes

`/client-portal` and `/founding-partners` are **publicly routable entry points** in this
phase — there is no authentication — but they sit in a separate route group `(gated)` so
that the future portal shell replaces that group's shell rather than retro-fitting the
public one, and so nothing in the group is ever indexed (`noindex, nofollow`).

They render the access architecture **generated from the contract itself**: the matrix on
the page is produced by calling `canReachVisibility()` over the real `PRINCIPAL_KINDS` and
`VISIBILITY_LEVELS` exports, not typed out by hand. If a clearance ceiling ever changes,
the page changes — and the test suite fails.

---

## 8. VALIDATION

All commands run in `/Users/dcv/Downloads/MAP HOLDING`. Results are actual output.

### 8.1 Quality gates

| Command                | Result                                         |
| ---------------------- | ---------------------------------------------- |
| `npm test`             | **exit 0** — 23 tests, 23 pass, 0 fail         |
| `npm run typecheck`    | **exit 0**                                     |
| `npm run lint`         | **exit 0**                                     |
| `npm run format:check` | **exit 0**                                     |
| `npm run build`        | **exit 0** — 15 routes, all prerendered static |

Route table from the build:

```
○ /                 ○ /about          ○ /business-areas   ○ /client-portal
○ /contact          ○ /founding-partners                  ○ /partnerships
○ /projects         ○ /brand (internal, noindex)
● /legal/privacy    ● /legal/terms    ● /legal/cookies
```

### 8.2 Routes and semantics

| Route                            | HTTP    | `h1` | `h2` | robots                |
| -------------------------------- | ------- | ---- | ---- | --------------------- |
| `/`                              | 200     | 1    | 5    | index, follow         |
| `/about`                         | 200     | 1    | 5    | index, follow         |
| `/business-areas`                | 200     | 1    | 4    | index, follow         |
| `/projects`                      | 200     | 1    | 4    | index, follow         |
| `/partnerships`                  | 200     | 1    | 4    | index, follow         |
| `/contact`                       | 200     | 1    | 5    | index, follow         |
| `/client-portal`                 | 200     | 1    | 4    | **noindex, nofollow** |
| `/founding-partners`             | 200     | 1    | 4    | **noindex, nofollow** |
| `/legal/{privacy,terms,cookies}` | 200     | 1    | 1    | index, follow         |
| `/brand`                         | 200     | 1    | 10   | **noindex, nofollow** |
| `/does-not-exist`                | **404** | —    | —    | —                     |

### 8.3 Responsive — no horizontal overflow at any width

One implementation, no per-viewport components. Measured `document.scrollWidth` vs
`clientWidth`:

| Viewport | `/` | `/projects` | `/client-portal` | `/brand` |
| -------- | --- | ----------- | ---------------- | -------- |
| 320 px   | ok  | ok          | ok               | ok       |
| 375 px   | ok  | ok          | ok               | ok       |
| 390 px   | ok  | ok          | ok               | ok       |
| 768 px   | ok  | ok          | ok               | ok       |
| 1024 px  | ok  | ok          | ok               | ok       |
| 1280 px  | ok  | ok          | ok               | ok       |
| 1440 px  | ok  | ok          | ok               | ok       |

### 8.4 Accessibility — measured in the browser

| Check                             | Result                                                                      |
| --------------------------------- | --------------------------------------------------------------------------- |
| Landmarks                         | 1 `header`, 1 `main`, 1 `footer`, 6 `nav` on every page                     |
| Unlabelled nav landmarks          | 0                                                                           |
| `h1` count                        | exactly 1 on every route                                                    |
| Heading level skips               | **0** on every route tested                                                 |
| Images missing an `alt` attribute | 0                                                                           |
| Buttons with no accessible name   | 0                                                                           |
| Links with no accessible name     | **0** (the logo-only link is named by its `alt`)                            |
| Tables                            | `caption` present; every `th` has `scope`                                   |
| `lang` attribute                  | `en`                                                                        |
| Skip link                         | first `Tab` stop, revealed, `href="#main-content"`                          |
| Skip link activation              | `location.hash` → `#main-content`; the **next `Tab` lands inside `<main>`** |
| Focus ring                        | 2px solid `rgb(31,116,218)` (`blue-400`) on nav links and the skip link     |
| Reduced motion                    | all motion tokens collapse; hero frozen; frames identical                   |

**Hero text contrast measured against the real rendered background.** The 3D layer and the
hero text were hidden in turn through CDP, and the composited pixels under the heading block
sampled (112,312 pixels):

| Pair                                                          | Background | Ratio       | Grade |
| ------------------------------------------------------------- | ---------- | ----------- | ----- |
| `ivory-50` on the **mean** hero background                    | L 0.0083   | **19.7:1**  | AAA   |
| `ivory-50` on the **brightest** hero background pixel         | L 0.0394   | **11.08:1** | AAA   |
| `gold-300` eyebrow on the **brightest** hero background pixel | L 0.0394   | **8.96:1**  | AAA   |

Getting there took two measured iterations, both recorded as defects (9.6 and 9.7). The
amber eyebrow first measured **4.61:1**, and the fix was _not_ to shuffle the glow between
hues — which made it worse — but to add a legibility scrim **above** the 3D layer. The
brightest pixel behind the text fell from L 0.1237 to L 0.0394: roughly a threefold
reduction.

### 8.5 Keyboard

Verified by dispatching real key events — `Tab`, `Shift+Tab`, `Enter`, `Escape`. Results are
in section 3.

### 8.6 3D

| Test                              | Result                                                                 |
| --------------------------------- | ---------------------------------------------------------------------- |
| Desktop / animated                | `state: running`, canvas present, **frames differ → animating**        |
| Shader compiles and links         | yes; `glError 0`; every uniform resolves                               |
| Ribbon actually hit by the camera | 18–23% of rays, at all camera phases and aspect ratios (CPU replica)   |
| Amber / blue / teal all present   | of lit ribbon pixels: amber 31–79%, teal 11–53%, blue mid-band darkest |
| Reduced motion                    | `state: reduced`, one frame, **frames identical**                      |
| No WebGL                          | `state: fallback`, `canvas: null`, page fully usable                   |
| Quality degradation               | observed `steps 128→96`, `scale 0.72→0.61` under a software rasteriser |
| Mobile                            | camera adapts to aspect; amber retained on portrait frames             |

---

## 9. DEFECTS FOUND AND FIXED DURING THIS PHASE

Recorded because each one was found by measurement, not by reading the code.

### 9.1 The desktop navigation rendered on mobile — horizontal overflow

**Symptom:** the document was 425 px wide at a 320 px viewport on `/` and `/projects`, and
**643 px** wide on `/client-portal`.

**Cause:** `Header.module.css` set `display: flex` on the same element that `PrimaryNav`
styles. Both are single-class selectors, so the winner depended on CSS bundle order, and the
header's rule won — overriding the nav's own `display: none` below the desktop breakpoint.
The full desktop navigation therefore laid out at every width.

**Also a defect beyond layout:** two complete navigation landmarks were exposed on mobile.

**Fix:** the header's `.nav` now sets layout only, and applies `display` solely inside the
`min-width: 1024px` media query, leaving `PrimaryNav` to own its own breakpoint.
**After:** zero overflow at 320 / 375 / 390 / 768 / 1024 / 1280 / 1440 on every route.

### 9.2 The client portal page was 643 px wide at 320 px

Same root cause and same fix (9.1). A secondary contributor — the authorization matrix
table with `min-width: 40rem` — was already correctly contained by its `overflow-x: auto`
wrapper; the table was never the cause.

### 9.3 The 3D ribbon's amber was cropped away on phone-sized heroes

**Symptom:** measured **0%** amber in the rendered frame at portrait aspect.

**Cause:** a fixed camera distance. At a 0.74 aspect the ribbon's amber end fell outside the
frame, so the gradient rendered as blue and teal only.

**Fix:** aspect-aware camera distance, `fit = clamp(1.55 / aspect, 1.0, 2.6)`, plus a ≤ 7°
roll on tall frames. **After:** portrait frames retain amber across 4.9–79% of lit ribbon
pixels.

### 9.4 The amber end of the ribbon desaturated under a cool environment

**Symptom:** the amber portion of the ribbon measured 0–5% even when fully in frame.

**Cause:** the environment was blue-dominant. Multiplying the warm tint by a cool reflection
produces a desaturated yellow that falls outside the amber hue band — the primary brand
colour was being lit out of existence.

**Fix:** a warm-neutral environment gradient, a warm key, a neutral fill and only a weak
cool rim. **After:** amber 31–79% of lit ribbon pixels.

### 9.5 A second ray march cost 2× for no visible result

**Symptom:** none visible — that is the point. The "soft floor reflection" pass never
appeared.

**Measured:** it hit the ribbon on **0.0–0.1%** of pixels while doubling march cost for
every downward ray.

**Fix:** removed. The metallic environment reflection and the analytic floor supply the
depth instead, and the worst-case cost was halved.

### 9.6 The hero's amber eyebrow had the tightest contrast on the page

**Measured:** `gold-300` at **4.86:1** against the brightest hero background pixel — a pass,
but only 0.36 above the AA floor for normal text.

**First attempted fix — and it made things worse, which is why it is recorded:**
re-weighting the background glow away from amber and toward blue and teal. Measured after:
`gold-300` **4.61:1**, `ivory-50` **5.70:1** — both lower. The reasoning ("blue and teal are
darker brand hues") was wrong: teal carries a strong green channel and is the _most_ luminous
of the three, so trading amber for teal raised background luminance.

### 9.7 Nothing darkened the 3D layer behind the hero text

**Root cause of 9.6:** the `Hero3DFallback`'s vignette sits in the DOM _before_ the canvas, so
the canvas painted straight over it. The shader's centre glow — the brightest thing on the
page — had no scrim above it at all. Trading glow weights could never fix that.

**Fix:** a proper three-layer stack, with a dedicated canvas layer so the order is explicit
rather than accidental:

```
static fallback (z 0) → canvas layer (z 1) → legibility scrim (z 2) → hero text (z 10)
```

The scrim is a left-weighted navy gradient at 0.46 → 0 plus the edge vignette. It is
deliberately **moderate, not heavy**: the amber end of the ribbon is also on the left, and a
dense scrim would buy contrast by burying the primary brand colour.

**Measured after:** brightest pixel behind the text fell from L 0.1237 to **L 0.0394**;
`ivory-50` **11.08:1** (AAA) and `gold-300` **8.96:1** (AAA).

### 9.7 React 19 lint violations were fixed, not suppressed

`react-hooks/set-state-in-effect` and related rules were satisfied properly throughout —
`useSyncExternalStore` where browser state is read, ref callbacks and DOM side effects
rather than state where possible, and a `matchMedia` listener to dismiss the drawer on
resize. No `eslint-disable` was added anywhere.

### 9.8 Next.js 16 blocked the dev origin, preventing hydration entirely

**Symptom:** the server-rendered HTML was correct, but **no client component ever booted** —
the mobile drawer did nothing and the 3D hero never initialised. No JavaScript exception was
raised, so nothing appeared in the console as a failure.

**Cause:** the dev server was opened on `http://127.0.0.1:3100`, which Next.js 16 treats as
an unrecognised origin and blocks for dev resources (the HMR client). The log line was:

```
⚠ Blocked cross-origin request to Next.js dev resource /_next/hmr from "127.0.0.1".
```

**Fix:** `allowedDevOrigins: ["127.0.0.1", "localhost", "172.20.10.3"]` in `next.config.ts`,
so the site can be opened on loopback or over Wi-Fi for device testing. This also unblocked
every browser test in this phase.

---

## 10. PHASE 3 SCOPE VERIFICATION

Confirmed **not** built in this phase:

- No complete website. Six scaffold routes with controlled placeholder structure, not content.
- No business-area content, no project records, no partner register, no statistics, no dates.
- No hero film, no photography, no imagery of any kind — only labelled, ratio-reserved slots.
- No client portal UI, no dashboard, no data tables, no document list, no messaging.
- No internal dashboard or internal environment.
- No Founding Partners programme content.
- No authentication, no session, no cookie, no role assignment, no login form.
- No database, no ORM, no schema, no migrations.
- No API routes, no route handlers, no server actions, no data fetching.
- No CMS, no analytics, no AI assistant.
- No deployment configuration, no DNS change, no publish, no hosting change.
- No Git remote configured, and nothing pushed.
- No DCV / Agnes / Commander / A14 / Director / Studios / Automation code, naming or
  assumptions.

**Dependencies added in this phase: none.** `package.json` still lists only `next`, `react`,
`react-dom` and type/lint/format tooling. The 3D hero adds zero packages.

The test runner is Node's built-in `node:test` with native TypeScript type-stripping, so even
the boundary test suite required no new dependency.

---

## 11. LIVE PREVIEW

```
http://localhost:3100
```

`npm run dev` (Next.js 16.3.8, Turbopack) is running on port 3100 and left running for
inspection. Verified working routes: `/`, `/about`, `/business-areas`, `/projects`,
`/partnerships`, `/contact`, `/client-portal`, `/founding-partners`,
`/legal/{privacy,terms,cookies}`, and the internal `/brand` gallery.

**Open it on `localhost`, not `127.0.0.1`** — `127.0.0.1` is now also allowed (section 9.8),
but `localhost` needs no configuration at all.

Nothing was deployed. No hosting, DNS or production configuration exists or was changed.

---

## 12. PHASE 4 RECOMMENDATION

**Phase 4 — Home page, for real.**

Phase 3 built the shell and proved that content can be poured into it. Phase 4 should fill
exactly one page — the home route — with a genuine editorial structure, still without
inventing business facts:

1. **Hero completion.** The 3D experiment now has a verdict to act on (a decision on whether
   to keep, refine or drop it belongs with MAP Holding, since it is a brand judgement). Add
   the poster-first, video-ready hero frame from Phase 1 §J so the film can be dropped in.
2. **Pillar strip.** `PEOPLE • RESOURCES • OPPORTUNITY` as a real three-part section, driven
   by imagery slots that the brand team fills.
3. **Business-area grid.** The typed `BusinessArea` model from Phase 1 §G.1 plus a card
   component — wired to _typed placeholder records_, so the moment real records arrive the
   grid is already correct.
4. **Featured projects + stat band.** Same approach: the components and the data shape, with
   verified-metrics-only rendering enforced by the type.
5. **CTA section** and the section-reveal motion, using the existing `Reveal` primitive and
   the approved stagger cap.
6. **SEO layer** for the public pages: per-route metadata, `sitemap.xml`, `robots.txt`,
   Open Graph images.

**Prerequisites to request from MAP Holding before or during Phase 4:**

- **True-vector transparent SVG lockups.** Still outstanding from Phase 2, and now more
  urgent: the header and footer render opaque raster crops.
- **Group positioning copy** and the confirmed one-line group descriptor.
- **Corporate contact details** (registered office, telephone, email) — the footer and
  `/contact` are placeholder-only until these exist.
- **A decision on hero media** — the 3D visualisation, a film, photography, or a combination.
- **Approval of the business-area taxonomy** so the typed records can be created.

**Not recommended yet:** the portal (Phase 8), authentication, or any backend work. All
three are gated behind the access architecture that this phase settled, and behind the real
content that Phase 4–7 should surface.

---

## PHASE 3 HARD STOP — CONFIRMED

- The complete website was not built. Business-area content was not built.
- The client portal UI was not built. Authentication was not built. No APIs were built.
- No database was created. Nothing was deployed. Nothing was pushed to Git.
- Phase 3 is the public shell, the 3D hero experiment and the access architecture, and
  nothing beyond that.

**MAP HOLDING — PEOPLE • RESOURCES • OPPORTUNITY** — awaiting approval to begin Phase 4.
