/**
 * MAP HOLDING — PUBLIC PROJECTS
 *
 * Approved project records for the public Projects page.
 *
 * Each record contains only information confirmed by MAP Holding.
 * No investment amounts, returns, partners, licences, production volumes,
 * or operational claims are invented here.
 */

export type ProjectStatus = "AVAILABLE" | "UNDER REVIEW" | "COMING SOON";

export interface ProjectRecord {
  /** The official project identifier. */
  readonly ref: string;
  /** Full project name as approved. */
  readonly name: string;
  /** Location — use exact approved value (Nigeria or West Africa). */
  readonly location: string;
  /** Project category / commodity. */
  readonly sector: string;
  /** Current status. */
  readonly status: ProjectStatus;
  /** Optional short description — leave empty if none supplied. */
  readonly description?: string;
}

/**
 * The six approved project records.
 *
 * Maintained in declaration order. Do not reorder without MAP Holding confirmation.
 */
export const PROJECTS: readonly ProjectRecord[] = [
  {
    ref: "GOLD PROJECT 001",
    name: "GOLD PROJECT 001",
    location: "Nigeria",
    sector: "Alluvial Gold",
    status: "AVAILABLE",
  },
  {
    ref: "GOLD PROJECT 002",
    name: "GOLD PROJECT 002",
    location: "Nigeria",
    sector: "Gold",
    status: "UNDER REVIEW",
  },
  {
    ref: "GOLD PROJECT 003",
    name: "GOLD PROJECT 003",
    location: "Nigeria",
    sector: "Gold",
    status: "COMING SOON",
  },
  {
    ref: "DEVELOPMENT PROJECT 001",
    name: "DEVELOPMENT PROJECT 001",
    location: "West Africa",
    sector: "Commercial & Residential",
    status: "COMING SOON",
  },
  {
    ref: "ENERGY PROJECT 001",
    name: "ENERGY PROJECT 001",
    location: "Nigeria",
    sector: "Renewable Energy",
    status: "COMING SOON",
  },
  {
    ref: "LITHIUM PROJECT 001",
    name: "LITHIUM PROJECT 001",
    location: "West Africa",
    sector: "Lithium Mining",
    status: "COMING SOON",
  },
] as const;
