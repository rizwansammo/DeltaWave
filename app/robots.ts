import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// Read on each request so SITE_INDEXABLE takes effect without a rebuild.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: site.indexable
      ? { userAgent: "*", allow: "/", disallow: ["/admin", "/cms-api"] }
      : { userAgent: "*", disallow: "/" },
    sitemap: site.url + "/sitemap.xml",
  };
}
