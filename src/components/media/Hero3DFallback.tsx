import { cn } from "@/lib/cn";
import styles from "./Hero3DFallback.module.css";

export interface Hero3DFallbackProps {
  className?: string;
}

/**
 * The ribbon's 2D skeleton: two rises and a central valley — the M's own
 * ascending/descending motion, drawn with rounded joints so it flows as a band
 * rather than a cut-out. It is a simplified echo of the shader's `ribbonPath`,
 * not a tracing of the logo.
 */
const RIBBON_M_PATH =
  "M 295 590 C 360 590 470 290 500 285 C 530 290 665 470 720 470 " +
  "C 775 470 910 290 940 285 C 970 290 1080 590 1145 590";

/**
 * Hero3DFallback — the static brand visual for the hero (Phase 3 §8, §10).
 *
 * This is NOT a downgrade state bolted on afterwards: it is the base layer.
 * It is server-rendered, costs no JavaScript, contains no filters or animation,
 * and is therefore also the LCP element. The WebGL layer fades in on top of it
 * only once it has produced a frame.
 *
 * It carries the SAME approved idea as the live render — one abstract flowing
 * ribbon-M — so a visitor with no WebGL, on a reduced-motion device, or on a
 * low-power phone still sees the identity element, not an unrelated graphic.
 * Three offset, gradient-stroked copies of the one path stack into the illusion
 * of layered curved surfaces with depth, and a thin warm highlight rides the
 * upper edge as the lit top of the metal. No cube, globe or icon is used.
 *
 * Important distinction: this is an *atmospheric brand visualisation* made of an
 * abstract flowing band. It is not the MAP Holding logo, and no attempt is made
 * to reproduce or trace the mark — the official lockup is a separate, approved
 * asset rendered by `Logo`.
 *
 * Every gradient stop is a sampled brand value, in the mark's amber → blue →
 * teal order, on the approved MAP Navy ground. No new colours are introduced.
 *
 * Decorative by design: the hero's heading and copy carry the meaning, so this
 * is hidden from assistive technology.
 */
export function Hero3DFallback({ className }: Hero3DFallbackProps) {
  return (
    <div className={cn(styles.wrap, className)} aria-hidden="true">
      <svg
        className={styles.svg}
        viewBox="0 0 1440 810"
        preserveAspectRatio="xMidYMid slice"
        role="presentation"
        focusable="false"
      >
        <defs>
          <linearGradient id="heroGround" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#080b1e" />
            <stop offset="100%" stopColor="#04060f" />
          </linearGradient>

          {/* The mark's own amber → blue → teal, laid along the band so the hue
              sweeps left-to-right exactly as the live material does. */}
          <linearGradient
            id="heroRibbon"
            gradientUnits="userSpaceOnUse"
            x1="300"
            y1="500"
            x2="1140"
            y2="380"
          >
            <stop offset="0%" stopColor="#f39639" />
            <stop offset="34%" stopColor="#f7dfa0" />
            <stop offset="58%" stopColor="#003ba3" />
            <stop offset="100%" stopColor="#0092ba" />
          </linearGradient>

          {/* Shadowed underside of the same band, for depth layering. */}
          <linearGradient
            id="heroRibbonDim"
            gradientUnits="userSpaceOnUse"
            x1="300"
            y1="620"
            x2="1140"
            y2="520"
          >
            <stop offset="0%" stopColor="#763915" />
            <stop offset="55%" stopColor="#00186e" />
            <stop offset="100%" stopColor="#0a6e7b" />
          </linearGradient>

          {/* Warm top edge — the lit side of the metal. */}
          <linearGradient
            id="heroRibbonEdge"
            gradientUnits="userSpaceOnUse"
            x1="300"
            y1="500"
            x2="1140"
            y2="380"
          >
            <stop offset="0%" stopColor="#f7dfa0" />
            <stop offset="50%" stopColor="#6fa8ee" />
            <stop offset="100%" stopColor="#7fe7d2" />
          </linearGradient>

          <radialGradient id="heroGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#f39639" stopOpacity="0.18" />
            <stop offset="42%" stopColor="#003ba3" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#0092ba" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="1440" height="810" fill="url(#heroGround)" />
        <ellipse cx="720" cy="420" rx="740" ry="420" fill="url(#heroGlow)" />

        {/* Layered ribbon-M: a deep shadowed copy, a mid copy carrying the full
            brand sweep, and a bright copy offset forward-up. The vertical
            offsets read as stacked surfaces rather than a single flat stripe. */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path
            d={RIBBON_M_PATH}
            stroke="url(#heroRibbonDim)"
            strokeWidth="50"
            opacity="0.4"
            transform="translate(0 34)"
          />
          <path
            d={RIBBON_M_PATH}
            stroke="url(#heroRibbon)"
            strokeWidth="46"
            opacity="0.6"
            transform="translate(0 6)"
          />
          <path
            d={RIBBON_M_PATH}
            stroke="url(#heroRibbon)"
            strokeWidth="38"
            opacity="0.72"
            transform="translate(0 -10)"
          />
          {/* Lit upper edge. */}
          <path
            d={RIBBON_M_PATH}
            stroke="url(#heroRibbonEdge)"
            strokeWidth="8"
            opacity="0.5"
            transform="translate(-8 -24)"
          />
        </g>
      </svg>
      <span className={styles.vignette} />
    </div>
  );
}
