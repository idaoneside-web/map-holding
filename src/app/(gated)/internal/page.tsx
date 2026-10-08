import type { Metadata } from "next";
import { GatedEntry } from "@/components/page/GatedEntry";

export const metadata: Metadata = {
  title: "Internal Environment",
  description:
    "Entry point for the MAP Holding internal environment. A separate protected environment for personnel.",
  robots: { index: false, follow: false },
};

/**
 * /internal — the separate internal / administrator environment (Phase 4).
 *
 * This is deliberately NOT part of the client portal and is NOT an item in the
 * client portal navigation. An internal or administrator user has their own
 * environment; a client principal's clearance ceiling is exactly `client`, so a
 * client can never reach internal, admin or confidential material whatever
 * grants exist. The separation is a property of the access contract, not of a
 * menu.
 */
export default function InternalEnvironmentPage() {
  return (
    <GatedEntry
      eyebrow="Protected environment · personnel"
      title="Internal Environment"
      intro="The environment MAP Holding personnel use. It is a separate product from the Client Portal, not a set of extra menus inside it, and it is not reachable from a client account."
      facts={[
        "A client principal's clearance ceiling is exactly `client`, so internal, admin and confidential resources are unreachable by a client however ownership or grants are arranged.",
        "Internal reports, assessments, financial information and strategy are structurally excluded from the client portal, not merely hidden in its interface.",
        "An internal user is never a client portal destination: the two environments share the brand foundation and nothing else.",
        "Becoming a client does not grant internal access, and internal access does not grant founding-partner membership.",
        "Every read is decided server-side by the same authorization contract used across the group.",
      ]}
      neverVisible={[
        "Client accounts and client records",
        "Client documents and messages",
        "Internal material surfaced into any client-facing surface",
      ]}
      outstanding={[
        "Authentication provider and session model",
        "Internal-only navigation and shell",
        "Internal reporting and assessment tooling",
        "Audit logging for access decisions",
        "Role and entitlement administration",
      ]}
    />
  );
}
