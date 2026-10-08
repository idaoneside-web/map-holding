import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteShell } from "@/components/navigation/SiteShell";

/**
 * Gated route group (Phase 3 §16, §17).
 *
 * This group holds the *entry points* to protected environments. They are
 * publicly routable in Phase 3 — there is no authentication yet — but they are
 * deliberately separated from `(public)` so that:
 *
 *   - the future portal shell and founding-partner shell replace this group's
 *     shell instead of retrofitting the public one;
 *   - nothing in this group is ever indexed;
 *   - "gated" is a property of the namespace, not of a UI check.
 *
 * There is no login form here, no session, no cookie and no fake credential
 * check. A gated route in Phase 3 renders the access architecture, not a
 * simulation of access.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function GatedLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
