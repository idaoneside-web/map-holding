/**
 * MAP HOLDING — navigation helpers.
 *
 * Shared by the desktop navigation and the mobile drawer so "which item is
 * current" is decided in exactly one place.
 */

/**
 * True when `href` is the current destination.
 *
 * `/` only matches the exact home path — otherwise every route would light up
 * the Home item. Nested routes (`/business-areas/gold`) keep their parent
 * (`/business-areas`) marked as current via the prefix test.
 */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The desktop breakpoint at which the mobile drawer gives way to full nav. */
export const NAV_DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";
