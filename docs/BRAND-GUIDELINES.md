# MAP HOLDING — BRAND GUIDELINES

> **Source of truth:** `MAP Holding Brand Identity Board.png`.
> The logo is the authority. Every colour, proportion and rule in this document is derived
> from that asset — nothing here was invented, and nothing may be adjusted for taste.

Brand statement: **PEOPLE • RESOURCES • OPPORTUNITY**

---

## 1. LOGO SYSTEM

### 1.1 Approved assets

All assets live in `public/brand/`. Each one is a **faithful rectangular crop** of the approved
identity board: the mark has never been redrawn, re-traced, recoloured or re-proportioned, and
no substitute artwork was created.

| File                        | Lockup                                                        | Intrinsic  | Minimum width | Approved ground              |
| --------------------------- | ------------------------------------------------------------- | ---------- | ------------- | ---------------------------- |
| `logo-primary-dark.png`     | Ribbon-M over gold wordmark + tagline                         | 1004 × 761 | 220 px        | MAP Navy / near-black        |
| `logo-light.png`            | Same lockup, ink wordmark                                     | 531 × 477  | 180 px        | Ivory / white                |
| `logo-horizontal-dark.png`  | Mark left, stacked wordmark + tagline right, hairline divider | 532 × 191  | 180 px        | MAP Navy / near-black        |
| `icon-navy.png`             | Rounded navy tile                                             | 152 × 152  | 24 px         | Any light ground             |
| `icon-ivory.png`            | Rounded ivory tile                                            | 152 × 152  | 24 px         | Navy or photographic grounds |
| `icon-gold.png`             | Metallic gold tile, single-colour ink M                       | 152 × 152  | 24 px         | Any ground                   |
| `icon-navy-transparent.png` | Navy tile, white surround removed                             | 152 × 152  | 24 px         | Any branded surface          |
| `icon-gold-transparent.png` | Gold tile, white surround removed                             | 152 × 152  | 24 px         | Any branded surface          |
| `icon-256.png`              | Derived from the navy tile                                    | 256 × 256  | —             | Favicon / app icon           |

### 1.2 Clear space

Each lockup is a full panel crop of the board, so **the mark's own clear space is already baked
into the file**. When a lockup is placed into new layout, keep a minimum clear space equal to
**half the ribbon-M height** on all four sides.

### 1.3 Usage rules

**Do**

- Use the variant whose ground matches the surface it sits on.
- Scale proportionally only. Height is always derived from width.
- Prefer `logo-horizontal-dark.png` for navigation, footers and signatures.
- Use `icon-gold.png` where the mark must survive at very small sizes.

**Never**

- Stretch, squash, rotate or skew the mark.
- Recolour it, re-derive the gradient, or trace it into vectors.
- Substitute another logo, icon set or generated mark.
- Add drop shadows, outlines, glows or bevels.
- Place a dark-ground lockup on a mid-tone surface — the crop is opaque, and the navy ground is
  part of the approved asset.
- Re-crop the mark out of its ground to "make it transparent".

### 1.4 Known limitation

The lockups currently exist only inside the identity board raster. **Transparent, true-vector SVG
lockups (`logo-primary.svg`, `logo-light.svg`, `logo-horizontal.svg`, app-icon SVGs) do not exist
yet** and must be exported from the original vector source before the public site ships. The
`icon-navy|gold-transparent.png` files are the only alpha-matted assets, produced by removing the
board's white surround.

---

## 2. COLOUR SYSTEM

### 2.1 How the palette was derived

The ribbon-M moves continuously through **amber → blue → teal**; navy and near-white are the
grounds. Production values were obtained by pixel-sampling the three lockups and the app-icon
tiles on the identity board (per-channel medians per hue family, averaged across lockups), then
compared against the Phase 1 provisional palette.

### 2.2 Production palette

| Token                     | Value     | Origin                                      | Use                                  |
| ------------------------- | --------- | ------------------------------------------- | ------------------------------------ |
| `--color-brand-gold-300`  | `#f7dfa0` | sampled ribbon highlight                    | highlights, hover glow, text on navy |
| `--color-brand-gold-400`  | `#f2b364` | sampled ribbon upper lobe                   | primary hover fill                   |
| `--color-brand-gold-500`  | `#f39639` | **MAP Gold** — mean of ribbon amber medians | primary buttons, key rules, accents  |
| `--color-brand-gold-600`  | `#b06520` | sampled ribbon shadow side                  | pressed states, gold text on ivory   |
| `--color-brand-gold-700`  | `#763915` | sampled ribbon deepest                      | deepest gold step                    |
| `--color-brand-metal-300` | `#e8d3aa` | sampled wordmark median                     | metallic text, foil treatments       |
| `--color-brand-metal-500` | `#d1a660` | sampled gold app-tile median                | gold tile surfaces                   |
| `--color-brand-metal-700` | `#b07f40` | sampled tile / wordmark dark                | metallic shadow step                 |
| `--color-brand-blue-300`  | `#6fa8ee` | derived light step                          | tints                                |
| `--color-brand-blue-400`  | `#1f74da` | sampled ribbon bright blue                  | links, focus ring, data accents      |
| `--color-brand-blue-500`  | `#003ba3` | **MAP Blue** — mean of ribbon blue medians  | headings and links on light          |
| `--color-brand-blue-600`  | `#06308c` | sampled ribbon shadow side                  | deep blue step                       |
| `--color-brand-blue-700`  | `#00186e` | sampled ribbon deepest                      | portal chrome, info on light         |
| `--color-brand-teal-300`  | `#7fe7d2` | derived light step                          | tints                                |
| `--color-brand-teal-400`  | `#2fd8b8` | sampled ribbon teal tip                     | teal accents                         |
| `--color-brand-teal-500`  | `#0092ba` | **MAP Teal** — mean of ribbon teal medians  | success, metrics, secondary accents  |
| `--color-brand-teal-700`  | `#0a6e7b` | derived deep step                           | success text on light grounds        |
| `--color-brand-navy-950`  | `#04060f` | sampled board vignette floor                | deepest ground                       |
| `--color-brand-navy-900`  | `#080b1e` | **MAP Navy** — sampled board ground         | portal ground, footer, dark surfaces |
| `--color-brand-navy-800`  | `#111931` | derived raised step                         | cards and panels on dark             |
| `--color-brand-ivory-50`  | `#faf8f4` | sampled light ground                        | light ground                         |
| `--color-brand-ivory-100` | `#efebe2` | derived shade                               | dividers, subtle panels              |
| `--color-brand-ink-900`   | `#0b0f19` | sampled wordmark ink                        | wordmark and body on light           |

### 2.3 Changes from the Phase 1 provisional palette

| Token      | Phase 1 provisional | Phase 2 production | Reason                                                                                                                        |
| ---------- | ------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `gold-500` | `#D99A3C`           | `#f39639`          | The ribbon amber samples consistently lighter and more saturated; the Phase 1 value was a close visual reading, not a sample. |
| `blue-500` | `#1E4FB0`           | `#003ba3`          | The ribbon's blue is a fully saturated royal, deeper and less grey than the provisional value.                                |
| `teal-500` | `#18B4AE`           | `#0092ba`          | The ribbon's cool end samples as cyan-teal, not the greener teal assumed in Phase 1.                                          |
| `navy-900` | `#0A1026`           | `#080b1e`          | Marginal; the sampled ground is slightly darker.                                                                              |
| `navy-950` | `#070C1E`           | `#04060f`          | The board's vignette floor is much deeper than assumed.                                                                       |
| `ivory-50` | `#F7F2E7`           | `#faf8f4`          | **The board's light ground is near-white, not cream.** This is the largest correction.                                        |
| `ink-900`  | `#111418`           | `#0b0f19`          | The sampled wordmark ink is darker and cooler (navy-tinted).                                                                  |
| `gold-300` | `#F3C56B`           | `#f7dfa0`          | Matched to the sampled ribbon highlight.                                                                                      |
| `gold-400` | `#E8862B`           | `#f2b364`          | Matched to the sampled ribbon upper lobe.                                                                                     |
| `gold-600` | `#B4761F`           | `#b06520`          | Matched to the sampled ribbon shadow side.                                                                                    |
| `blue-400` | `#2E6BE0`           | `#1f74da`          | Matched to the sampled bright ribbon blue.                                                                                    |
| `blue-700` | `#143174`           | `#00186e`          | Matched to the sampled deepest ribbon blue.                                                                                   |
| `teal-400` | `#37D3C6`           | `#2fd8b8`          | Matched to the sampled teal tip.                                                                                              |

**New token group — metallic gold.** Sampling revealed the identity contains **two distinct
golds**: the vivid ribbon amber (`gold-*`) and a metallic champagne gold used for the wordmark and
the gold app tile. The second was promoted into its own `metal-*` group rather than merged, because
collapsing them would misrepresent both.

**Neutrals are unchanged** (`neutral-0 … neutral-900`). They are functional greys, not
logo-derived, so re-sampling the logo gives no basis for changing them.

**Semantic structure is unchanged** — `success` = MAP Teal, `info` = ribbon blue, `warning` /
`pending` = MAP Gold. `danger` (`#c0392b`) remains the single functional red the identity does not
otherwise provide.

### 2.4 Gradients

Only gradients interpolating between brand hues, in the mark's amber → blue → teal order, are
permitted. **Purple, magenta, neon and rainbow gradients are not part of the system.**

| Token              | Definition                          |
| ------------------ | ----------------------------------- |
| `--gradient-brand` | 135° gold-300 → blue-500 → teal-500 |
| `--gradient-warm`  | 135° gold-300 → gold-500            |
| `--gradient-cool`  | 135° blue-500 → teal-500            |
| `--gradient-navy`  | 180° navy-900 → navy-950            |
| `--gradient-ivory` | 180° ivory-50 → ivory-100           |

Use them with restraint: logo-adjacent surfaces, hero accents, highlights, separators, overlays and
premium decorative elements — not as page grounds.

---

## 3. TYPOGRAPHY

- **Display / headings:** Sora — geometric, corporate, matching the angular wordmark.
- **Body / UI / numerals:** Inter — legibility at UI density; `tabular-nums` for data.
- **Tagline / eyebrows:** Inter, uppercase, `0.18em` tracking, mirroring
  `PEOPLE • RESOURCES • OPPORTUNITY`.

Both are self-hosted by the framework at build time — there is no runtime font-CDN dependency.
Only the weights the scale actually uses are loaded (Sora 400/600, Inter 400/500/600).

---

## 4. ACCESSIBILITY RULES

Contrast targets are WCAG AA minimum, AAA for body where possible. The validation gallery measures
these live from the shipped tokens rather than asserting them.

- Body copy on MAP Navy or on ivory: AAA.
- Link text follows `--color-accent`: `blue-500` on light grounds (9.2:1) and `blue-300` on dark
  grounds (7.9:1). `blue-400` is reserved for the focus ring, where WCAG 1.4.11 asks for 3:1 — it
  measures 4.2:1 on navy and is **not** used as link text there.
- MAP Gold is **not** permitted as text on ivory (≈2.2:1). It is a fill and decorative accent on
  light grounds, and a heading/accent colour on navy.
- MAP Teal at `teal-500` is **not** permitted as body text on ivory (≈3.4:1); use `teal-700`.
- Focus is always visible: a 2px `blue-400` ring with a 2px offset, holding ≥3:1 on both grounds.
  Focus indication is never removed, only suppressed for pointer users.
- Status is never communicated by colour alone — every status carries a text label.
- Interactive targets are at least 44 × 44 px (the `md` button size and above).
- `prefers-reduced-motion: reduce` is honoured as a hard requirement: durations and distances
  collapse and content appears instantly.

---

## 5. USING THE TOKENS

1. Components reference **tokens only** — never a raw hex value.
2. Tokens live in `src/styles/tokens/` and are the single source of truth. The legacy Phase 1
   `preview/index.html` remains as a static visual record only.
3. The `Section` primitive owns the ground and re-points the semantic text, border and accent
   tokens for its descendants. Components therefore need no per-theme variants.
4. Logo artwork is served directly as a fixed-size, pre-optimised brand asset; it is never routed
   through an image optimiser that would re-encode approved artwork.
5. Any change to a brand value must originate from the identity board, not from this codebase.
