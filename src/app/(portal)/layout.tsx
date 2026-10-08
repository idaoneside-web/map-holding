import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal/PortalShell";

/**
 * Portal route group — the authenticated client environment (Phase 4).
 *
 * This group is deliberately separate from `(gated)` and from `(public)`:
 *
 *   - `(public)` keeps the public site chrome (`SiteShell`);
 *   - `(gated)` keeps the protected *entry statements* and the Founding Partners
 *     namespace;
 *   - `(portal)` mounts the client environment, whose shell is its own.
 *
 * Nothing here is indexed. There is still no authentication in the running site:
 * this is a non-indexed, unauthenticated preview driven by sample fixtures (see
 * `src/content/portal.ts`). The real authorization boundary is the settled
 * contract in `src/lib/access`.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
