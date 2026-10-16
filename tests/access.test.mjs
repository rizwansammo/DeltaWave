import test from "node:test";
import assert from "node:assert/strict";
import {
  adminOnly,
  draftWriteAccess,
  isStaff,
  publishedOrStaff,
} from "../cms/access.ts";
import { Users } from "../cms/collections/Users.ts";
import { contentHooks, globalHooks } from "../cms/versioned.ts";
import { Media, allowedImageTypes } from "../cms/collections/Media.ts";
import { validateHref } from "../cms/fields.ts";

const admin = { id: 1, roles: ["admin"] };
const editor = { id: 2, roles: ["editor"] };
const req = (user, query = {}) => ({ user, query });

test("visitors only read published content", () => {
  assert.deepEqual(publishedOrStaff({ req: req(null) }), {
    _status: { equals: "published" },
  });
  assert.equal(publishedOrStaff({ req: req(editor) }), true);
  assert.equal(publishedOrStaff({ req: req(admin) }), true);
});

test("only administrators publish; editors save drafts", () => {
  const publish = { _status: "published" };
  const draft = { _status: "draft" };
  assert.equal(draftWriteAccess({ req: req(admin), data: publish }), true);
  assert.equal(draftWriteAccess({ req: req(editor, { draft: "true" }), data: draft }), true);
  assert.equal(draftWriteAccess({ req: req(editor, { draft: "true" }), data: publish }), false);
  // A non-draft write would replace the live document, so editors cannot make one.
  assert.equal(draftWriteAccess({ req: req(editor), data: draft }), false);
  assert.equal(draftWriteAccess({ req: req(null, { draft: "true" }), data: draft }), false);
});

test("no write by a non-administrator can end up published", () => {
  const t = (key) => key;
  for (const hook of [contentHooks.beforeChange[0], globalHooks.beforeChange[0]]) {
    assert.throws(
      () => hook({ data: { _status: "published" }, req: { user: editor, t } }),
      (error) => error.status === 403,
    );
    assert.deepEqual(hook({ data: { _status: "draft" }, req: { user: editor, t } }), { _status: "draft" });
    assert.deepEqual(hook({ data: { _status: "published" }, req: { user: admin, t } }), { _status: "published" });
  }
});

test("unknown roles get no CMS access", () => {
  assert.equal(isStaff({ roles: ["viewer"] }), false);
  assert.equal(isStaff(null), false);
  assert.equal(adminOnly({ req: req(editor) }), false);
});

test("accounts: admins manage everyone, editors only themselves", () => {
  assert.equal(Users.access.create({ req: req(editor) }), false);
  assert.equal(Users.access.delete({ req: req(editor) }), false);
  assert.equal(Users.access.read({ req: req(null) }), false);
  assert.equal(Users.access.read({ req: req(admin) }), true);
  assert.deepEqual(Users.access.update({ req: req(editor) }), { id: { equals: 2 } });
  const roles = Users.fields.find((f) => f.name === "roles");
  assert.equal(roles.access.update({ req: req(editor) }), false);
  assert.equal(roles.access.update({ req: req(admin) }), true);
});

test("uploads are restricted raster images without remote fetching", () => {
  assert.deepEqual(allowedImageTypes, ["image/jpeg", "image/png", "image/webp", "image/avif"]);
  assert.ok(!Media.upload.mimeTypes.includes("image/svg+xml"));
  assert.equal(Media.upload.pasteURL, false);
  assert.equal(Media.access.read(), true);
  assert.equal(Media.access.create({ req: req(null) }), false);
  assert.equal(Media.access.delete({ req: req(editor) }), false);
  assert.equal(Media.fields.find((f) => f.name === "alt").required, true);
});

test("links accept site paths and safe schemes only", () => {
  for (const ok of ["/contact", "/services/ui-ux-design", "https://www.deltawave.tech", "mailto:rizwan@deltawave.tech", "tel:+8801821777620"])
    assert.equal(validateHref(ok, {}), true, ok);
  for (const bad of ["javascript:alert(1)", "//evil.example", "http://insecure.example", "data:text/html,x", "contact"])
    assert.notEqual(validateHref(bad, {}), true, bad);
});
