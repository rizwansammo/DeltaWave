import {
  Forbidden,
  type CollectionBeforeChangeHook,
  type CollectionConfig,
  type GlobalBeforeChangeHook,
  type GlobalConfig,
  type PayloadRequest,
} from "payload";
import { adminOnly, draftWriteAccess, isAdmin, publishedOrStaff, staffOnly } from "./access";

// Shared publishing policy for website content: drafts and version history
// are always on, the public only sees published versions, editors write
// drafts and administrators publish.

export const contentVersions = {
  drafts: true,
  maxPerDoc: 50,
} satisfies CollectionConfig["versions"];

export const contentAccess = {
  read: publishedOrStaff,
  readVersions: staffOnly,
  create: draftWriteAccess,
  update: draftWriteAccess,
  delete: adminOnly,
} satisfies CollectionConfig["access"];

export const globalVersions = {
  drafts: true,
  max: 50,
} satisfies GlobalConfig["versions"];

export const globalAccess = {
  read: publishedOrStaff,
  readVersions: staffOnly,
  update: draftWriteAccess,
} satisfies GlobalConfig["access"];

// Second line of defence behind access control: whatever shape a request
// takes, a signed-in non-administrator can never produce a published version.
function assertMayPublish(req: PayloadRequest, data: { _status?: unknown } | undefined) {
  if (req.user && !isAdmin(req.user) && data?._status === "published") throw new Forbidden(req.t);
}

const onlyAdminsPublish: CollectionBeforeChangeHook = ({ data, req }) => {
  assertMayPublish(req, data);
  return data;
};

const onlyAdminsPublishGlobal: GlobalBeforeChangeHook = ({ data, req }) => {
  assertMayPublish(req, data);
  return data;
};

export const contentHooks = {
  beforeChange: [onlyAdminsPublish],
} satisfies CollectionConfig["hooks"];

export const globalHooks = {
  beforeChange: [onlyAdminsPublishGlobal],
} satisfies GlobalConfig["hooks"];
