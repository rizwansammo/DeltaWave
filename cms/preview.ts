import type { GeneratePreviewURL } from "payload";
import { site } from "../lib/site";

// Draft preview. The admin's Preview button and the Live Preview iframe both
// open /api/preview, which checks the signed-in CMS account before turning on
// Next.js draft mode (app/api/preview/route.ts).

export const previewUrl = (path: string) =>
  `${site.url}/api/preview?path=${encodeURIComponent(path)}`;

/** The public page that shows a document, or null when it has no page of its own. */
export function previewPathFor(entity: string, data: Record<string, unknown>): string | null {
  const slug = typeof data?.slug === "string" ? data.slug : "";
  switch (entity) {
    case "homepage":
    case "site-settings":
      return "/";
    case "page-content":
      return "/about";
    case "pages":
      return slug ? `/${slug}` : null;
    case "services":
      return slug ? `/services/${slug}` : null;
    case "solutions":
      return slug ? `/solutions/${slug}` : null;
    case "portfolio-projects":
      return slug ? `/portfolio/${slug}` : null;
    // A category has no page of its own; its services are listed here.
    case "service-categories":
      return "/services";
    default:
      return null;
  }
}

/** The Preview button of a collection or global. */
export const generatePreviewURL =
  (entity: string): GeneratePreviewURL =>
  (doc) => {
    const path = previewPathFor(entity, doc ?? {});
    return path ? previewUrl(path) : null;
  };

export const livePreviewEntities = {
  collections: ["pages", "services", "solutions", "portfolio-projects", "service-categories"],
  globals: ["homepage", "page-content", "site-settings"],
};

/** Desktop and mobile widths offered in the Live Preview toolbar. */
export const livePreviewBreakpoints = [
  { label: "Desktop", name: "desktop", width: 1440, height: 900 },
  { label: "Mobile", name: "mobile", width: 390, height: 844 },
];
