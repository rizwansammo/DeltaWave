import config from "@payload-config";
import { getPayload, type Payload } from "payload";
import { cache } from "react";
import type { Page } from "@/payload-types";
import { isDatabaseUnavailable } from "./errors";
import {
  approvedPageContentView,
  approvedSettingsView,
  toPageContentView,
  toSettingsView,
  type PageContentView,
  type SettingsView,
} from "./pages-view";
import { asViewer, getViewer } from "./preview";

// Server-only reads of the site settings, the editorial page content and the
// standalone pages, through Payload's Local API as an anonymous visitor
// (or, while previewing, as the signed-in member of staff).
//
//   published     - a published version exists.
//   preview       - a draft shown to signed-in staff.
//   draft         - drafts exist but nothing has been published yet.
//   uninitialized - nothing has ever been saved (the seed has not run).
//   unavailable   - the database cannot be reached (site settings only).
//
// Until the first publication the approved content is used and the reason is
// logged. Site settings additionally fall back when the database is down, so
// the header, footer and error page still render; every other reader throws,
// so a page never shows stale copy as though it were published.

export type ContentState = "published" | "preview" | "draft" | "uninitialized" | "unavailable";

const notices = {
  draft: (what: string) =>
    `The ${what} has drafts but has never been published. Serving the approved content until an administrator publishes it.`,
  uninitialized: (what: string) =>
    `The ${what} has never been saved in the CMS. Serving the approved content. Run \`pnpm seed\` to load it.`,
  unavailable: "Site settings unavailable: the database cannot be reached. Serving the approved values.",
};

async function readGlobal<T extends "site-settings" | "page-content">(
  payload: Payload,
  slug: T,
  what: string,
) {
  const viewer = await getViewer();
  const doc = await payload.findGlobal({ slug, depth: 1, ...asViewer(viewer) });
  if (doc?._status === "published") return { state: "published" as const, doc };
  if (viewer.draft && doc?.updatedAt) return { state: "preview" as const, doc };
  const { totalDocs } = await payload.countGlobalVersions({ global: slug, overrideAccess: true });
  const state = totalDocs > 0 ? ("draft" as const) : ("uninitialized" as const);
  payload.logger.warn(notices[state](what));
  return { state, doc: null };
}

export const getSiteSettings = cache(
  async (): Promise<{ state: ContentState; settings: SettingsView }> => {
    try {
      const payload = await getPayload({ config });
      const { state, doc } = await readGlobal(payload, "site-settings", "site settings");
      return { state, settings: doc ? toSettingsView(doc) : approvedSettingsView() };
    } catch (error) {
      if (!isDatabaseUnavailable(error)) throw error;
      console.error(notices.unavailable, error);
      return { state: "unavailable", settings: approvedSettingsView() };
    }
  },
);

export const getPageContent = cache(
  async (): Promise<{ state: ContentState; content: PageContentView }> => {
    const payload = await getPayload({ config });
    const { state, doc } = await readGlobal(payload, "page-content", "page content");
    return { state, content: doc ? toPageContentView(doc) : approvedPageContentView() };
  },
);

/** A standalone page by slug, or null when it is not published. */
export const getStandalonePage = cache(async (slug: string): Promise<Page | null> => {
  const viewer = await getViewer();
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "pages",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
    pagination: false,
    ...asViewer(viewer),
  });
  return docs[0] ?? null;
});

/** The published standalone pages, for the sitemap. */
export const getPublishedPages = cache(async () => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "pages",
    depth: 0,
    pagination: false,
    overrideAccess: false,
    draft: false,
    select: { slug: true, seo: true },
  });
  return docs;
});
