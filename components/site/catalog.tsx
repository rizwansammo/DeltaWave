import type { Catalog, SeoView } from "@/lib/cms/catalog-view";
import {
  PortfolioPage,
  ProjectPage,
  ServicePage,
  ServicesPage,
  SolutionPage,
  SolutionsPage,
} from "./pages";

// Maps the catalog's addresses to their pages: /services, /solutions and
// /portfolio, and one detail page per published record. Anything else
// (including unpublished or deleted records) is not a catalog page.

export const catalogSections = ["services", "solutions", "portfolio"] as const;

export const isCatalogPath = (slug: string[]) =>
  (catalogSections as readonly string[]).includes(slug[0]) && slug.length <= 2;

function detail(slug: string[], catalog: Catalog) {
  if (slug.length !== 2) return null;
  const [section, key] = slug;
  if (section === "services") {
    const service = catalog.services.find((s) => s.slug === key);
    return service && { seo: service.seo, page: <ServicePage service={service} /> };
  }
  if (section === "solutions") {
    const solution = catalog.solutions.find((s) => s.slug === key);
    return solution && { seo: solution.seo, page: <SolutionPage solution={solution} /> };
  }
  if (section === "portfolio") {
    const project = catalog.projects.find((p) => p.slug === key);
    return project && { seo: project.seo, page: <ProjectPage project={project} /> };
  }
  return null;
}

/** The page for a catalog address, or null when there is none. */
export function renderCatalogRoute(slug: string[], catalog: Catalog) {
  if (slug.length === 1) {
    if (slug[0] === "services") return <ServicesPage catalog={catalog} />;
    if (slug[0] === "solutions") return <SolutionsPage solutions={catalog.solutions} />;
    if (slug[0] === "portfolio") return <PortfolioPage projects={catalog.projects} />;
    return null;
  }
  return detail(slug, catalog)?.page ?? null;
}

/** Search metadata for a published detail page, or null. */
export function catalogDetailSeo(slug: string[], catalog: Catalog): SeoView | null {
  return detail(slug, catalog)?.seo ?? null;
}
