import type { Media, PortfolioProject, Service, ServiceCategory, Solution } from "@/payload-types";
import type { PhotoSource } from "@/lib/images";
import { serviceOptions } from "@/lib/site";
import { mediaPhoto, projectLinkLabel } from "./homepage-view";

// The services, industry solutions and portfolio as the public pages and the
// navigation render them. Built only from published records: a relation to
// an unpublished or deleted record is simply absent.

export type ServiceLink = { slug: string; title: string; short: string };
export type SolutionLink = { slug: string; title: string; intro: string };
export type SeoView = { title: string; description: string; image: PhotoSource | null; noIndex: boolean };

export type CatalogCategory = {
  slug: string;
  number: string;
  title: string;
  short: string;
  description: string;
  photo: PhotoSource | null;
  /** The category's overview service page, if it is published. */
  href: string | null;
  services: ServiceLink[];
  menuSolutions: SolutionLink[];
  /** The matching option of the contact form, for ?service= links. */
  contactOption: string | null;
};

export type ServiceView = ServiceLink & {
  intro: string;
  problem: string;
  audience: string;
  deliverables: string[];
  approach: string;
  technology: string;
  category: CatalogCategory | null;
  /** This page introduces its category. */
  isOverview: boolean;
  relatedSolutions: SolutionLink[];
  seo: SeoView;
};

export type SolutionView = SolutionLink & {
  label: string;
  group: string;
  challenge: string;
  modules: string[];
  workflow: string[];
  consideration: string;
  supportingServices: ServiceLink[];
  seo: SeoView;
};

export type ProjectView = {
  slug: string;
  name: string;
  title: string;
  type: string;
  status: string;
  intro: string;
  challenge: string;
  features: string[];
  direction: string;
  photo: PhotoSource | null;
  relatedSolution: { slug: string; title: string } | null;
  linkLabel: string;
  seo: SeoView;
};

export type Catalog = {
  /** In number order. */
  categories: CatalogCategory[];
  services: ServiceView[];
  /** In directory order. */
  solutions: SolutionView[];
  projects: ProjectView[];
};

/** What the header menus need, small enough to send to the browser. */
export type NavigationMenu = {
  categories: {
    slug: string;
    title: string;
    short: string;
    href: string | null;
    services: { slug: string; title: string }[];
    menuSolutions: { slug: string; title: string }[];
  }[];
  solutions: { slug: string; title: string; group: string }[];
};

export const contactOption = (title: string) => (serviceOptions.includes(title) ? title : null);

/** A planned product concept, the only kind of entry the site describes as a concept. */
export const isPlannedConcept = (p: Pick<ProjectView, "type" | "status">) =>
  p.type === "Product concepts" && p.status === "Planned concept";

type Relation = number | { id: number } | null | undefined;
const idOf = (value: Relation) => (typeof value === "number" ? value : (value?.id ?? null));
const ids = (values: Relation[] | null | undefined) =>
  (values ?? []).map(idOf).filter((id): id is number => id !== null);

/** Every media ID the catalog refers to, so they can be read in one query. */
export function catalogMediaIds(docs: {
  categories: ServiceCategory[];
  services: Service[];
  solutions: Solution[];
  projects: PortfolioProject[];
}) {
  const all = [
    ...docs.categories.flatMap((c) => [c.image, c.seo?.image]),
    ...docs.projects.flatMap((p) => [p.image, p.seo?.image]),
    ...docs.services.map((s) => s.seo?.image),
    ...docs.solutions.map((s) => s.seo?.image),
  ];
  return [...new Set(ids(all))];
}

/**
 * Builds the catalog from published documents read at depth 0 (relations as
 * IDs) plus the media they use. Categories arrive in number order, solutions
 * in directory order and portfolio entries in creation order.
 */
export function toCatalog(docs: {
  categories: ServiceCategory[];
  services: Service[];
  solutions: Solution[];
  projects: PortfolioProject[];
  media: Media[];
}): Catalog {
  const media = new Map(docs.media.map((m) => [m.id, m]));
  const photo = (value: Relation) => {
    const id = idOf(value);
    return id === null ? null : mediaPhoto(media.get(id));
  };
  const seo = (
    doc: { seo?: { title?: string | null; description?: string | null; image?: Relation; noIndex?: boolean | null } },
    title: string,
    description: string,
  ): SeoView => ({
    title: doc.seo?.title?.trim() || title,
    description: doc.seo?.description?.trim() || description,
    image: photo(doc.seo?.image),
    noIndex: doc.seo?.noIndex === true,
  });

  const serviceDocs = new Map(docs.services.map((s) => [s.id, s]));
  const solutionDocs = new Map(docs.solutions.map((s) => [s.id, s]));
  const serviceLinks = (values: Relation[] | null | undefined): ServiceLink[] =>
    ids(values).flatMap((id) => {
      const s = serviceDocs.get(id);
      return s ? [{ slug: s.slug, title: s.title, short: s.short }] : [];
    });
  const solutionLinks = (values: Relation[] | null | undefined): SolutionLink[] =>
    ids(values).flatMap((id) => {
      const s = solutionDocs.get(id);
      return s ? [{ slug: s.slug, title: s.title, intro: s.intro }] : [];
    });

  const overviewOf = new Map<number, number | null>();
  const categories = docs.categories.map((c): CatalogCategory => {
    const overview = serviceDocs.get(idOf(c.overview) ?? -1);
    overviewOf.set(c.id, overview?.id ?? null);
    return {
      slug: c.slug,
      number: c.number,
      title: c.title,
      short: c.short,
      description: c.description,
      photo: photo(c.image),
      href: overview ? "/services/" + overview.slug : null,
      services: serviceLinks(c.services),
      menuSolutions: solutionLinks(c.menuSolutions),
      contactOption: contactOption(c.title),
    };
  });
  const categoryById = new Map(docs.categories.map((c, i) => [c.id, categories[i]]));

  const services = docs.services.map((s): ServiceView => {
    const categoryId = idOf(s.category);
    const category = categoryId === null ? null : (categoryById.get(categoryId) ?? null);
    return {
      slug: s.slug,
      title: s.title,
      short: s.short,
      intro: s.intro,
      problem: s.problem,
      audience: s.audience,
      deliverables: (s.deliverables ?? []).map((d) => d.item),
      approach: s.approach,
      technology: s.technology,
      category,
      isOverview: categoryId !== null && overviewOf.get(categoryId) === s.id,
      relatedSolutions: solutionLinks(s.relatedSolutions),
      seo: seo(s, s.title, s.intro),
    };
  });

  const solutions = docs.solutions.map(
    (s): SolutionView => ({
      slug: s.slug,
      title: s.title,
      intro: s.intro,
      label: s.label,
      group: s.group,
      challenge: s.challenge,
      modules: (s.modules ?? []).map((m) => m.item),
      workflow: (s.workflow ?? []).map((w) => w.step),
      consideration: s.consideration,
      supportingServices: serviceLinks(s.supportingServices),
      seo: seo(s, s.title, s.intro),
    }),
  );

  const projects = docs.projects.map((p): ProjectView => {
    const related = solutionDocs.get(idOf(p.relatedSolution) ?? -1);
    return {
      slug: p.slug,
      name: p.name,
      title: p.title,
      type: p.type,
      status: p.projectStatus,
      intro: p.intro,
      challenge: p.challenge,
      features: (p.features ?? []).map((f) => f.item),
      direction: p.direction ?? "",
      photo: photo(p.image),
      relatedSolution: related ? { slug: related.slug, title: related.title } : null,
      linkLabel: projectLinkLabel(p.type),
      seo: seo(p, p.title, p.intro),
    };
  });

  return { categories, services, solutions, projects };
}

export function navigationMenu(catalog: Catalog): NavigationMenu {
  const link = ({ slug, title }: { slug: string; title: string }) => ({ slug, title });
  return {
    categories: catalog.categories.map((c) => ({
      slug: c.slug,
      title: c.title,
      short: c.short,
      href: c.href,
      services: c.services.map(link),
      menuSolutions: c.menuSolutions.map(link),
    })),
    solutions: catalog.solutions.map((s) => ({ slug: s.slug, title: s.title, group: s.group })),
  };
}
