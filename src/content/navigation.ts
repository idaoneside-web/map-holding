/**
 * MAP HOLDING — SITE CONTENT: navigation, footer groups and legal links.
 *
 * This is configuration, not editorial content. No address, phone number,
 * registration number or legal claim is invented anywhere in this project:
 * anything not yet supplied by MAP Holding is represented by a
 * `ContentPlaceholder` and marked `status: "placeholder"` here.
 */

/** Every public destination, with an honest status. */
export type DestinationStatus =
  /** Route exists and is real. */
  | "live"
  /** Route exists as a controlled placeholder pending editorial content. */
  | "placeholder"
  /** Route exists as a gated entry point; the product behind it is a later phase. */
  | "protected";

export interface Destination {
  readonly label: string;
  readonly href: string;
  readonly status: DestinationStatus;
  /** Short description used by the mobile drawer and section headers. */
  readonly description?: string;
}

/**
 * Primary public navigation (Phase 3 §2). Exactly the approved MAP Holding
 * structure, in order. Founding Partners is deliberately absent — it is a
 * separate protected destination, not a public nav item.
 */
export const primaryNav: readonly Destination[] = [
  { label: "Home", href: "/", status: "live" },
  { label: "About", href: "/about", status: "live" },
  { label: "Business Areas", href: "/business-areas", status: "live" },
  { label: "Projects", href: "/projects", status: "live" },
  { label: "Partnerships", href: "/partnerships", status: "live" },
  { label: "Contact", href: "/contact", status: "live" },
];

/** The gated entry points. Kept out of the primary nav on purpose. */
export const clientPortal: Destination = {
  label: "Login",
  href: "/client-portal",
  status: "protected",
  description: "Authorized client access",
};

export const foundingPartners: Destination = {
  label: "Founding Partners",
  href: "/founding-partners",
  status: "protected",
  description: "Protected programme access",
};

/**
 * The internal environment for MAP Holding personnel.
 *
 * It is a distinct protected namespace and is deliberately NOT an item in the
 * client portal navigation: an internal or administrator user has their own
 * environment, and a client account can never reach it.
 */
export const internalEnvironment: Destination = {
  label: "Internal Environment",
  href: "/internal",
  status: "protected",
  description: "MAP Holding personnel access",
};

export interface FooterGroup {
  readonly title: string;
  readonly items: readonly Destination[];
}

/**
 * Footer navigation groups. Only destinations that actually exist are listed —
 * there are no dead links anywhere in the shell (Phase 3 §2).
 */
export const footerGroups: readonly FooterGroup[] = [
  {
    title: "Company",
    items: [
      { label: "About", href: "/about", status: "live" },
      { label: "Partnerships", href: "/partnerships", status: "live" },
      { label: "Contact", href: "/contact", status: "live" },
    ],
  },
  {
    title: "Business",
    items: [
      { label: "Business Areas", href: "/business-areas", status: "live" },
      { label: "Projects", href: "/projects", status: "live" },
    ],
  },
  {
    title: "Access",
    items: [
      { label: "Login", href: "/client-portal", status: "protected" },
      { label: "Founding Partners", href: "/founding-partners", status: "protected" },
      { label: "Internal Environment", href: "/internal", status: "protected" },
    ],
  },
];

/** Legal destinations rendered in the LegalBar. */
export const legalNav: readonly Destination[] = [
  { label: "Privacy", href: "/legal/privacy", status: "placeholder" },
  { label: "Terms", href: "/legal/terms", status: "placeholder" },
  { label: "Cookies", href: "/legal/cookies", status: "placeholder" },
];

/** Slugs served by the controlled legal placeholder template. */
export const legalSlugs = ["privacy", "terms", "cookies"] as const;
export type LegalSlug = (typeof legalSlugs)[number];

export function isLegalSlug(value: string): value is LegalSlug {
  return (legalSlugs as readonly string[]).includes(value);
}

/** The brand statement. Rendered exactly as the identity board tracks it. */
export const BRAND_STATEMENT = "People • Resources • Opportunity";
export const BRAND_STATEMENT_UPPER = "PEOPLE • RESOURCES • OPPORTUNITY";
export const BRAND_NAME = "MAP Holding";
