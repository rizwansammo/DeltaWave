import { notFound } from "next/navigation";
import { metadataFor } from "@/lib/metadata";
import { getCatalog } from "@/lib/cms/catalog";
import { getContactSectionData } from "@/lib/cms/contact";
import { getPageContent, getSiteSettings, getStandalonePage } from "@/lib/cms/pages";

import { catalogDetailSeo, isCatalogPath, renderCatalogRoute } from "@/components/site/catalog";
import {
  AboutPage,
  AcademyPage,
  ContactPage,
  StandalonePage,
} from "@/components/site/pages";

// Rendered on demand (see the frontend layout). Every page below reads
// published CMS content, so a record published in /admin is reachable at
// once. Unknown, unpublished and deleted pages are real 404s.

/** Pages with a fixed address and a designed composition. */
const editorialPages = ["about", "academy", "contact", "services", "solutions", "portfolio"] as const;
type EditorialPage = (typeof editorialPages)[number];

const isEditorialPage = (slug: string[]): slug is [EditorialPage] =>
  slug.length === 1 && (editorialPages as readonly string[]).includes(slug[0]);

/** Used when an editor clears a page's own search title. */
const fallbackTitles: Record<EditorialPage, string> = {
  about: "About",
  academy: "Academy",
  contact: "Contact",
  services: "Services",
  solutions: "Solutions",
  portfolio: "Portfolio",
};

type Props = { params: Promise<{ slug: string[] }> };

const notFoundMetadata = { title: "Page not found", robots: { index: false, follow: false } };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const path = "/" + slug.join("/");
  const { settings } = await getSiteSettings();
  const defaults = { siteName: settings.siteName, image: settings.seo.image };

  if (isEditorialPage(slug)) {
    const { seo } = (await getPageContent()).content[slug[0]];
    return metadataFor(path, seo.title || fallbackTitles[slug[0]], seo.description, defaults);
  }
  if (slug.length === 2 && isCatalogPath(slug)) {
    const seo = catalogDetailSeo(slug, await getCatalog());
    if (seo)
      return metadataFor(path, seo.title, seo.description, {
        ...defaults,
        image: seo.image ?? defaults.image,
        noIndex: seo.noIndex,
      });
  }
  if (slug.length === 1) {
    const page = await getStandalonePage(slug[0]);
    if (page)
      return metadataFor(
        path,
        page.seo?.title?.trim() || page.title,
        page.seo?.description?.trim() || page.hero?.description || "",
        { ...defaults, noIndex: page.seo?.noIndex === true },
      );
  }
  return notFoundMetadata;
}

export default async function Page({ params }: Props) {
  const { slug } = await params;

  if (isEditorialPage(slug)) {
    const { content } = await getPageContent();
    if (slug[0] === "about") return <AboutPage content={content.about} />;
    if (slug[0] === "academy") return <AcademyPage content={content.academy} />;
    if (slug[0] === "contact")
      return <ContactPage content={content.contact} contact={await getContactSectionData()} />;
    const page = renderCatalogRoute(slug, await getCatalog(), content);
    if (page) return page;
  }
  if (slug.length === 2 && isCatalogPath(slug)) {
    const page = renderCatalogRoute(slug, await getCatalog(), (await getPageContent()).content);
    if (page) return page;
  }
  if (slug.length === 1) {
    const page = await getStandalonePage(slug[0]);
    if (page) return <StandalonePage page={page} />;
  }
  notFound();
}
