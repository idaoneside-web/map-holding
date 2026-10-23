"use client";

import { useEffect, useState } from "react";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Badge } from "@/components/feedback/Badge";
import { AccessMatrix } from "@/components/page/AccessMatrix";
import { AgentWorkspace } from "@/components/agent/AgentWorkspace";
import styles from "./OwnersWorkspace.module.css";

/** The workspace's live views. Hash-synchronised so `/internal#agent` is a
 * stable deep link inside the single owners' workspace page — not a second
 * route, not a second page. */
type ViewId = "overview" | "agent";

const VIEWS: Array<{ id: ViewId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "agent", label: "Business Agent" },
];

/** Future business tools. They appear here ONLY as clearly marked
 * "Not yet available" entries — no mock data, no simulated results, no
 * hidden routes. Each will be registered on the agent service and gated
 * through the shared access policy before it becomes clickable. */
const PENDING_TOOLS: readonly string[] = [
  "Documents",
  "Tasks",
  "Team",
  "Business Development",
  "Reports",
];

/** Scope facts — kept verbatim from the environment's access contract. */
const SCOPE_FACTS: readonly string[] = [
  "A client principal's clearance ceiling is exactly `client`, so internal, admin and confidential resources are unreachable by a client however ownership or grants are arranged.",
  "Internal reports, assessments, financial information and strategy are structurally excluded from the client portal, not merely hidden in its interface.",
  "An internal user is never a client portal destination: the two environments share the brand foundation and nothing else.",
  "Becoming a client does not grant internal access, and internal access does not grant founding-partner membership.",
  "Every read is decided server-side by the same authorization contract used across the group.",
];

const NEVER_VISIBLE: readonly string[] = [
  "Client accounts and client records",
  "Client documents and messages",
  "Internal material surfaced into any client-facing surface",
];

const OUTSTANDING: readonly string[] = [
  "Authentication provider and session model",
  "Internal-only navigation and shell",
  "Internal reporting and assessment tooling",
  "Audit logging for access decisions",
  "Role and entitlement administration",
];

function viewFromHash(hash: string | undefined): ViewId {
  return hash === "#agent" ? "agent" : "overview";
}

/**
 * OwnersWorkspace — the integrated owners' workspace at /internal.
 *
 * The Business Agent is a section of THIS workspace, not a standalone page:
 * the "Business Agent" tab renders the existing AgentWorkspace component
 * (chat + read-only Projects through the shared access contract). Identity
 * is never claimed by this UI — the honest status of the service comes
 * exclusively from the worker's verified boundary, rendered inside the
 * agent section itself.
 */
export function OwnersWorkspace() {
  const [view, setView] = useState<ViewId>("overview");

  useEffect(() => {
    // hashchange covers URL-bar edits; popstate covers same-document back/
    // forward navigation created by history.pushState.
    const apply = () => setView(viewFromHash(window.location.hash));
    apply();
    window.addEventListener("hashchange", apply);
    window.addEventListener("popstate", apply);
    return () => {
      window.removeEventListener("hashchange", apply);
      window.removeEventListener("popstate", apply);
    };
  }, []);

  const selectView = (next: ViewId) => {
    // Hash navigation keeps the browser's back/forward working and makes
    // the section shareable without inventing another route. The hash is
    // set through history (a same-document update), and the hashchange
    // listener above keeps view state in sync.
    const hash = next === "agent" ? "#agent" : "#overview";
    window.history.pushState(null, "", window.location.pathname + hash);
    setView(next);
  };

  return (
    <Section tone="navy-deep" spacing="lg">
      <Container>
        <Stack gap="lg">
          <nav aria-label="Owners' workspace sections" className={styles.viewNav}>
            {VIEWS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={view === item.id ? `${styles.viewTab} ${styles.viewTabActive}` : styles.viewTab}
                aria-current={view === item.id ? "page" : undefined}
                onClick={() => selectView(item.id)}
              >
                {item.label}
              </button>
            ))}
            <span className={styles.pendingStrip} aria-label="Sections not yet available">
              {PENDING_TOOLS.map((tool) => (
                <span key={tool} className={styles.pendingTab} aria-disabled="true">
                  {tool}
                  <Badge tone="neutral">Not yet available</Badge>
                </span>
              ))}
            </span>
          </nav>

          {view === "agent" ? (
            <div className={styles.agentSection}>
              <AgentWorkspace />
            </div>
          ) : (
            <Stack gap="lg">
              <Stack gap="md">
                <div className={styles.heroRow}>
                  <Badge locked>Protected</Badge>
                  <span className={styles.eyebrow}>Protected environment · personnel</span>
                </div>
                <h1 className={styles.heroTitle}>Internal Environment</h1>
                <p className={styles.heroLead}>
                  The owners&rsquo; workspace for MAP Holding personnel. It is a separate product from the
                  Client Portal, not a set of extra menus inside it, and it is not reachable from a client
                  account. Nothing on this page grants access or simulates it — every read is decided
                  server-side by the group&rsquo;s shared authorization contract.
                </p>
              </Stack>

              <div className={styles.overviewGrid}>
                <div className={styles.factCard}>
                  <h2 className={styles.cardTitle}>Scope</h2>
                  <ul className={styles.factList}>
                    {SCOPE_FACTS.map((fact) => (
                      <li key={fact}>{fact}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.factCard}>
                  <h2 className={styles.cardTitle}>Structurally unreachable</h2>
                  <ul className={styles.factList}>
                    {NEVER_VISIBLE.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.factCard}>
                  <h2 className={styles.cardTitle}>Still outstanding</h2>
                  <ul className={styles.factList}>
                    {OUTSTANDING.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.factCard}>
                  <h2 className={styles.cardTitle}>In this workspace</h2>
                  <p className={styles.sectionLead}>
                    The{" "}
                    <button type="button" className={styles.inlineLink} onClick={() => selectView("agent")}>
                      Business Agent
                    </button>{" "}
                    tab opens the integrated agent: advisory chat and the read-only Projects panel, reached
                    from this navigation — not a separate site. Its sign-in status, capabilities and answers
                    come only from the agent service&rsquo;s verified boundary; while the service is
                    unconfigured, the section says exactly that and makes no external calls.
                  </p>
                  <p className={styles.sectionLead}>
                    The remaining business tools are reserved and clearly marked as not yet available. Each
                    will be registered on the agent service and gated through the same shared access policy
                    before it appears here.
                  </p>
                </div>
              </div>

              <AccessMatrix />
            </Stack>
          )}
        </Stack>
      </Container>
    </Section>
  );
}
