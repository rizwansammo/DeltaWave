import type { MetadataRoute } from "next";
import { allPaths } from "@/lib/content";
import { site } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  return allPaths.map((path) => ({
    url: site.url + (path === "/" ? "" : path),
    changeFrequency: path === "/" ? "monthly" : "yearly",
    priority: path === "/" ? 1 : path.split("/").length === 2 ? 0.8 : 0.6,
  }));
}
