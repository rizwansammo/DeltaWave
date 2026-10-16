import type { Access, FieldAccess } from "payload";

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

/**
 * Writes to versioned collections. Administrators may do anything; editors may
 * write anything that does not ask to be published.
 *
 * Payload also calls this to decide which fields and buttons the admin shows,
 * and those checks carry no draft flag. So this only answers "may this account
 * edit?"; the rule that an editor's write is always a draft save is enforced at
 * write time by `editorsSaveDrafts` (cms/versioned.ts), which sees the
 * operation's real draft flag.
 */
export const draftWriteAccess: Access = ({ req, data }) => {
  if (isAdmin(req.user)) return true;
  if (!isStaff(req.user)) return false;
  return data?._status !== "published";
};
