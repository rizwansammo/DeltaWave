import config from "@payload-config";
import { draftMode, headers } from "next/headers";
import { getPayload, type TypedUser } from "payload";
import { cache } from "react";
import { isStaff } from "@/cms/access";

// Who is asking for the page. Draft content is only ever served when Next.js
// draft mode is on **and** the request carries a CMS session for a member of
// staff, so a leaked draft-mode cookie on its own reveals nothing. The reads
// then run with that account through normal access control
// (overrideAccess: false), never through an access bypass.

export type Viewer = { draft: boolean; user: TypedUser | null };

const visitor: Viewer = { draft: false, user: null };

export const getViewer = cache(async (): Promise<Viewer> => {
  let enabled = false;
  try {
    enabled = (await draftMode()).isEnabled;
  } catch {
    return visitor;
  }
  if (!enabled) return visitor;
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: await headers() });
    return isStaff(user) ? { draft: true, user } : visitor;
  } catch {
    // Fail closed: without a verified account the visitor sees published content.
    return visitor;
  }
});

/** Local API options for a public read, or a staff draft read while previewing. */
export const asViewer = (viewer: Viewer) => ({
  overrideAccess: false as const,
  draft: viewer.draft,
  ...(viewer.user ? { user: viewer.user } : {}),
});
