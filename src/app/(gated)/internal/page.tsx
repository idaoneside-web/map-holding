import type { Metadata } from "next";
import { OwnersWorkspace } from "@/components/internal/OwnersWorkspace";

export const metadata: Metadata = {
  title: "Internal Environment",
  description:
    "Entry point for the MAP Holding internal environment. A separate protected environment for personnel.",
  robots: { index: false, follow: false },
};

/**
 * /internal — the owners' workspace (internal environment).
 *
 * The workspace itself is the page; its sections are views inside it, not
 * routes. The Business Agent section renders the agent workspace component
 * (advisory chat + read-only Projects) through the shared access contract —
 * the same component, the same policy, whether reached from this page or
 * anywhere else in the future. No client-side claim of who the user is is
 * ever made here; identity status is rendered only from the agent
 * service's verified boundary.
 *
 * Deliberately NOT part of the client portal and NOT an item in the client
 * portal navigation; a client principal's clearance ceiling is exactly
 * `client`, so this environment is unreachable by a client whatever grants
 * exist.
 */
export default function InternalEnvironmentPage() {
  return <OwnersWorkspace />;
}
