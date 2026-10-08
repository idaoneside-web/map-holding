/**
 * ============================================================================
 * MAP HOLDING — CLIENT PORTAL: LOCAL PERSISTENCE LAYER
 * ============================================================================
 *
 * All portal data that is not yet backed by a real server is stored in
 * `localStorage` under the `mh-portal:` prefix. Every function here is a pure
 * read/write around that key; no network calls are made.
 *
 * Honest constraints (read them before reaching for this module):
 *   - Data lives ONLY in the browser that wrote it. Clearing storage loses it.
 *   - Files are stored as base64 strings — subject to the ~5 MB quota.
 *   - Nothing here is encrypted, authenticated, or shared across devices.
 *   - When a real backend arrives, swap the implementations here and every
 *     caller continues to work unchanged.
 */

/* ===========================================================================
 * KEYS
 * ======================================================================== */

const PREFIX = "mh-portal:";

const KEY_USER = `${PREFIX}user`;
const KEY_DOCUMENTS = `${PREFIX}documents`;
const KEY_REPLIES = `${PREFIX}replies`;
const KEY_SETTINGS = `${PREFIX}settings`;

/* ===========================================================================
 * USER PROFILE
 * ======================================================================== */

export interface PortalUserEdit {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  country: string;
}

export function loadUserEdit(): PortalUserEdit | null {
  try {
    const raw = localStorage.getItem(KEY_USER);
    return raw ? (JSON.parse(raw) as PortalUserEdit) : null;
  } catch {
    return null;
  }
}

export function saveUserEdit(data: PortalUserEdit): void {
  localStorage.setItem(KEY_USER, JSON.stringify(data));
}

/* ===========================================================================
 * DOCUMENTS (uploaded files)
 * ======================================================================== */

export interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
}

export function loadUploadedDocuments(): UploadedDocument[] {
  try {
    const raw = localStorage.getItem(KEY_DOCUMENTS);
    return raw ? (JSON.parse(raw) as UploadedDocument[]) : [];
  } catch {
    return [];
  }
}

export function saveUploadedDocuments(docs: UploadedDocument[]): void {
  localStorage.setItem(KEY_DOCUMENTS, JSON.stringify(docs));
}

export function addUploadedDocument(doc: UploadedDocument): void {
  const existing = loadUploadedDocuments();
  saveUploadedDocuments([...existing, doc]);
}

export function removeUploadedDocument(id: string): void {
  const existing = loadUploadedDocuments().filter((d) => d.id !== id);
  saveUploadedDocuments(existing);
}

/* ===========================================================================
 * MESSAGE REPLIES
 * ======================================================================== */

export interface PortalReply {
  id: string;
  body: string;
  sentAt: string;
}

export function loadRepliesForThread(threadId: string): PortalReply[] {
  try {
    const raw = localStorage.getItem(`${PREFIX}replies-${threadId}`);
    return raw ? (JSON.parse(raw) as PortalReply[]) : [];
  } catch {
    return [];
  }
}

export function saveRepliesForThread(threadId: string, replies: PortalReply[]): void {
  localStorage.setItem(`${PREFIX}replies-${threadId}`, JSON.stringify(replies));
}

export function addReplyToThread(threadId: string, reply: PortalReply): void {
  const existing = loadRepliesForThread(threadId);
  saveRepliesForThread(threadId, [...existing, reply]);
}

/* ===========================================================================
 * SETTINGS
 * ======================================================================== */

export interface PortalSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  sessionTimeoutMinutes: number;
}

const DEFAULT_SETTINGS: PortalSettings = {
  emailNotifications: true,
  pushNotifications: false,
  sessionTimeoutMinutes: 30,
};

export function loadSettings(): PortalSettings {
  try {
    const raw = localStorage.getItem(KEY_SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: PortalSettings): void {
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
}

/* ===========================================================================
 * SEED SAMPLE DOCUMENTS (so the list is never empty in preview)
 * ======================================================================== */

/**
 * Seeded sample documents are returned once per session so that refreshes
 * populate the in-memory list without overwriting user-uploaded files.
 */
let seedApplied = false;

export function ensureSeedDocuments(): void {
  if (seedApplied) return;
  seedApplied = true;
  // No server-side seed needed — the portal.ts fixtures already populate the
  // initial view. This hook exists for any component that reads from storage
  // and would otherwise start empty on a cold visit.
}