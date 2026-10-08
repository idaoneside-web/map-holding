/**
 * MAP HOLDING — brand asset registry.
 *
 * Every logo asset here is a faithful crop of `MAP Holding Brand Identity Board.png`.
 * The logo is never redrawn, recoloured or re-proportioned in code.
 *
 * `width`/`height` are the intrinsic pixel dimensions of the approved crop. They are
 * the single source of truth for aspect ratio: components derive height from width so
 * the mark can never be stretched. `minWidth` is the smallest width at which the
 * lockup stays legible (icons are the exception — they are designed to shrink).
 */

export const logoAssets = {
  "primary-dark": {
    src: "/brand/logo-primary-dark.png",
    width: 1004,
    height: 761,
    minWidth: 220,
    label: "Primary lockup — dark ground",
    description:
      "Ribbon-M above the gold wordmark with the People • Resources • Opportunity tagline, on the approved MAP Navy ground. Use on navy/near-black surfaces.",
  },
  light: {
    src: "/brand/logo-light.png",
    width: 531,
    height: 477,
    minWidth: 180,
    label: "Primary lockup — light ground",
    description:
      "The same lockup with the wordmark in MAP Ink on the approved near-white ground. Use on ivory/white surfaces.",
  },
  "horizontal-dark": {
    src: "/brand/logo-horizontal-dark.png",
    width: 532,
    height: 191,
    minWidth: 180,
    label: "Horizontal lockup — dark ground",
    description:
      "Mark left, stacked wordmark plus tagline right, split by a hairline. Use in navigation, footers and signatures on dark surfaces.",
  },
  "icon-navy": {
    src: "/brand/icon-navy.png",
    width: 152,
    height: 152,
    minWidth: 24,
    label: "App icon — navy tile",
    description: "Rounded navy tile with the ribbon-M. Primary app/favicon mark.",
  },
  "icon-ivory": {
    src: "/brand/icon-ivory.png",
    width: 152,
    height: 152,
    minWidth: 24,
    label: "App icon — ivory tile",
    description:
      "Rounded ivory tile with the ribbon-M. For dark or photographic grounds. Note: on a white ground the tile is intentionally near-invisible.",
  },
  "icon-gold": {
    src: "/brand/icon-gold.png",
    width: 152,
    height: 152,
    minWidth: 24,
    label: "App icon — gold tile",
    description:
      "Metallic gold tile with the single-colour ink M. Highest small-size legibility; the reserved brand-ownership mark.",
  },
  "icon-navy-transparent": {
    src: "/brand/icon-navy-transparent.png",
    width: 152,
    height: 152,
    minWidth: 24,
    label: "App icon — navy tile (transparent ground)",
    description:
      "The navy tile with its white surround removed, for placing the tile on any branded surface.",
  },
  "icon-gold-transparent": {
    src: "/brand/icon-gold-transparent.png",
    width: 152,
    height: 152,
    minWidth: 24,
    label: "App icon — gold tile (transparent ground)",
    description:
      "The gold tile with its white surround removed, for placing the tile on any branded surface.",
  },
} as const;

export type LogoVariant = keyof typeof logoAssets;

export const logoVariants = Object.keys(logoAssets) as LogoVariant[];
