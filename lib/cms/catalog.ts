import config from "@payload-config";
import { getPayload } from "payload";
import { cache } from "react";
import { isDatabaseUnavailable } from "./errors";
import { catalogMediaIds, navigationMenu, toCatalog, type NavigationMenu } from "./catalog-view";

// Server-only reads of the published services, industry solutions and
// portfolio through Payload's Local API, as an anonymous visitor
// (overrideAccess: false, draft: false): drafts and unpublished records never
// reach a page. One read per request, shared by the layout's navigation, the
// page and its metadata.
//
// There is no fallback content. If the database cannot be reached the error
// is logged and thrown, so pages show the error page; only the header menus
// are left out instead (getNavigationMenu).

const asVisitor = { overrideAccess: false, draft: false, depth: 0, pagination: false } as const;

export const getCatalog = cache(async () => {
  try {
    const payload = await getPayload({ config });
    const [categories, services, solutions, projects] = await Promise.all([
      payload.find({ collection: "service-categories", sort: "number", ...asVisitor }),
      payload.find({ collection: "services", sort: "createdAt", ...asVisitor }),
      payload.find({ collection: "solutions", sort: ["order", "createdAt"], ...asVisitor }),
      payload.find({ collection: "portfolio-projects", sort: "createdAt", ...asVisitor }),
    ]);
    const docs = {
      categories: categories.docs,
      services: services.docs,
      solutions: solutions.docs,
      projects: projects.docs,
    };
    const mediaIds = catalogMediaIds(docs);
    const media = mediaIds.length
      ? (await payload.find({ collection: "media", where: { id: { in: mediaIds } }, ...asVisitor })).docs
      : [];
    return toCatalog({ ...docs, media });
  } catch (error) {
    if (isDatabaseUnavailable(error))
      console.error("Services, solutions and portfolio unavailable: the database cannot be reached.", error);
    throw error;
  }
});

/** The header menus, or null while the database cannot be reached. */
export async function getNavigationMenu(): Promise<NavigationMenu | null> {
  try {
    return navigationMenu(await getCatalog());
  } catch (error) {
    if (isDatabaseUnavailable(error)) return null;
    throw error;
  }
}
