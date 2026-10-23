/**
 * MAP HOLDING — BUSINESS AGENT: LOCAL DEVELOPMENT CONFIGURATION.
 *
 * The ONLY place local development identities come from. Rules:
 *   - Roles are granted exclusively through the roster file (default:
 *     worker/local/dev-users.json). That file is gitignored; the committed
 *     template contains no real people. Default state = empty roster =
 *     nobody can sign in (fail closed).
 *   - No default e-mail address, no default person, no hardcoded role.
 *   - Everything is environment/loopback scoped; `assertDevOnly()` makes it
 *     impossible to start this server with NODE_ENV=production.
 */

import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { createSessionSecret } from "./session.ts";

export interface RosterUser {
  readonly email: string;
  readonly kind: "owner" | "staff" | "client";
}

export interface LocalDevConfig {
  readonly host: string;
  readonly port: number;
  /** Set the `Secure` cookie flag (use when fronted by HTTPS). */
  readonly secureCookies: boolean;
  /** The session HMAC secret (per-boot random or MH_AGENT_DEV_SECRET). */
  readonly secret: string;
  /** Exact lowercase e-mail addresses mapped to each principal kind. */
  readonly owners: readonly string[];
  readonly staff: readonly string[];
  /** Client-assistant surface only; never grants internal access. */
  readonly clients: readonly string[];
  /** Exact origins allowed for cross-origin requests (CORS + CSRF). */
  readonly origins: readonly string[];
  readonly usersFile: string;
}

/** Refuse to run as a "production" deployment. The local server is a
 * development tool and nothing else. */
export function assertDevOnly(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "The local development agent server refuses to start in production mode. " +
        "Set NODE_ENV to \"development\" (or unset it). Local authentication must never " +
        "run in a deployed environment.",
    );
  }
}

/** Parses and validates a roster document. Unknown kinds / malformed entries
 * are dropped; the result can only ever be an allow-list, never a wildcard. */
export function parseRoster(doc: unknown): {
  owners: string[];
  staff: string[];
  clients: string[];
} {
  const owners: string[] = [];
  const staff: string[] = [];
  const clients: string[] = [];
  let list: unknown[] = [];
  if (Array.isArray(doc)) list = doc;
  else if (typeof doc === "object" && doc !== null) {
    const maybe = (doc as { users?: unknown }).users;
    if (Array.isArray(maybe)) list = maybe;
  }
  for (const entry of list) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as { email?: unknown; kind?: unknown };
    if (typeof e.email !== "string" || e.email.trim().length === 0) continue;
    const email = e.email.trim().toLowerCase();
    if (e.kind === "owner" && !owners.includes(email)) owners.push(email);
    else if (e.kind === "staff" && !staff.includes(email)) staff.push(email);
    else if (e.kind === "client" && !clients.includes(email)) clients.push(email);
  }
  return { owners, staff, clients };
}

/** Loads the roster file if it exists; a missing file means "nobody". */
export function loadRoster(file: string): { owners: string[]; staff: string[]; clients: string[] } {
  if (!existsSync(file)) return { owners: [], staff: [], clients: [] };
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return { owners: [], staff: [], clients: [] }; // unreadable ⇒ fail closed
  }
  return parseRoster(raw);
}

export function loadLocalDevConfig(env: NodeJS.ProcessEnv = process.env): LocalDevConfig {
  const secretRaw = (env.MH_AGENT_DEV_SECRET ?? "").trim();
  const secret = secretRaw.length > 0 ? secretRaw : createSessionSecret();
  const origins = (env.MH_AGENT_DEV_ORIGINS ?? "")
    .split(/\s+/)
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter((o) => o.length > 0 && o !== "*");
  const usersFile = env.MH_AGENT_DEV_USERS_FILE?.trim() || "worker/local/dev-users.json";
  const roster = loadRoster(usersFile);
  return {
    host: env.MH_AGENT_DEV_HOST?.trim() || "127.0.0.1",
    port: parsePort(env.MH_AGENT_DEV_PORT),
    secureCookies: env.MH_AGENT_DEV_SECURE_COOKIES === "1",
    secret,
    owners: roster.owners,
    staff: roster.staff,
    clients: roster.clients,
    origins,
    usersFile,
  };
}

function parsePort(value: string | undefined): number {
  if (!value) return 3300;
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n > 0 && n < 65536 ? n : 3300;
}
