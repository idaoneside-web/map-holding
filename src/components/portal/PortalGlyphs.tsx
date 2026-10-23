import type { ReactNode } from "react";
import type { PortalGlyphName } from "@/content/portal";

/**
 * PortalGlyphs — the small inline icon set for the client portal navigation.
 *
 * Drawn as SVG rather than shipped as an icon package, matching the shell's
 * existing convention (`IconButton`): no dependency, no icon-font request, and
 * every glyph inherits `currentColor` so it follows the theme automatically.
 *
 * Glyphs are decorative; the accessible name always comes from the adjacent
 * label, so every glyph is rendered `aria-hidden`.
 */

interface GlyphProps {
  name: PortalGlyphName;
  size?: number;
}

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function PortalGlyph({ name, size = 18 }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...STROKE}
    >
      {PATHS[name]}
    </svg>
  );
}

const PATHS: Record<PortalGlyphName, ReactNode> = {
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.5" />
      <rect x="13.5" y="11" width="7" height="9.5" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  projects: (
    <>
      <path d="M3.5 7.5l8.5-4 8.5 4-8.5 4z" />
      <path d="M3.5 12.5l8.5 4 8.5-4" />
      <path d="M3.5 16.5l8.5 4 8.5-4" />
    </>
  ),
  applications: (
    <>
      <path d="M6 3.5h8.5L19 8v12a.5.5 0 0 1-.5.5h-12a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z" />
      <path d="M14 3.5V8h4.5" />
      <path d="M8.5 12.5h7M8.5 16h5" />
    </>
  ),
  documents: (
    <>
      <path d="M7 3.5h6.5L18 8v6" />
      <path d="M13 3.5V8h4.5" />
      <rect x="4" y="11" width="11" height="9.5" rx="1.5" />
    </>
  ),
  messages: (
    <>
      <path d="M4.5 5.5h15a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-4.5 3.5v-3.5h-.5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8.5" r="3.75" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.9 7.8l1.9 1.1M17.2 15.1l1.9 1.1M4.9 16.2l1.9-1.1M17.2 8.9l1.9-1.1" />
    </>
  ),
  signout: (
    <>
      <path d="M14 4.5H6.5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1H14" />
      <path d="M17 8.5l3.5 3.5L17 15.5" />
      <path d="M10.5 12H20" />
    </>
  ),
  assistant: (
    <>
      <path d="M4.5 5.5h15a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-4.5 3.5v-3.5h-.5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z" />
      <path d="M8.5 10.5l1.4 2.8 1.4-2.8" />
    </>
  ),
};
