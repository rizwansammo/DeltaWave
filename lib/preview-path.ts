import { site } from "./site";

/**
 * A page address on this website, or null. Keeps preview links from
 * redirecting elsewhere, into the admin, or into the API routes.
 */
export function safePath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  try {
    const url = new URL(value, site.url);
    if (url.origin !== new URL(site.url).origin) return null;
    if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) return null;
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return null;
    return url.pathname + url.search;
  } catch {
    return null;
  }
}
