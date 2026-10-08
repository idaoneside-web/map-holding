import type { ReactNode } from "react";
import { SiteShell } from "@/components/navigation/SiteShell";

/**
 * Public route group (Phase 3 §6).
 *
 * Nothing here is gated. The group exists so the future protected namespaces
 * (`(gated)`, then the portal and founding-partner shells) cannot accidentally
 * inherit public behaviour, or vice versa.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
