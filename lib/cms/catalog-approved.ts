import { categories, projects, services, solutions } from "@/lib/content";
import { staticPhoto } from "@/lib/images";
import type { Catalog, CatalogCategory, SeoView, ServiceLink, SolutionLink } from "./catalog-view";
import { contactOption } from "./catalog-view";
import { projectLinkLabel } from "./homepage-view";

// The approved catalog from lib/content.ts, rendered with the prototype's
// images. Used by the markup tests and as the seed's source of truth; the
// live site never serves it.

/** Industry solutions listed under a category in the Services menu. */
export const approvedMenuSolutions: Record<string, string[]> = {
  "business-industry-solutions": ["education-coaching", "ecommerce-facebook", "retail-pos-restaurant"],
};

const seo = (title: string, description: string): SeoView => ({ title, description, image: null, noIndex: false });

export function approvedCatalog(): Catalog {
  const serviceLink = (slug: string): ServiceLink[] => {
    const s = services.find((x) => x.slug === slug);
    return s ? [{ slug, title: s.title, short: s.short }] : [];
  };
  const solutionLink = (slug: string): SolutionLink[] => {
    const s = solutions.find((x) => x.slug === slug);
    return s ? [{ slug, title: s.title, intro: s.intro }] : [];
  };
  const cats = categories.map(
    (c): CatalogCategory => ({
      slug: c.slug,
      number: c.number,
      title: c.title,
      short: c.short,
      description: c.description,
      photo: staticPhoto(c.image),
      href: services.some((s) => s.slug === c.slug) ? "/services/" + c.slug : null,
      services: c.links.flatMap(serviceLink),
      menuSolutions: (approvedMenuSolutions[c.slug] ?? []).flatMap(solutionLink),
      contactOption: contactOption(c.title),
    }),
  );
  return {
    categories: cats,
    services: services.map((s) => ({
      slug: s.slug,
      title: s.title,
      short: s.short,
      intro: s.intro,
      problem: s.problem,
      audience: s.audience,
      deliverables: s.deliverables,
      approach: s.approach,
      technology: s.technology,
      category: cats.find((c) => c.slug === s.category) ?? null,
      isOverview: s.slug === s.category,
      relatedSolutions: s.related.flatMap(solutionLink),
      seo: seo(s.title, s.intro),
    })),
    solutions: solutions.map((s) => ({
      slug: s.slug,
      title: s.title,
      intro: s.intro,
      label: s.label,
      group: s.group,
      challenge: s.challenge,
      modules: s.modules,
      workflow: s.workflow,
      consideration: s.consideration,
      supportingServices: s.services.flatMap(serviceLink),
      seo: seo(s.title, s.intro),
    })),
    projects: projects.map((p) => ({
      slug: p.slug,
      name: p.name,
      title: p.title,
      type: p.type,
      status: p.status,
      intro: p.intro,
      challenge: p.challenge,
      features: p.features,
      direction: p.direction,
      photo: staticPhoto(p.image),
      relatedSolution: solutionLink(p.solution).map(({ slug, title }) => ({ slug, title }))[0] ?? null,
      linkLabel: projectLinkLabel(p.type),
      seo: seo(p.title, p.intro),
    })),
  };
}
