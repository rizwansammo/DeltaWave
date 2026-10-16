import {
  Forbidden,
  type CollectionBeforeChangeHook,
  type CollectionBeforeOperationHook,
  type CollectionConfig,
  type GlobalBeforeChangeHook,
  type GlobalBeforeOperationHook,
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

// For a published global the admin checks edit and publish permission with
// the same data, so editing cannot be allowed without also showing Publish.
// Any staff account may edit; editorsSaveDrafts refuses an editor's publish.
export const globalAccess = {
  read: publishedOrStaff,
  readVersions: staffOnly,
  update: staffOnly,
} satisfies GlobalConfig["access"];

/** Admin components for versioned globals: Publish is shown to administrators only. */
export const globalAdminComponents = {
  elements: { PublishButton: "/components/cms/admin-publish-button#AdminPublishButton" },
} satisfies NonNullable<GlobalConfig["admin"]>["components"];

const writeOperations = new Set(["create", "update", "updateByID", "restoreVersion"]);

/**
 * Editors only ever save drafts. Runs before every write with the operation's
 * real draft flag (REST `?draft=true` or Local API `draft: true`), including
 * version restores, which skip `beforeChange` hooks on globals.
 */
function assertEditorSavesDraft(req: PayloadRequest, operation: string, args: unknown) {
  if (!req.user || isAdmin(req.user) || !writeOperations.has(operation)) return;
  const write = args as { draft?: boolean; data?: { _status?: unknown } } | undefined;
  if (write?.draft !== true || write.data?._status === "published") throw new Forbidden(req.t);
}

const editorsSaveDraftsCollection: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  assertEditorSavesDraft(req, operation, args);
  return args;
};

const editorsSaveDraftsGlobal: GlobalBeforeOperationHook = ({ args, operation, req }) => {
  assertEditorSavesDraft(req, operation, args);
  return args;
};

// Second line of defence behind the above: whatever shape a request takes, a
// signed-in non-administrator can never produce a published version.
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
  beforeOperation: [editorsSaveDraftsCollection],
  beforeChange: [onlyAdminsPublish],
} satisfies CollectionConfig["hooks"];

export const globalHooks = {
  beforeOperation: [editorsSaveDraftsGlobal],
  beforeChange: [onlyAdminsPublishGlobal],
} satisfies GlobalConfig["hooks"];
