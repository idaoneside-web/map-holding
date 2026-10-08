import type { Metadata } from "next";
import { GatedEntry } from "@/components/page/GatedEntry";

export const metadata: Metadata = {
  title: "Founding Partners",
  description:
    "Entry point for the MAP Holding Founding Partners programme. A separate protected environment.",
  robots: { index: false, follow: false },
};

/**
 * /founding-partners — the distinct protected programme (Phase 3 §17).
 *
 * Kept deliberately free of programme content: none has been supplied. What is
 * stated here is the separation rule, which is architectural rather than
 * editorial, plus the same generated authorization model.
 */
export default function FoundingPartnersPage() {
  return (
    <GatedEntry
      eyebrow="Protected programme"
      title="Founding Partners"
      intro="A distinct protected environment with its own namespace, its own audience and its own data scope. It is not a tier of the client portal, and it is not part of the internal environment."
      facts={[
        "Founding Partner membership is an explicit entitlement issued by MAP Holding. It is never inferred from a principal kind.",
        "Being a client does not make anyone a founding partner. Being a MAP Holding employee does not either. Both require a separate, auditable grant.",
        "The entitlement is additive only: it never raises a principal's clearance ceiling, so it cannot expose internal or confidential material.",
        "Programme content is unreachable without the entitlement, even by the principal that owns the record.",
        "Because it is a namespace rather than a role, the programme can be opened, paused or closed without disturbing client access.",
      ]}
      neverVisible={[
        "Programme material belonging to another partner",
        "Internal MAP Holding assessments of the programme",
        "Confidential group reports and financials",
        "Any client's records — the two environments do not overlap",
      ]}
      outstanding={[
        "Programme definition and eligibility criteria",
        "Entitlement grant and revocation workflow",
        "Programme documents and communications",
        "Programme-specific reporting",
        "Separate gated shell and navigation",
        "Authentication provider and session model",
      ]}
    />
  );
}
