import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/cms/catalog";
import { getPublishedPages } from "@/lib/cms/pages";
import { site } from "@/lib/site";

// The fixed pages plus every published service, solution and portfolio
// entry that is not hidden from search engines. Built on each request.
export const dynamic = "force-dynamic";

/** Pages with a fixed address in the design. */
const fixedPaths = ["/", "/about", "/services", "/solutions", "/portfolio", "/academy", "/contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [catalog, pages] = await Promise.all([getCatalog(), getPublishedPages()]);
  const detail = (section: string, records: { slug: string; seo: { noIndex: boolean } }[]) =>
    records.filter((r) => !r.seo.noIndex).map((r) => `/${section}/${r.slug}`);
  const paths = [
    ...fixedPaths,
    ...pages.filter((page) => page.seo?.noIndex !== true).map((page) => `/${page.slug}`),
    ...detail("services", catalog.services),
    ...detail("solutions", catalog.solutions),
    ...detail("portfolio", catalog.projects),
  ];
  return paths.map((path) => ({
    url: site.url + (path === "/" ? "" : path),
    changeFrequency: path === "/" ? "monthly" : "yearly",
    priority: path === "/" ? 1 : path.split("/").length === 2 ? 0.8 : 0.6,
  }));
}
