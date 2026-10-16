// Server-renders every public page from the approved content, without a
// database: the homepage from the approved Homepage content, the catalog
// pages and the header menus from the approved catalog (lib/content.ts).
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HomePage } from "../components/site/pages.tsx";
import { Navigation } from "../components/site/navigation.tsx";
import { Footer } from "../components/site/shared.tsx";
import { catalogDetailSeo, isCatalogPath, renderCatalogRoute } from "../components/site/catalog.tsx";
import Page, { generateMetadata } from "../app/(frontend)/[...slug]/page.tsx";
import NotFound from "../app/(frontend)/not-found.tsx";
import { approvedHomepageView } from "../lib/cms/homepage-view.ts";
import { approvedCatalog } from "../lib/cms/catalog-approved.ts";
import { navigationMenu } from "../lib/cms/catalog-view.ts";
import { metadataFor } from "../lib/metadata.ts";
import { allPaths } from "../lib/content.ts";

/** [{ name, path, html, meta }] for every route, plus the 404 page. */
export async function renderSite() {
  const catalog = approvedCatalog();
  const menu = navigationMenu(catalog);
  const pages = [];
  for (const path of allPaths) {
    const slug = path.slice(1).split("/");
    const node =
      path === "/"
        ? h(HomePage, { content: approvedHomepageView() })
        : isCatalogPath(slug)
          ? renderCatalogRoute(slug, catalog)
          : await Page({ params: Promise.resolve({ slug }) });
    const html = renderToStaticMarkup(
      h("html", { lang: "en" }, h("body", null, h(Navigation, { menu }), h("main", { id: "main-content" }, node), h(Footer))),
    );
    let meta = null;
    if (path !== "/") {
      const seo = slug.length === 2 ? catalogDetailSeo(slug, catalog) : null;
      meta = seo
        ? metadataFor(path, seo.title, seo.description, { image: seo.image, noIndex: seo.noIndex })
        : await generateMetadata({ params: Promise.resolve({ slug }) });
    }
    pages.push({ name: path === "/" ? "home" : slug.join("__"), path, html, meta });
  }
  pages.push({ name: "not-found", path: null, html: renderToStaticMarkup(h(NotFound)), meta: null });
  return pages;
}
