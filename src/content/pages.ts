/**
 * MAP HOLDING — PUBLIC PAGE SCAFFOLD DEFINITIONS (Phase 3 §6).
 *
 * Phase 3 proves routing, the shell, typography, section structure and imagery
 * slots. It deliberately contains **no editorial or business content**: the
 * `heading` values below are structural section names, `note` values describe
 * the *site structure* (never a business claim), and every item of actual
 * corporate content is listed in `placeholders` so it is visibly outstanding.
 *
 * Nothing here may be turned into a claim about MAP Holding's business.
 */

export type ImageRatio = "16/9" | "4/3" | "3/2" | "1/1" | "3/4";

export interface ImageSlotSpec {
  /** What the slot will hold. Never invented imagery — a labelled empty frame. */
  readonly label: string;
  readonly ratio: ImageRatio;
}

export interface ScaffoldSection {
  /** Structural section name. Not marketing copy. */
  readonly heading: string;
  /** A short, factual note about what the page will contain. Never a claim. */
  readonly note: string;
  /** Named content items MAP Holding must supply before this section is real. */
  readonly placeholders: readonly string[];
  /** Reserved imagery frames, if this section is image-led. */
  readonly imageSlots?: readonly ImageSlotSpec[];
  /** Rendered as an `EmptyState` rather than invented list content. */
  readonly emptyState?: {
    readonly title: string;
    readonly body: string;
  };
}

export interface PageScaffoldDefinition {
  readonly slug: string;
  readonly href: string;
  /** Visible page title. */
  readonly title: string;
  readonly eyebrow: string;
  /** One structural sentence. Not a claim about the business. */
  readonly intro: string;
  readonly sections: readonly ScaffoldSection[];
}

const PAGE_ABOUT: PageScaffoldDefinition = {
  slug: "about",
  href: "/about",
  title: "About MAP Holding",
  eyebrow: "The Group",
  intro:
    "This route is in place with the approved MAP Holding shell. The corporate narrative is editorial content and has not been supplied yet.",
  sections: [
    {
      heading: "Group narrative",
      note: "Reserved for the story, vision and mission of the group, authored by MAP Holding.",
      placeholders: [
        "Founding story",
        "Vision and mission statements",
        "Operating philosophy",
        "Global positioning",
      ],
    },
    {
      heading: "Timeline",
      note: "A structured chronology of milestones. Every entry is factual content owned by MAP Holding.",
      placeholders: ["Milestone dates", "Milestone descriptions"],
      emptyState: {
        title: "No milestones published",
        body: "Timeline entries will appear here once MAP Holding supplies confirmed dates and descriptions.",
      },
    },
    {
      heading: "Leadership",
      note: "Reserved for leadership profiles and portraits.",
      placeholders: ["Names and roles", "Biographies", "Portraits"],
      imageSlots: [
        { label: "Leadership portrait", ratio: "3/4" },
        { label: "Leadership portrait", ratio: "3/4" },
        { label: "Leadership portrait", ratio: "3/4" },
      ],
    },
  ],
};

const PAGE_PROJECTS: PageScaffoldDefinition = {
  slug: "projects",
  href: "/projects",
  title: "Projects",
  eyebrow: "Portfolio",
  intro:
    "The portfolio and opportunity index structure is in place. Project and opportunity records have not been supplied yet.",
  sections: [
    {
      heading: "Project index",
      note: "A filterable index rendered from the typed Project model defined in Phase 1 §G.2.",
      placeholders: [
        "Project titles",
        "Locations",
        "Status values",
        "Project imagery",
        "Verified metrics only",
      ],
      imageSlots: [
        { label: "Featured project", ratio: "3/2" },
        { label: "Project thumbnail", ratio: "4/3" },
        { label: "Project thumbnail", ratio: "4/3" },
      ],
    },
    {
      heading: "Opportunities",
      note: "Strategic opportunities carry a visibility class (see the access architecture) and are never published by default.",
      placeholders: ["Opportunity titles", "Eligibility criteria", "Visibility class per record"],
      emptyState: {
        title: "No opportunities published",
        body: "Opportunity records will appear here once supplied and explicitly marked public. Client- and partner-scoped records are never rendered on a public route.",
      },
    },
  ],
};

const PAGE_BUSINESS_AREAS: PageScaffoldDefinition = {
  slug: "business-areas",
  href: "/business-areas",
  title: "Business Areas",
  eyebrow: "Sectors",
  intro:
    "The sector index structure is in place. Sector records are editorial content and have not been supplied yet.",
  sections: [
    {
      heading: "Sector index",
      note: "One card per business area, rendered from the typed BusinessArea model defined in Phase 1 §G.1.",
      placeholders: [
        "Sector names and taglines",
        "Sector descriptions",
        "Sector capabilities",
        "Sector imagery",
      ],
      emptyState: {
        title: "No business areas published",
        body: "Sector cards will render here from typed records once MAP Holding supplies the content.",
      },
    },
    {
      heading: "Sector detail template",
      note: "A single reusable detail layout for every sector, driven by data rather than bespoke pages.",
      placeholders: ["Overview copy", "Capability lists", "Related projects"],
      imageSlots: [
        { label: "Sector hero", ratio: "16/9" },
        { label: "Sector detail", ratio: "4/3" },
      ],
    },
  ],
};

const PAGE_PARTNERSHIPS: PageScaffoldDefinition = {
  slug: "partnerships",
  href: "/partnerships",
  title: "Partnerships",
  eyebrow: "Collaboration",
  intro:
    "The partnership positioning structure is in place. Partner identities and relationship detail have not been supplied yet.",
  sections: [
    {
      heading: "Partnership positioning",
      note: "Reserved for MAP Holding's approach to strategic collaboration.",
      placeholders: ["Positioning copy", "Partnership models"],
    },
    {
      heading: "Partner register",
      note: "A partner register rendered from the typed Partner model. Only partners with written publication approval may appear here.",
      placeholders: [
        "Partner names",
        "Partner logos",
        "Relationship descriptions",
        "Publication approval",
      ],
      emptyState: {
        title: "No partners published",
        body: "Partner entries appear only where MAP Holding holds explicit approval to publish the relationship and the mark.",
      },
    },
  ],
};

const PAGE_CONTACT: PageScaffoldDefinition = {
  slug: "contact",
  href: "/contact",
  title: "Contact",
  eyebrow: "Enquiries",
  intro:
    "The contact layout is in place. Corporate contact details and the enquiry form backend are not yet supplied or implemented.",
  sections: [
    {
      heading: "Enquiry routing",
      note: "Reserved for how enquiries are directed to the right part of the group.",
      placeholders: ["Routing description", "Office locations"],
    },
    {
      heading: "Contact details",
      note: "Deliberately empty. No address, telephone number or email address is invented anywhere in this project.",
      placeholders: [
        "Registered office address",
        "Business telephone number",
        "General enquiries email",
        "Press enquiries email",
      ],
    },
    {
      heading: "Contact form",
      note: "Front-end form UI arrives in a later phase, together with server-side validation and delivery. No form is rendered here and no submission endpoint exists.",
      placeholders: ["Form fields", "Validation rules", "Delivery destination"],
      emptyState: {
        title: "Form not yet implemented",
        body: "A contact form requires a real delivery endpoint. Until that exists, this section stays an intentional placeholder rather than a non-functional form.",
      },
    },
  ],
};

export const pageScaffolds: readonly PageScaffoldDefinition[] = [
  PAGE_ABOUT,
  PAGE_BUSINESS_AREAS,
  PAGE_PROJECTS,
  PAGE_PARTNERSHIPS,
  PAGE_CONTACT,
];

export function getPageScaffold(slug: string): PageScaffoldDefinition | undefined {
  return pageScaffolds.find((page) => page.slug === slug);
}

/**
 * Fails the build if a route asks for a scaffold that was never registered.
 * Preferring a loud build error over a silently empty page.
 */
export function requirePageScaffold(slug: string): PageScaffoldDefinition {
  const page = getPageScaffold(slug);
  if (!page) {
    throw new Error(
      `No page scaffold registered for "${slug}". Add it to pageScaffolds in src/content/pages.ts.`,
    );
  }
  return page;
}
