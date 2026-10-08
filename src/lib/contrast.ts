/**
 * WCAG 2.x contrast maths, used to validate the brand combinations against the
 * targets documented in Phase 1 §A.5 / §L.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Parse `rgb(r, g, b)`, `rgba(r, g, b, a)` or `#rrggbb` into 0–255 channels. */
export function parseColor(input: string): Rgb | null {
  const value = input.trim();

  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const int = parseInt(hex[1], 16);
    return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
  }

  const fn = value.match(/^rgba?\(([^)]+)\)$/i);
  if (fn) {
    const parts = fn[1]
      .split(/[,/\s]+/)
      .filter(Boolean)
      .map(Number);
    if (parts.length >= 3 && parts.slice(0, 3).every((n) => Number.isFinite(n))) {
      return { r: parts[0], g: parts[1], b: parts[2] };
    }
  }

  return null;
}

function channelToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
}

/** WCAG contrast ratio between two opaque colours (1 – 21). */
export function contrastRatio(foreground: Rgb, background: Rgb): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export type WcagLevel = "AAA" | "AA" | "AA Large" | "Non-text (3:1)" | "Fail";

export interface WcagGradeOptions {
  /** Intended for >=24px, or >=18.66px bold, text. */
  largeText?: boolean;
  /** Intended for UI components / graphics — WCAG 1.4.11 requires 3:1, not 4.5:1. */
  nonText?: boolean;
}

/** Smallest level the ratio satisfies for the given intended use. */
export function wcagLevel(ratio: number, options: WcagGradeOptions = {}): WcagLevel {
  if (options.nonText) return ratio >= 3 ? "Non-text (3:1)" : "Fail";
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (options.largeText && ratio >= 3) return "AA Large";
  return "Fail";
}

export function isPass(level: WcagLevel | null): boolean {
  return level !== null && level !== "Fail";
}

export function formatRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}
