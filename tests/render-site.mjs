// Server-renders every public page from the approved content, without a
// database: the homepage, the About, Academy and Contact pages, the catalog
// pages, the privacy notice and the header and footer all come from the
// approved copy that the seed publishes.
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AboutPage,
  AcademyPage,
  ContactPage,
  HomePage,
  StandalonePage,
} from "../components/site/pages.tsx";
import { Navigation } from "../components/site/navigation.tsx";
import { Footer } from "../components/site/shared.tsx";
import { catalogDetailSeo, isCatalogPath, renderCatalogRoute } from "../components/site/catalog.tsx";
import NotFound from "../app/(frontend)/not-found.tsx";
import { approvedHomepageView } from "../lib/cms/homepage-view.ts";
import { approvedCatalog } from "../lib/cms/catalog-approved.ts";
import { navigationMenu } from "../lib/cms/catalog-view.ts";
import {
  approvedPageContentView,
  approvedSettingsView,
  businessContact,
} from "../lib/cms/pages-view.ts";
import { approvedPrivacyPage } from "../lib/cms/pages-approved.ts";
import { toLexical } from "../lib/cms/lexical.ts";
import { extraServiceOptions } from "../cms/options.ts";
import { metadataFor } from "../lib/metadata.ts";
import { allPaths } from "../lib/content.ts";

const privacyPage = () => ({
  ...approvedPrivacyPage,
  body: toLexical(approvedPrivacyPage.body),
  seo: {},
});

/** [{ name, path, html, meta }] for every route, plus the 404 page. */
export async function renderSite() {
  const catalog = approvedCatalog();
  const menu = navigationMenu(catalog);
  const settings = approvedSettingsView();
  const content = approvedPageContentView();
  const contact = {
    introLines: content.contact.section.detailsIntroLines,
    note: content.contact.section.note,
    details: businessContact(settings),
    serviceOptions: [...catalog.categories.map((c) => c.title), ...extraServiceOptions],
  };
  const fallbackTitles = {
    about: "About",
    academy: "Academy",
    contact: "Contact",
    services: "Services",
    solutions: "Solutions",
    portfolio: "Portfolio",
  };
  const pages = [];
  for (const path of allPaths) {
    const slug = path.slice(1).split("/");
    const key = slug[0];
    let node = null;
    let meta = null;
    if (path === "/") {
      node = h(HomePage, { content: approvedHomepageView(), contact });
    } else if (key === "about") {
      node = h(AboutPage, { content: content.about });
    } else if (key === "academy") {
      node = h(AcademyPage, { content: content.academy });
    } else if (key === "contact" && slug.length === 1) {
      node = h(ContactPage, { content: content.contact, contact });
    } else if (key === "privacy") {
      node = h(StandalonePage, { page: privacyPage() });
      meta = metadataFor(path, approvedPrivacyPage.title, approvedPrivacyPage.hero.description, {
        siteName: settings.siteName,
      });
    } else if (isCatalogPath(slug)) {
      node = renderCatalogRoute(slug, catalog, content);
    }
    if (!node) throw new Error("No page for " + path);
    if (!meta && path !== "/") {
      const defaults = { siteName: settings.siteName, image: settings.seo.image };
      if (slug.length === 1 && content[key]) {
        const seo = content[key].seo;
        meta = metadataFor(path, seo.title || fallbackTitles[key], seo.description, defaults);
      } else {
        const seo = catalogDetailSeo(slug, catalog);
        meta = metadataFor(path, seo.title, seo.description, {
          ...defaults,
          image: seo.image ?? defaults.image,
          noIndex: seo.noIndex,
        });
      }
    }
    const html = renderToStaticMarkup(
      h(
        "html",
        { lang: "en" },
        h(
          "body",
          null,
          h(Navigation, { menu, settings }),
          h("main", { id: "main-content" }, node),
          h(Footer, { settings }),
        ),
      ),
    );
    pages.push({ name: path === "/" ? "home" : slug.join("__"), path, html, meta });
  }
  pages.push({ name: "not-found", path: null, html: renderToStaticMarkup(h(NotFound)), meta: null });
  return pages;
}
