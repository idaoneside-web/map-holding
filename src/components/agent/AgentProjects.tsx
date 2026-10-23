"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/controls/Button";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { loadAgentProjects, type AgentProjectRecord, type IdentityStatus } from "./agentApi";
import type { ProjectStatus } from "@/content/projects";
import styles from "./AgentProjects.module.css";

const STATUS_TONE: Record<ProjectStatus, "success" | "warning" | "info"> = {
  AVAILABLE: "success",
  "UNDER REVIEW": "warning",
  "COMING SOON": "info",
};

export interface AgentProjectsProps {
  readonly baseUrl: string | null;
  readonly identity: IdentityStatus | null;
  readonly approved: boolean;
  /** Changes when the workspace's "Check again" action re-runs identity. */
  readonly refreshTick: number;
}

type FetchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; code: "authentication" | "unapproved" | "http" | "network" }
  | { kind: "ready"; projects: readonly AgentProjectRecord[] };

/**
 * AgentProjects — the read-only Projects panel.
 *
 * Sign-in states are derived from the worker's live identity verdict (never
 * guessed locally). Records render ONLY when the worker returned them for
 * the caller's verified principal. With the service unconfigured, the
 * reserved copy stays in place — the real integration requires the deployed
 * worker plus a Cloudflare Access session, which cannot exist locally.
 */
export function AgentProjects({ baseUrl, identity, approved, refreshTick }: AgentProjectsProps) {
  const [fetchState, setFetchState] = useState<FetchState>({ kind: "idle" });
  const [selectedRef, setSelectedRef] = useState<string | null>(null);

  // Fetch when the boundary approves the caller; re-run on explicit refresh.
  // State updates happen only in the async callback (repo effect rule).
  useEffect(() => {
    if (!approved) return; // unapproved: no request, nothing to show
    let cancelled = false;
    loadAgentProjects(baseUrl as string).then((result) => {
      if (cancelled) return;
      if (result.ok) setFetchState({ kind: "ready", projects: result.projects });
      else setFetchState({ kind: "error", code: result.code });
    });
    return () => {
      cancelled = true;
    };
  }, [approved, baseUrl, refreshTick]);

  const retry = () => {
    if (!baseUrl || !approved) return;
    setFetchState({ kind: "loading" });
    loadAgentProjects(baseUrl).then((result) => {
      if (result.ok) setFetchState({ kind: "ready", projects: result.projects });
      else setFetchState({ kind: "error", code: result.code });
    });
  };

  // 1 — service not configured: the reserved placeholder stays.
  if (baseUrl === null) {
    return (
      <div className={styles.reserved}>
        <h2 className={styles.title}>Projects</h2>
        <p className={styles.body}>
          This view lists the group&rsquo;s approved project records from the agent service. The
          service is not configured in this deployment: set <code>workerBaseUrl</code> in the
          site&rsquo;s static agent configuration to the deployed worker origin, rebuild, and
          reload. No project data is shown in this state.
        </p>
      </div>
    );
  }

  // 2 — not an approved caller: truthful sign-in states, never records.
  if (!approved) {
    const copy =
      identity === null
        ? "Checking sign-in status…"
        : identity.state === "unapproved"
          ? `Signed in${identity.id ? ` as ${identity.id}` : ""}, but your e-mail is not on an approved roster. Project records require a rostered owner or staff identity.`
          : identity.state === "network"
            ? "The agent service is unreachable right now. Use “Check again” when it is back."
            : "Sign in through Cloudflare Access at the agent service, then use “Check again”. No project records are shown without a verified identity.";
    return (
      <div className={styles.reserved}>
        <h2 className={styles.title}>Projects</h2>
        <p className={styles.body}>{copy}</p>
      </div>
    );
  }

  // 3 — approved: the fetch lifecycle (idle means the first fetch is in flight).
  if (fetchState.kind === "idle" || fetchState.kind === "loading") {
    return (
      <div className={styles.reserved}>
        <h2 className={styles.title}>Projects</h2>
        <div className={styles.skeleton} aria-hidden="true" />
        <div className={styles.skeleton} aria-hidden="true" />
        <p className={styles.body}>Loading project records…</p>
      </div>
    );
  }

  if (fetchState.kind === "error") {
    const text =
      fetchState.code === "authentication"
        ? "Your sign-in session was not verified for this request. Use “Check again” after signing in at the agent service."
        : fetchState.code === "unapproved"
          ? "Your identity is not on an approved roster; project records are unavailable."
          : fetchState.code === "network"
            ? "The agent service could not be reached. No records are shown rather than guessed."
            : "The agent service returned an unexpected response. No records are shown.";
    return (
      <div className={styles.reserved}>
        <h2 className={styles.title}>Projects</h2>
        <p className={styles.errorBody} role="alert">
          {text}
        </p>
        <Button variant="secondary" size="sm" onClick={retry}>
          Retry
        </Button>
      </div>
    );
  }

  // ready
  if (fetchState.projects.length === 0) {
    return (
      <div className={styles.reserved}>
        <h2 className={styles.title}>Projects</h2>
        <p className={styles.body}>No project records are currently authorized for display.</p>
      </div>
    );
  }
  const selected = selectedRef !== null ? fetchState.projects.find((p) => p.ref === selectedRef) : undefined;
  return (
    <div className={styles.result}>
      <div className={styles.resultHead}>
        <h2 className={styles.title}>Projects</h2>
        <span className={styles.resultMeta}>
          {fetchState.projects.length} approved records · read-only
        </span>
      </div>
      <ul className={styles.list}>
        {fetchState.projects.map((p) => (
          <li key={p.ref}>
            <button
              type="button"
              className={`${styles.row} ${selectedRef === p.ref ? styles.rowSelected : ""}`}
              aria-pressed={selectedRef === p.ref}
              onClick={() => setSelectedRef(selectedRef === p.ref ? null : p.ref)}
            >
              <div className={styles.rowMain}>
                <span className={styles.rowRef}>{p.ref}</span>
                <span className={styles.rowSector}>{p.sector}</span>
                {p.description ? <span className={styles.rowDescription}>{p.description}</span> : null}
              </div>
              <div className={styles.rowSide}>
                <span className={styles.rowLocation}>{p.location}</span>
                <StatusBadge tone={STATUS_TONE[p.status]}>{p.status.replace("_", " ")}</StatusBadge>
              </div>
            </button>
          </li>
        ))}
      </ul>
      {selected ? (
        <div className={styles.detail} aria-label={`Details for ${selected.ref}`}>
          <div className={styles.detailHead}>
            <div>
              <span className={styles.detailRef}>{selected.ref}</span>
              <h3 className={styles.detailTitle}>{selected.name}</h3>
            </div>
            <StatusBadge tone={STATUS_TONE[selected.status]}>{selected.status.replace("_", " ")}</StatusBadge>
          </div>
          <dl className={styles.detailGrid}>
            <div>
              <dt>Location</dt>
              <dd>{selected.location}</dd>
            </div>
            <div>
              <dt>Sector</dt>
              <dd>{selected.sector}</dd>
            </div>
            <div>
              <dt>Description</dt>
              <dd>{selected.description && selected.description.length > 0 ? selected.description : "Not provided in the record."}</dd>
            </div>
          </dl>
          <p className={styles.detailNote}>
            Only the fields above exist for this record. No further details are invented.
          </p>
        </div>
      ) : null}
    </div>
  );
}
