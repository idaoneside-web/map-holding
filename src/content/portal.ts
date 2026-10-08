/**
 * MAP HOLDING — CLIENT PORTAL: typed model + development fixtures.
 *
 * ---------------------------------------------------------------------------
 * HONESTY CONTRACT
 * ---------------------------------------------------------------------------
 * This file is the ONLY place portal sample data lives, and every value in it is
 * a *sample fixture for UI development* — not a real MAP Holding client record,
 * not a real project, and not a business claim.
 *
 *   - No real person, company, address, telephone number or project is described.
 *   - The contact email uses the RFC-2606 reserved `example.com` domain, so it can
 *     never resolve to a real mailbox.
 *   - The client organisation is named literally "Sample Client Organisation".
 *   - Project records carry `isSample: true` and render through the same placeholder
 *     primitives the rest of the site uses (`ImageSlot`, "not yet supplied").
 *
 * The environment itself is a non-indexed, unauthenticated *preview*. There is no
 * session, no backend and no authorization here; the real boundary is the settled
 * contract in `src/lib/access` (see docs/ACCESS-CONTROL-ARCHITECTURE.md).
 *
 * When the real portal backend arrives, this module is replaced by server-side
 * reads. Nothing in the UI assumes where the data comes from.
 */

/* ===========================================================================
 * PREVIEW NOTICE
 * ======================================================================== */

export const PORTAL_PREVIEW = {
  /** Short label rendered in the shell's top bar. */
  label: "Preview",
  /** The persistent, unambiguous statement shown in the environment. */
  notice:
    "Client environment preview. Not indexed, not authenticated, and every record shown is sample data for interface development — not a real client record.",
} as const;

/* ===========================================================================
 * PRINCIPAL / ACCOUNT
 * ======================================================================== */

export interface PortalUser {
  readonly firstName: string;
  readonly lastName: string;
  readonly fullName: string;
  /** The client organisation. Deliberately a sample name — never a real entity. */
  readonly company: string;
  readonly email: string;
  /** Deliberately a placeholder number, not a real telephone. */
  readonly phone: string;
  readonly country: string;
  /** Account reference the client would quote to MAP Holding. */
  readonly accountRef: string;
  /** Human-readable membership date. */
  readonly clientSince: string;
}

export const portalUser: PortalUser = {
  firstName: "Alex",
  lastName: "Morgan",
  fullName: "Alex Morgan",
  company: "Sample Client Organisation",
  email: "alex.morgan@example.com",
  phone: "+00 000 000 000",
  country: "Not yet supplied",
  accountRef: "MH-CL-0000",
  clientSince: "Not yet supplied",
};

/**
 * Returns the user's editable profile fields, merging any locally-saved edits
 * with the sample fixture. This is a *preview* only — no real identity provider
 * exists yet.
 */
export function getPortalUser(): PortalUser {
  const edit = typeof window !== "undefined"
    ? (() => {
        try { return JSON.parse(localStorage.getItem("mh-portal:user") ?? "null"); }
        catch { return null; }
      })()
    : null;
  if (!edit) return portalUser;
  const fullName = `${edit.firstName} ${edit.lastName}`.trim();
  return {
    ...portalUser,
    firstName: edit.firstName,
    lastName: edit.lastName,
    fullName,
    company: edit.company,
    email: edit.email,
    phone: edit.phone,
    country: edit.country,
  };
}

/* ===========================================================================
 * NAVIGATION
 * ======================================================================== */

export type PortalGlyphName =
  | "dashboard"
  | "projects"
  | "applications"
  | "documents"
  | "messages"
  | "profile"
  | "settings"
  | "signout";

export interface PortalNavItem {
  readonly label: string;
  readonly href: string;
  readonly glyph: PortalGlyphName;
  /** Optional unread / attention count surfaced as a quiet marker. */
  readonly badge?: number;
}

/**
 * The seven portal destinations (Phase 4 scope). Sign out is an action, not a
 * destination, so it is rendered as a control rather than a link.
 */
export const portalNav: readonly PortalNavItem[] = [
  { label: "Dashboard", href: "/client-portal/dashboard", glyph: "dashboard" },
  { label: "My Projects", href: "/client-portal/projects", glyph: "projects" },
  { label: "My Applications", href: "/client-portal/applications", glyph: "applications" },
  { label: "My Documents", href: "/client-portal/documents", glyph: "documents" },
  { label: "Messages", href: "/client-portal/messages", glyph: "messages", badge: 2 },
  { label: "Profile", href: "/client-portal/profile", glyph: "profile" },
  { label: "Settings", href: "/client-portal/settings", glyph: "settings" },
];

/* ===========================================================================
 * METRICS
 * ======================================================================== */

export interface PortalMetric {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly href: string;
  /** Optional one-line qualifier under the value. */
  readonly hint?: string;
}

export const portalMetrics: readonly PortalMetric[] = [
  { id: "projects", label: "My Projects", value: 1, href: "/client-portal/projects" },
  { id: "applications", label: "Applications", value: 1, href: "/client-portal/applications" },
  { id: "documents", label: "Documents", value: 4, href: "/client-portal/documents" },
  {
    id: "messages",
    label: "Messages",
    value: 2,
    href: "/client-portal/messages",
    hint: "2 unread",
  },
];

/* ===========================================================================
 * APPLICATIONS — guided four-stage process
 * ======================================================================== */

/**
 * Stage state vocabulary. `active` is where the client is now; `attention`
 * means the client must act before the process can continue; `upcoming` means
 * not yet reached.
 */
export type StageState = "complete" | "active" | "attention" | "upcoming";

export interface ApplicationStage {
  readonly id: string;
  readonly label: string;
  readonly state: StageState;
  /** Short, factual note about this stage. */
  readonly note?: string;
}

export interface PortalApplication {
  readonly id: string;
  readonly reference: string;
  readonly title: string;
  /** Human-readable item the application concerns. */
  readonly subject: string;
  readonly submittedOn: string;
  readonly status: string;
  readonly stages: readonly ApplicationStage[];
}

/** The four stages every application moves through, in order. */
export const APPLICATION_STAGE_LABELS = ["Application", "Documents", "Review", "Decision"] as const;

export const portalApplications: readonly PortalApplication[] = [
  {
    id: "app-00482",
    reference: "#00482",
    title: "Sample application",
    subject: "Gold Project 001",
    submittedOn: "Not yet supplied",
    status: "Under review",
    stages: [
      { id: "application", label: "Application", state: "complete", note: "Submitted" },
      { id: "documents", label: "Documents", state: "complete", note: "All received" },
      { id: "review", label: "Review", state: "active", note: "In progress with MAP Holding" },
      { id: "decision", label: "Decision", state: "upcoming", note: "Not yet reached" },
    ],
  },
];

/* ===========================================================================
 * PROJECTS
 * ======================================================================== */

export type ProjectStatus = "active" | "in-review" | "pipeline" | "complete";

export interface PortalProject {
  readonly id: string;
  readonly ref: string;
  readonly name: string;
  readonly sector: string;
  readonly location: string;
  readonly status: ProjectStatus;
  readonly statusLabel: string;
  readonly description: string;
  /** Application reference, when this project has one. */
  readonly applicationRef?: string;
  /** Label for the reserved imagery frame — never invented imagery. */
  readonly imageLabel: string;
  /** Always true until real MAP Holding project material is supplied. */
  readonly isSample: boolean;
}

export const portalProjects: readonly PortalProject[] = [
  {
    id: "project-001",
    ref: "PRJ-001",
    name: "Gold Project 001",
    sector: "Not yet supplied",
    location: "Not yet supplied",
    status: "in-review",
    statusLabel: "Under review",
    description:
      "Sample project record demonstrating the client environment. Real project detail is supplied by MAP Holding and does not appear until it does.",
    applicationRef: "#00482",
    imageLabel: "Project visual — awaiting MAP Holding material",
    isSample: true,
  },
  {
    id: "project-002",
    ref: "PRJ-002",
    name: "Project 002",
    sector: "Not yet supplied",
    location: "Not yet supplied",
    status: "pipeline",
    statusLabel: "Positioned",
    description:
      "Sample project record. Shown to demonstrate how additional projects appear to a client.",
    imageLabel: "Project visual — awaiting MAP Holding material",
    isSample: true,
  },
];

/* ===========================================================================
 * DOCUMENTS
 * ======================================================================== */

export type DocumentStatus = "available" | "awaiting" | "action-required" | "under-review";

export type DocumentRequirement = "required" | "optional";

export interface PortalDocument {
  readonly id: string;
  readonly name: string;
  /** Grouping key — documents are grouped by purpose, not by type. */
  readonly group: string;
  readonly status: DocumentStatus;
  readonly statusLabel: string;
  readonly date: string;
  readonly requirement: DocumentRequirement;
  /** Label for the available action, or `null` when none is possible yet. */
  readonly action: string | null;
}

export const portalDocuments: readonly PortalDocument[] = [
  {
    id: "doc-environmental",
    name: "Environmental Commitment",
    group: "Required to proceed",
    status: "action-required",
    statusLabel: "Awaiting your submission",
    date: "Not yet supplied",
    requirement: "required",
    action: "Upload",
  },
  {
    id: "doc-identity",
    name: "Proof of identity",
    group: "Required to proceed",
    status: "available",
    statusLabel: "Received",
    date: "Not yet supplied",
    requirement: "required",
    action: "View",
  },
  {
    id: "doc-application-form",
    name: "Application form",
    group: "Required to proceed",
    status: "under-review",
    statusLabel: "Under review",
    date: "Not yet supplied",
    requirement: "required",
    action: "View",
  },
  {
    id: "doc-company-profile",
    name: "Company profile",
    group: "Supporting material",
    status: "available",
    statusLabel: "Received",
    date: "Not yet supplied",
    requirement: "optional",
    action: "View",
  },
];

/* ===========================================================================
 * MESSAGES
 *
 * NOTE ON AGNES: no chat assistant is wired up here, deliberately. Agnes is only
 * relevant where a real chat function exists, and no chat backend exists in this
 * phase. When one is added, its API token stays SERVER-SIDE (an environment
 * variable read by a server route — never shipped to the browser), and every
 * request it makes must pass through the same `evaluateAccess()` authorization
 * path as the rest of the portal, so it can never surface another client's data
 * or any internal/admin/confidential MAP Holding material.
 * ======================================================================== */

export interface PortalMessageThread {
  readonly id: string;
  readonly from: string;
  readonly subject: string;
  /** Short preview line for the conversation list. */
  readonly preview: string;
  /** Full body, split into paragraphs. Sample copy only. */
  readonly body: readonly string[];
  readonly receivedAt: string;
  readonly unread: boolean;
}

export const portalMessages: readonly PortalMessageThread[] = [
  {
    id: "msg-0001",
    from: "MAP Holding — Client Services",
    subject: "Your application is now under review",
    preview: "We have moved your application into review and will be in touch with the next step.",
    body: [
      "Thank you for submitting your documents. Your application is now with the MAP Holding review team.",
      "We will contact you here if anything further is required, and whenever the status of your application changes.",
      "This message is sample content shown to demonstrate the client environment.",
    ],
    receivedAt: "Not yet supplied",
    unread: true,
  },
  {
    id: "msg-0002",
    from: "MAP Holding — Client Services",
    subject: "One document still required",
    preview: "An Environmental Commitment is outstanding before your application can proceed.",
    body: [
      "Before your application can move to a decision, an Environmental Commitment needs to be submitted.",
      "You can add it from the Documents area of your client environment.",
      "This message is sample content shown to demonstrate the client environment.",
    ],
    receivedAt: "Not yet supplied",
    unread: true,
  },
  {
    id: "msg-0003",
    from: "MAP Holding — Client Services",
    subject: "Welcome to your MAP Holding client environment",
    preview: "Your access is active. Here is where you will find your projects and documents.",
    body: [
      "Your MAP Holding client environment is ready. This is where your applications, projects, documents and messages with MAP Holding are brought together.",
      "This message is sample content shown to demonstrate the client environment.",
    ],
    receivedAt: "Not yet supplied",
    unread: false,
  },
];

/* ===========================================================================
 * ATTENTION / ACTIVITY
 * ======================================================================== */

export interface PortalNextAction {
  readonly title: string;
  readonly detail: string;
  readonly actionLabel: string;
  readonly actionHref: string;
}

export const portalNextAction: PortalNextAction = {
  title: "Environmental Commitment",
  detail:
    "Required — not yet submitted. Your application cannot proceed to a decision until it is received.",
  actionLabel: "View documents",
  actionHref: "/client-portal/documents",
};

export interface PortalActivityEntry {
  readonly id: string;
  readonly text: string;
  readonly when: string;
}

export const portalActivity: readonly PortalActivityEntry[] = [
  { id: "act-1", text: "Application #00482 moved to review", when: "Sample timestamp" },
  { id: "act-2", text: "Proof of identity received", when: "Sample timestamp" },
  { id: "act-3", text: "New message from MAP Holding", when: "Sample timestamp" },
];

/* ===========================================================================
 * HELPERS
 * ======================================================================== */

export function getPortalThread(id: string): PortalMessageThread | undefined {
  return portalMessages.find((thread) => thread.id === id);
}

/* ===========================================================================
 * USER-EDITABLE PROFILE SHAPE
 * ======================================================================== */

export interface PortalUserEditForm {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  country: string;
}

export function toUserEditForm(user: PortalUser): PortalUserEditForm {
  const [first, ...rest] = user.fullName.split(" ");
  return {
    firstName: first ?? "",
    lastName: rest.join(" "),
    company: user.company,
    email: user.email,
    phone: user.phone,
    country: user.country,
  };
}
