import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderSite } from "./render-site.mjs";
import { navigationMenu, toCatalog, isPlannedConcept } from "../lib/cms/catalog-view.ts";
import { approvedCatalog } from "../lib/cms/catalog-approved.ts";
import { metadataFor } from "../lib/metadata.ts";
import { ProjectPage, PortfolioPage } from "../components/site/pages.tsx";
import { Navigation } from "../components/site/navigation.tsx";
import { categories, projects, services, solutions } from "../lib/content.ts";

// tests/fixtures/site.approved.json holds SHA-256 hashes of every page as
// rendered before the CMS refactor of Phase 2B (header, page and footer).
test("with the approved content every page renders exactly as before", async () => {
  const approved = JSON.parse(await readFile("tests/fixtures/site.approved.json", "utf8"));
  const pages = await renderSite();
  assert.equal(pages.length, 44);
  for (const page of pages) {
    const hash = createHash("sha256").update(page.html).digest("hex");
    assert.equal(hash, approved[page.name], `${page.name} markup changed`);
  }
});

test("the approved catalog is complete", () => {
  const catalog = approvedCatalog();
  assert.equal(catalog.categories.length, 4);
  assert.equal(catalog.services.length, 18);
  assert.equal(catalog.solutions.length, 15);
  assert.equal(catalog.projects.length, 2);
  assert.equal(catalog.services.filter((s) => s.isOverview).length, 4);
  assert.deepEqual(
    catalog.categories.map((c) => c.contactOption),
    ["Software engineering & SaaS", "Business & industry solutions", "Cloud infrastructure & managed IT", "Creative & digital growth"],
  );
  assert.equal(categories.length + services.length + solutions.length + projects.length, 39);
});

// Published documents as Payload returns them at depth 0 to a visitor.
const docs = () => ({
  categories: [
    { id: 1, slug: "software", number: "01", title: "Software engineering & SaaS", short: "Short", description: "Desc", image: 10, overview: 100, services: [101, 999, 102], menuSolutions: [] },
    { id: 2, slug: "other", number: "02", title: "Not a contact option", short: "S", description: "D", image: 77, overview: 555, services: [], menuSolutions: [200, 404] },
  ],
  services: [
    { id: 100, slug: "software", title: "Software overview", short: "Overview", category: 1, intro: "Intro", problem: "P", audience: "A", deliverables: [{ item: "One" }], approach: "Ap", technology: "T", relatedSolutions: [200, 201], seo: { title: "  ", description: "Custom description", noIndex: true } },
    { id: 101, slug: "web", title: "Web", short: "Web short", category: 1, intro: "I", problem: "P", audience: "A", deliverables: [], approach: "A", technology: "T", relatedSolutions: [] },
    { id: 102, slug: "mobile", title: "Mobile", short: "Mobile short", category: 3, intro: "I", problem: "P", audience: "A", deliverables: [], approach: "A", technology: "T" },
  ],
  solutions: [
    { id: 200, slug: "health", title: "Health", intro: "Health intro", label: "Health", group: "Services & communities", challenge: "C", modules: [{ item: "M" }], workflow: [{ step: "1" }, { step: "2" }, { step: "3" }, { step: "4" }], consideration: "C", supportingServices: [101, 888] },
  ],
  projects: [
    { id: 300, slug: "real", name: "Real", title: "Real headline", type: "Real projects", projectStatus: "Completed", intro: "I", challenge: "C", features: [{ item: "F" }], direction: null, image: 10, relatedSolution: 201 },
  ],
  media: [{ id: 10, url: "/cms-api/media/file/a.webp", mimeType: "image/webp", width: 800, height: 600, alt: "Alt", sizes: {} }],
});

test("only published related records appear; unpublished or deleted ones are left out", () => {
  const catalog = toCatalog(docs());
  const [software, other] = catalog.categories;
  assert.deepEqual(software.services.map((s) => s.slug), ["web", "mobile"], "999 is not published");
  assert.equal(software.href, "/services/software");
  assert.equal(other.href, null, "the overview page is not published");
  assert.deepEqual(other.menuSolutions.map((s) => s.slug), ["health"]);
  assert.equal(other.photo, null, "media 77 does not exist");
  const [overview, web, mobile] = catalog.services;
  assert.equal(overview.isOverview, true);
  assert.equal(web.isOverview, false);
  assert.equal(web.category.slug, "software");
  assert.equal(mobile.category, null, "category 3 is not published");
  assert.deepEqual(overview.relatedSolutions.map((s) => s.slug), ["health"], "201 is not published");
  assert.deepEqual(catalog.solutions[0].supportingServices.map((s) => s.slug), ["web"]);
  assert.equal(catalog.projects[0].relatedSolution, null);
  assert.equal(catalog.projects[0].direction, "");
});

test("contact links, search fields and the menus come from the records", () => {
  const catalog = toCatalog(docs());
  assert.equal(catalog.categories[0].contactOption, "Software engineering & SaaS");
  assert.equal(catalog.categories[1].contactOption, null, "only real contact form options are linked");
  const seo = catalog.services[0].seo;
  assert.equal(seo.title, "Software overview", "an empty SEO title falls back to the title");
  assert.equal(seo.description, "Custom description");
  assert.equal(seo.noIndex, true);
  const menu = navigationMenu(catalog);
  assert.deepEqual(menu.categories[0].services, [
    { slug: "web", title: "Web" },
    { slug: "mobile", title: "Mobile" },
  ]);
  assert.deepEqual(menu.solutions, [{ slug: "health", title: "Health", group: "Services & communities" }]);
});

test("concept wording is only used for planned product concepts", () => {
  const project = toCatalog(docs()).projects[0];
  assert.equal(isPlannedConcept(project), false);
  const page = renderToStaticMarkup(h(ProjectPage, { project }));
  assert.doesNotMatch(page, /No commercial release|not a completed project|not a product screenshot/);
  assert.match(page, /<span>Real projects<\/span>/);
  assert.doesNotMatch(page, /related industry solution/, "no link to an unpublished solution");
  const portfolio = renderToStaticMarkup(h(PortfolioPage, { projects: [project] }));
  assert.doesNotMatch(portfolio, /planned product concepts/);
  assert.match(renderToStaticMarkup(h(PortfolioPage, { projects: approvedCatalog().projects })), /planned product concepts/);
});

test("without menu data the header keeps its plain links only", () => {
  const html = renderToStaticMarkup(h(Navigation, { menu: null }));
  assert.match(html, /href="\/services"/);
  assert.doesNotMatch(html, /mega-menu|mobile-submenu|nav-toggle/);
});

test("metadata uses CMS sharing images and keeps hidden pages out of search", () => {
  const plain = metadataFor("/services/web", "Web", "Desc");
  assert.equal(plain.robots, undefined);
  assert.match(plain.openGraph.images[0].url, /\/images\/architecture\.jpg$/);
  const hidden = metadataFor("/services/web", "Web", "Desc", {
    noIndex: true,
    image: { src: "/cms-api/media/file/a.webp", srcSet: "", width: 800, height: 600, alt: "Alt" },
  });
  assert.equal(hidden.robots.index, false);
  assert.match(hidden.openGraph.images[0].url, /\/cms-api\/media\/file\/a\.webp$/);
  assert.equal(hidden.openGraph.images[0].alt, "Alt");
});
