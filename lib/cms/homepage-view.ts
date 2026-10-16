import type { Homepage, Media, PortfolioProject, ServiceCategory, Solution } from "@/payload-types";
import type { ProjectSummary } from "@/components/site/project-entry";
import {
  categories as staticCategories,
  projects as staticProjects,
  solutions as staticSolutions,
} from "@/lib/content";
import { staticPhoto, type PhotoSource } from "@/lib/images";
import { site } from "@/lib/site";
import { approvedHomepage } from "./homepage-approved";

// The homepage as the page component renders it. Empty strings and lists mean
// "render nothing": a published empty field is never replaced by defaults.

export type LinkView = { label: string; href: string };
export type CategoryView = { slug: string; number: string; title: string; description: string };
export type IndustryView = { slug: string; label: string; title: string; summary: string };
export type StepView = { title: string; description: string };

export type HomepageView = {
  hero: {
    eyebrow: string;
    headingLines: string[];
    headingAccent: string;
    description: string;
    primaryLink: LinkView | null;
    secondaryLink: LinkView | null;
    scrollLabel: string;
    image: PhotoSource | null;
    imageCaption: string;
  };
  introduction: {
    enabled: boolean;
    eyebrow: string;
    locationLines: string[];
    headingLines: string[];
    headingMuted: string;
    body: string;
    link: LinkView | null;
  };
  services: {
    enabled: boolean;
    eyebrow: string;
    headingLines: string[];
    sideTextLines: string[];
    link: LinkView | null;
    featureImage: PhotoSource | null;
    featureCaption: string;
    categories: CategoryView[];
  };
  industries: {
    enabled: boolean;
    eyebrow: string;
    headingLines: string[];
    sideTextLines: string[];
    link: LinkView | null;
    items: IndustryView[];
  };
  engineering: {
    enabled: boolean;
    eyebrow: string;
    headingLines: string[];
    body: string;
    link: LinkView | null;
    image: PhotoSource | null;
    capabilities: string[];
  };
  portfolio: {
    enabled: boolean;
    eyebrow: string;
    headingLines: string[];
    sideTextLines: string[];
    link: LinkView | null;
    projects: ProjectSummary[];
  };
  approach: {
    enabled: boolean;
    eyebrow: string;
    headingLines: string[];
    body: string;
    steps: StepView[];
  };
  academy: {
    enabled: boolean;
    eyebrow: string;
    headingLines: string[];
    body: string;
    statusLabel: string;
    link: LinkView | null;
    image: PhotoSource | null;
  };
  contact: { enabled: boolean; eyebrow: string; headingLines: string[] };
};

type Text = string | null | undefined;
type LinkInput = { label?: Text; href?: Text } | null | undefined;

export const text = (value: Text) => (value ?? "").trim();

/** Splits on the line breaks an editor typed. */
export const toLines = (value: Text) =>
  text(value) ? text(value).split(/\r?\n/).map((line) => line.trim()) : [];

/** A link needs both a label and a destination. */
export const toLink = (group: LinkInput): LinkView | null => {
  const label = text(group?.label);
  const href = text(group?.href);
  return label && href ? { label, href } : null;
};

/** The first three modules, as on the industry cards ("." is added when rendered). */
export const industrySummary = (modules: string[]) => modules.slice(0, 3).join(". ");

export const projectLinkLabel = (type: string) =>
  type === "Product concepts" ? "Explore the concept" : "View the project";

const isDoc = <T extends object>(value: number | T | null | undefined): value is T =>
  typeof value === "object" && value !== null;

/** Payload media URLs on this site's origin become root-relative paths. */
export function mediaPath(url: string) {
  try {
    const parsed = new URL(url, site.url);
    return parsed.origin === new URL(site.url).origin ? parsed.pathname + parsed.search : url;
  } catch {
    return url;
  }
}

/**
 * A CMS image with its generated WebP sizes. A WebP original wider than every
 * size is offered too, as the prototype offers its full-size WebP.
 * Unreadable or broken media gives null.
 */
export function mediaPhoto(media: number | Media | null | undefined): PhotoSource | null {
  if (!isDoc(media) || !media.url || !media.width || !media.height) return null;
  const sizes = [media.sizes?.small, media.sizes?.medium, media.sizes?.large].filter(
    (size): size is { url: string; width: number; mimeType: string } =>
      Boolean(size?.url && size.width && size.mimeType === "image/webp"),
  );
  if (media.mimeType === "image/webp" && sizes.every((size) => size.width < media.width!)) {
    sizes.push({ url: media.url, width: media.width, mimeType: media.mimeType });
  }
  return {
    src: mediaPath(media.url),
    srcSet: sizes.map((size) => `${mediaPath(size.url)} ${size.width}w`).join(", "),
    width: media.width,
    height: media.height,
    alt: media.alt,
  };
}

// Field values as stored in the Homepage global, with relations already
// resolved. Both the CMS path and the approved fallback pass through here.
type SectionsInput = {
  hero: {
    eyebrow?: Text;
    heading?: Text;
    headingAccent?: Text;
    description?: Text;
    primaryLink?: LinkInput;
    secondaryLink?: LinkInput;
    scrollLabel?: Text;
    imageCaption?: Text;
  };
  introduction?: {
    enabled?: boolean | null;
    eyebrow?: Text;
    location?: Text;
    heading?: Text;
    headingMuted?: Text;
    body?: Text;
    link?: LinkInput;
  };
  services?: {
    enabled?: boolean | null;
    eyebrow?: Text;
    heading?: Text;
    sideText?: Text;
    link?: LinkInput;
    featureCaption?: Text;
  };
  industries?: { enabled?: boolean | null; eyebrow?: Text; heading?: Text; sideText?: Text; link?: LinkInput };
  engineering?: { enabled?: boolean | null; eyebrow?: Text; heading?: Text; body?: Text; link?: LinkInput };
  portfolio?: { enabled?: boolean | null; eyebrow?: Text; heading?: Text; sideText?: Text; link?: LinkInput };
  approach?: { enabled?: boolean | null; eyebrow?: Text; heading?: Text; body?: Text };
  academy?: {
    enabled?: boolean | null;
    eyebrow?: Text;
    heading?: Text;
    body?: Text;
    statusLabel?: Text;
    link?: LinkInput;
  };
  contact?: { enabled?: boolean | null; eyebrow?: Text; heading?: Text };
};

type Resolved = {
  heroImage: PhotoSource | null;
  featureImage: PhotoSource | null;
  engineeringImage: PhotoSource | null;
  academyImage: PhotoSource | null;
  categories: CategoryView[];
  industries: IndustryView[];
  capabilities: string[];
  projects: ProjectSummary[];
  steps: StepView[];
};

// A section is shown unless it was explicitly switched off.
const shown = (section?: { enabled?: boolean | null }) => section?.enabled !== false;

function buildView(s: SectionsInput, r: Resolved): HomepageView {
  return {
    hero: {
      eyebrow: text(s.hero.eyebrow),
      headingLines: toLines(s.hero.heading),
      headingAccent: text(s.hero.headingAccent),
      description: text(s.hero.description),
      primaryLink: toLink(s.hero.primaryLink),
      secondaryLink: toLink(s.hero.secondaryLink),
      scrollLabel: text(s.hero.scrollLabel),
      image: r.heroImage,
      imageCaption: text(s.hero.imageCaption),
    },
    introduction: {
      enabled: shown(s.introduction),
      eyebrow: text(s.introduction?.eyebrow),
      locationLines: toLines(s.introduction?.location),
      headingLines: toLines(s.introduction?.heading),
      headingMuted: text(s.introduction?.headingMuted),
      body: text(s.introduction?.body),
      link: toLink(s.introduction?.link),
    },
    services: {
      enabled: shown(s.services),
      eyebrow: text(s.services?.eyebrow),
      headingLines: toLines(s.services?.heading),
      sideTextLines: toLines(s.services?.sideText),
      link: toLink(s.services?.link),
      featureImage: r.featureImage,
      featureCaption: text(s.services?.featureCaption),
      categories: r.categories,
    },
    industries: {
      enabled: shown(s.industries),
      eyebrow: text(s.industries?.eyebrow),
      headingLines: toLines(s.industries?.heading),
      sideTextLines: toLines(s.industries?.sideText),
      link: toLink(s.industries?.link),
      items: r.industries,
    },
    engineering: {
      enabled: shown(s.engineering),
      eyebrow: text(s.engineering?.eyebrow),
      headingLines: toLines(s.engineering?.heading),
      body: text(s.engineering?.body),
      link: toLink(s.engineering?.link),
      image: r.engineeringImage,
      capabilities: r.capabilities.map(text).filter(Boolean),
    },
    portfolio: {
      enabled: shown(s.portfolio),
      eyebrow: text(s.portfolio?.eyebrow),
      headingLines: toLines(s.portfolio?.heading),
      sideTextLines: toLines(s.portfolio?.sideText),
      link: toLink(s.portfolio?.link),
      projects: r.projects,
    },
    approach: {
      enabled: shown(s.approach),
      eyebrow: text(s.approach?.eyebrow),
      headingLines: toLines(s.approach?.heading),
      body: text(s.approach?.body),
      steps: r.steps
        .map((step) => ({ title: text(step.title), description: text(step.description) }))
        .filter((step) => step.title || step.description),
    },
    academy: {
      enabled: shown(s.academy),
      eyebrow: text(s.academy?.eyebrow),
      headingLines: toLines(s.academy?.heading),
      body: text(s.academy?.body),
      statusLabel: text(s.academy?.statusLabel),
      link: toLink(s.academy?.link),
      image: r.academyImage,
    },
    contact: {
      enabled: shown(s.contact),
      eyebrow: text(s.contact?.eyebrow),
      headingLines: toLines(s.contact?.heading),
    },
  };
}

const industryView = (s: Solution): IndustryView => ({
  slug: s.slug,
  label: s.label,
  title: s.title,
  summary: industrySummary((s.modules ?? []).map((module) => module.item)),
});

const projectView = (p: PortfolioProject): ProjectSummary => ({
  slug: p.slug,
  name: p.name,
  title: p.title,
  status: p.projectStatus,
  intro: p.intro,
  photo: mediaPhoto(p.image),
  linkLabel: projectLinkLabel(p.type),
});

/**
 * The published Homepage global (read anonymously, depth 2) and the published
 * service categories in number order. Related records that the visitor may not
 * read, such as unpublished or deleted ones, arrive as plain IDs and are left out.
 */
export function toHomepageView(
  doc: Homepage,
  categories: Pick<ServiceCategory, "slug" | "number" | "title" | "description">[],
): HomepageView {
  return buildView(doc, {
    heroImage: mediaPhoto(doc.hero?.image),
    featureImage: mediaPhoto(doc.services?.featureImage),
    engineeringImage: mediaPhoto(doc.engineering?.image),
    academyImage: mediaPhoto(doc.academy?.image),
    categories: categories.map((c) => ({
      slug: c.slug,
      number: c.number,
      title: c.title,
      description: c.description,
    })),
    industries: (doc.industries?.featured ?? []).filter(isDoc).map(industryView),
    capabilities: (doc.engineering?.capabilities ?? []).map((c) => c.item),
    projects: (doc.portfolio?.projects ?? []).filter(isDoc).map(projectView),
    steps: (doc.approach?.steps ?? []).map((step) => ({
      title: step.title,
      description: step.description,
    })),
  });
}

/** The approved prototype homepage, used only when nothing has been published. */
export function approvedHomepageView(): HomepageView {
  const a = approvedHomepage;
  return buildView(a, {
    heroImage: staticPhoto(a.hero.image),
    featureImage: staticPhoto(a.services.featureImage),
    engineeringImage: staticPhoto(a.engineering.image),
    academyImage: staticPhoto(a.academy.image),
    categories: staticCategories.map((c) => ({
      slug: c.slug,
      number: c.number,
      title: c.title,
      description: c.description,
    })),
    industries: a.industries.featured.flatMap((slug) => {
      const s = staticSolutions.find((x) => x.slug === slug);
      return s ? [{ slug, label: s.label, title: s.title, summary: industrySummary(s.modules) }] : [];
    }),
    capabilities: a.engineering.capabilities,
    projects: a.portfolio.projects.flatMap((slug) => {
      const p = staticProjects.find((x) => x.slug === slug);
      return p
        ? [
            {
              slug,
              name: p.name,
              title: p.title,
              status: p.status,
              intro: p.intro,
              photo: staticPhoto(p.image),
              linkLabel: projectLinkLabel(p.type),
            },
          ]
        : [];
    }),
    steps: a.approach.steps,
  });
}
