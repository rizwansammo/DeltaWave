import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/cms/catalog";
import { allPaths } from "@/lib/content";
import { site } from "@/lib/site";

// The fixed pages plus every published service, solution and portfolio
// entry that is not hidden from search engines. Built on each request.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getCatalog();
  const detail = (section: string, records: { slug: string; seo: { noIndex: boolean } }[]) =>
    records.filter((r) => !r.seo.noIndex).map((r) => `/${section}/${r.slug}`);
  const paths = [
    ...allPaths.filter((path) => path.split("/").length === 2),
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
