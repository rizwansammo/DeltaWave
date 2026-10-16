import type { Access, FieldAccess, PayloadRequest } from "payload";

// Role-based access for the DeltaWave CMS.
//   admin  - full control, including publishing, deleting and user management.
//   editor - may create and edit drafts. Cannot publish, unpublish or delete.
// Anonymous visitors only ever see published content.

export const roles = ["admin", "editor"] as const;
export type Role = (typeof roles)[number];

type MaybeUser = { roles?: Role[] | null } | null | undefined;

export const isAdmin = (user: MaybeUser) => Boolean(user?.roles?.includes("admin"));

/** Any signed-in CMS account with a recognised role. */
export const isStaff = (user: MaybeUser) =>
  isAdmin(user) || Boolean(user?.roles?.includes("editor"));

export const adminOnly: Access = ({ req }) => isAdmin(req.user);
export const staffOnly: Access = ({ req }) => isStaff(req.user);
export const adminOnlyField: FieldAccess = ({ req }) => isAdmin(req.user);

/** Staff see drafts; everyone else sees published documents only. */
export const publishedOrStaff: Access = ({ req }) =>
  isStaff(req.user) ? true : { _status: { equals: "published" } };

function isDraftRequest(req: PayloadRequest) {
  const draft = req.query?.draft;
  return draft === "true" || draft === true;
}

/**
 * Writes to versioned content. Administrators may do anything. Editors may
 * only save drafts: the request must be a draft save and must not set the
 * published status, so the live document is never changed by an editor.
 */
export const draftWriteAccess: Access = ({ req, data }) => {
  if (isAdmin(req.user)) return true;
  if (!isStaff(req.user)) return false;
  return isDraftRequest(req) && data?._status !== "published";
};
