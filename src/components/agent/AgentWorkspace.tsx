"use client";

import { useCallback, useEffect, useState } from "react";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/feedback/Badge";
import { Button } from "@/components/controls/Button";
import { AgentChat } from "./AgentChat";
import { AgentProjects } from "./AgentProjects";
import {
  loadAgentServiceConfig,
  checkAgentIdentity,
  buildAgentSignInUrl,
  agentSignOut,
  isLoopbackAgentBase,
  type IdentityStatus,
} from "./agentApi";
import styles from "./AgentWorkspace.module.css";

type TabId =
  "chat" | "projects" | "documents" | "tasks" | "team" | "business-development" | "reports";

/** Reserved internal workspaces. Copy states what exists — no mock data. */
const TOOL_AREAS: Array<{ id: TabId; title: string; body: string }> = [
  {
    id: "documents",
    title: "Documents",
    body: "Reserved for authorised document access. Nothing is stored, bound or readable here yet — no documents exist in the agent environment in this phase.",
  },
  {
    id: "tasks",
    title: "Tasks",
    body: "Reserved for task review and follow-ups. No task data or actions are available in this phase.",
  },
  {
    id: "team",
    title: "Team",
    body: "Reserved for team workspace features. No roster or personnel data is displayed in this phase.",
  },
  {
    id: "business-development",
    title: "Business Development",
    body: "Reserved for pipeline and opportunity support. No pipeline data is available to the agent in this phase.",
  },
  {
    id: "reports",
    title: "Reports",
    body: "Reserved for reporting views. No reports are generated or shown in this phase.",
  },
];

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "chat", label: "Chat" },
  { id: "projects", label: "Projects" },
  ...TOOL_AREAS.filter((a) => a.id !== "projects").map((a) => ({ id: a.id, label: a.title })),
];

/**
 * AgentWorkspace — the internal Business Agent experience.
 *
 * Honest-state machine (no simulated authentication, ever):
 *   1. "config-loading"        → configuration of the agent service is being read.
 *   2. "not-configured"       → the worker origin is unset in the site's static
 *                               agent configuration; no external call happens.
 *   3. "checking"             → the worker's Access-verified identity check is
 *                               in flight.
 *   4. "unauthenticated"      → not signed in via Cloudflare Access.
 *   5. "unapproved"           → signed in, but not on an approved roster.
 *   6. "ready"                → a verified owner/staff identity drives the UI.
 *
 * Renders on a raised navy surface (the `raised` tone re-maps to the dark
 * palette when nested in the owners' dark section), consistent with the
 * MAP Holding environment it lives in.
 */
export function AgentWorkspace() {
  const [workerBaseUrl, setWorkerBaseUrl] = useState<string | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [identity, setIdentity] = useState<IdentityStatus | null>(null);
  const [identityTick, setIdentityTick] = useState(0);
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<TabId>("chat");

  useEffect(() => {
    let cancelled = false;
    loadAgentServiceConfig().then((config) => {
      if (!cancelled) {
        setWorkerBaseUrl(config.workerBaseUrl);
        setConfigLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshIdentity = useCallback(() => setIdentityTick((t) => t + 1), []);

  // Sign out of the local session: the service revokes it server-side and
  // the cookie is cleared; the re-check then shows the honest un-signed-in
  // state. For a configured (https) service, Cloudflare Access owns sign-out.
  const [signingOut, setSigningOut] = useState(false);
  const handleSignOut = useCallback(async () => {
    if (workerBaseUrl === null || signingOut) return;
    setSigningOut(true);
    try {
      await agentSignOut(workerBaseUrl);
      setIdentity(null); // until the re-check below replaces it with a verdict
      setIdentityTick((t) => t + 1);
    } finally {
      setSigningOut(false);
    }
  }, [workerBaseUrl, signingOut]);

  // While the service is unconfigured there is nothing to ask; keep the
  // identity verdict empty rather than claiming any state.
  const approved = identity?.state === "authenticated";
  const serviceReady = configLoaded && workerBaseUrl !== null;

  // Live identity check against the worker's Access-verified boundary —
  // re-run on every explicit refresh. No local guessing of who the user is.
  useEffect(() => {
    if (!workerBaseUrl) return; // unconfigured: identity stays its initial null
    let cancelled = false;
    checkAgentIdentity(workerBaseUrl).then((status) => {
      if (!cancelled) setIdentity(status);
    });
    return () => {
      cancelled = true;
    };
  }, [workerBaseUrl, identityTick]);

  return (
    <Section tone="raised" spacing="lg">
      <Container size="portal" className={styles.wrap}>
        <header className={styles.masthead}>
          <div className={styles.mastheadLeft}>
            <Badge tone="brand">Internal environment</Badge>
            <h1 className={styles.title}>Business Agent</h1>
            <p className={styles.subtitle}>
              Advisory assistance for the MAP Holding group. This phase is advisory only — the agent
              has no access to company systems and performs no actions.
            </p>
          </div>
          <div className={styles.mastheadRight}>
            <IdentityChip serviceReady={serviceReady} identity={identity} baseUrl={workerBaseUrl} />
            {serviceReady && (
              <Button variant="secondary" size="sm" onClick={refreshIdentity}>
                Check again
              </Button>
            )}
            {serviceReady && identity !== null && identity.state !== "unauthenticated" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={signingOut}
                aria-label="Sign out of the agent session"
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </Button>
            )}
          </div>
        </header>

        <nav className={styles.tabs} aria-label="Workspace areas">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`${styles.tab} ${tab === t.id ? styles.tabActive : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "chat" ? (
          <AgentChat
            baseUrl={serviceReady ? (workerBaseUrl as string) : null}
            identity={identity}
            approved={approved}
            sending={sending}
            setSending={setSending}
          />
        ) : tab === "projects" ? (
          <AgentProjects
            baseUrl={serviceReady ? (workerBaseUrl as string) : null}
            identity={identity}
            approved={approved}
            refreshTick={identityTick}
          />
        ) : (
          <ToolPanel area={TOOL_AREAS.find((a) => a.id === tab) ?? TOOL_AREAS[0]} />
        )}

        {!serviceReady && configLoaded && (
          <footer className={styles.footerNote}>
            The agent service is not configured: <code>workerBaseUrl</code> in the site&rsquo;s
            static agent configuration is empty. No external request is made in this state.
          </footer>
        )}
      </Container>
    </Section>
  );
}

/* ---------------------------------------------------------------------------
 * Identity chip + reserved tool panels
 * ------------------------------------------------------------------------ */

interface IdentityChipProps {
  readonly serviceReady: boolean;
  readonly identity: IdentityStatus | null;
  readonly baseUrl: string | null;
}

/** The one place the current user's verified status is rendered. It only ever
 * displays what the worker's Access-verified boundary reported. */
function IdentityChip({ serviceReady, identity, baseUrl }: IdentityChipProps) {
  if (!serviceReady) {
    return <span className={styles.chipIdle}>Agent service not configured</span>;
  }
  if (identity === null) {
    return <span className={styles.chipIdle}>Checking sign-in status…</span>;
  }
  switch (identity.state) {
    case "authenticated":
      return (
        <span className={styles.chipOk}>
          Signed in as <strong>{identity.id}</strong> · {identity.kind} · {identity.organisation}
        </span>
      );
    case "unapproved":
      return (
        <span className={styles.chipWarn}>
          Signed in
          {identity.id ? (
            <>
              {" "}
              as <strong>{identity.id}</strong>
            </>
          ) : null}{" "}
          · not on an approved roster
        </span>
      );
    case "unauthenticated": {
      const signInUrl = buildAgentSignInUrl(baseUrl);
      const local = baseUrl !== null && isLoopbackAgentBase(baseUrl);
      return (
        <span className={styles.chipWarn}>
          Not signed in ·{" "}
          {local ? (
            // Same-tab: the local sign-in page returns the browser to this
            // workspace, where the identity check then finds the session.
            <a href={signInUrl ?? undefined}>sign in now</a>
          ) : (
            <a href={signInUrl ?? undefined} target="_blank" rel="noopener noreferrer">
              sign in at the agent service
            </a>
          )}
        </span>
      );
    }
    case "network":
      return <span className={styles.chipIdle}>Service unreachable</span>;
  }
}

interface ToolPanelProps {
  readonly area: { readonly id: TabId; readonly title: string; readonly body: string };
}

/** A reserved workspace: a clear statement of intent, zero fake data. */
function ToolPanel({ area }: ToolPanelProps) {
  return (
    <div className={styles.toolPanel}>
      <Badge tone="neutral">Reserved</Badge>
      <h2 className={styles.toolTitle}>{area.title}</h2>
      <p className={styles.toolBody}>{area.body}</p>
      <p className={styles.toolNote}>
        When this area is built, its capabilities will be registered on the agent service and gated
        through the same access policy as everything else.
      </p>
    </div>
  );
}
