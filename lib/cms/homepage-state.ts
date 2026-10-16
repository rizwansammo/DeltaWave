import type { Payload } from "payload";
import { isDatabaseUnavailable } from "./errors";
import { approvedHomepageView, toHomepageView, type HomepageView } from "./homepage-view";

// How the public homepage is resolved from the Homepage global.
//
//   published     - a published version exists. It is read as an anonymous
//                   visitor (overrideAccess: false, draft: false), so newer
//                   drafts and unpublished related records never appear.
//   draft         - drafts were saved, but nothing has been published yet.
//   uninitialized - the homepage has never been saved (the seed has not run).
//   unavailable   - the database cannot be reached.
//
// Until the first publication, and while the database is down, visitors get
// the approved content and the reason is logged. A published homepage cannot
// be unpublished (cms/globals/Homepage.ts), so published content is never
// replaced by the approved defaults. Any other failure is thrown, so access,
// validation and programming errors surface instead of being masked.

export type HomepageState = "published" | "preview" | "draft" | "uninitialized" | "unavailable";
export type HomepageResult = { state: HomepageState; content: HomepageView };
export type HomepageReader = Pick<
  Payload,
  "find" | "findGlobal" | "countGlobalVersions" | "logger"
>;

const asVisitor = { overrideAccess: false, draft: false } as const;

/** While previewing, staff read their own drafts through access control. */
export type ReadOptions = { overrideAccess: false; draft: boolean; user?: unknown };

export const homepageNotices = {
  draft:
    "The homepage has drafts but has never been published. Serving the approved content until an administrator publishes it.",
  uninitialized:
    "The homepage has never been saved in the CMS. Serving the approved content. Run `pnpm seed:homepage` to load it.",
  unavailable:
    "Homepage content unavailable: the database cannot be reached. Serving the approved content.",
} as const;

const approved = (state: Exclude<HomepageState, "published">): HomepageResult => ({
  state,
  content: approvedHomepageView(),
});

export async function readHomepage(
  connect: () => Promise<HomepageReader>,
  options: ReadOptions = asVisitor,
): Promise<HomepageResult> {
  let payload: HomepageReader;
  try {
    payload = await connect();
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    console.error(homepageNotices.unavailable, error);
    return approved("unavailable");
  }

  try {
    const [doc, categories] = await Promise.all([
      payload.findGlobal({
        slug: "homepage",
        depth: 2,
        ...options,
        populate: {
          media: {
            url: true,
            filename: true,
            mimeType: true,
            width: true,
            height: true,
            alt: true,
            sizes: true,
          },
          solutions: { slug: true, title: true, label: true, modules: true },
          "portfolio-projects": {
            slug: true,
            name: true,
            title: true,
            type: true,
            projectStatus: true,
            intro: true,
            image: true,
          },
        },
      }),
      payload.find({
        collection: "service-categories",
        sort: "number",
        depth: 0,
        pagination: false,
        ...options,
        select: { slug: true, number: true, title: true, description: true },
      }),
    ]);

    if (doc?._status === "published") {
      return { state: "published", content: toHomepageView(doc, categories.docs) };
    }
    // A member of staff previewing an unpublished draft.
    if (options.draft && doc?.updatedAt) {
      return { state: "preview", content: toHomepageView(doc, categories.docs) };
    }

    // Nothing is published. Counting versions reads no content, so it may
    // skip access control; it only decides which notice is logged.
    const { totalDocs } = await payload.countGlobalVersions({
      global: "homepage",
      overrideAccess: true,
    });
    const state = totalDocs > 0 ? "draft" : "uninitialized";
    payload.logger.warn(homepageNotices[state]);
    return approved(state);
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    payload.logger.error({ err: error, msg: homepageNotices.unavailable });
    return approved("unavailable");
  }
}
