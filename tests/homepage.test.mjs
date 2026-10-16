import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HomePage } from "../components/site/pages.tsx";
import {
  approvedHomepageView,
  mediaPhoto,
  toHomepageView,
  toLines,
  toLink,
} from "../lib/cms/homepage-view.ts";
import { approvedHomepage } from "../lib/cms/homepage-approved.ts";
import { isDatabaseUnavailable } from "../lib/cms/errors.ts";
import { homepageNotices, readHomepage } from "../lib/cms/homepage-state.ts";
import { refuseUnpublish } from "../cms/globals/Homepage.ts";
import { site } from "../lib/site.ts";
import { approvedPageContentView, approvedSettingsView, businessContact } from "../lib/cms/pages-view.ts";
import { approvedCatalog } from "../lib/cms/catalog-approved.ts";
import { extraServiceOptions } from "../cms/options.ts";

// The contact band's business details come from the published site settings.
const approvedSettings = approvedSettingsView();
const contactData = {
  introLines: approvedPageContentView().contact.section.detailsIntroLines,
  note: approvedPageContentView().contact.section.note,
  details: businessContact(approvedSettings),
  serviceOptions: [
    ...approvedCatalog().categories.map((category) => category.title),
    ...extraServiceOptions,
  ],
};

const markup = (content) =>
  renderToStaticMarkup(h(HomePage, { content, contact: contactData })).replace(
    /^(<link rel="preload" as="image"[^>]*\/>)+/,
    "",
  );

// tests/fixtures/homepage.approved.html was rendered from the prototype's
// hard-coded HomePage before the CMS refactor.
test("approved content renders exactly the prototype homepage markup", async () => {
  const approved = (await readFile("tests/fixtures/homepage.approved.html", "utf8")).trimEnd();
  assert.equal(markup(approvedHomepageView()), approved);
});

// A published Homepage global as Payload returns it to an anonymous visitor.
const media = (name, width, height) => ({
  id: 1,
  alt: `${name} alt`,
  url: `${site.url}/cms-api/media/file/${name}.jpg`,
  width,
  height,
  sizes: {
    thumbnail: { url: `/cms-api/media/file/${name}-400x300.jpg`, width: 400, mimeType: "image/jpeg" },
    small: { url: `/cms-api/media/file/${name}-640.webp`, width: 640, mimeType: "image/webp" },
    medium: { url: `/cms-api/media/file/${name}-1100.webp`, width: 1100, mimeType: "image/webp" },
    large: { url: null, width: null, mimeType: null },
  },
});
const solution = (slug, label) => ({
  id: slug.length,
  slug,
  label,
  title: `${label} title`,
  modules: [{ item: "One" }, { item: "Two" }, { item: "Three" }, { item: "Four" }],
});
const published = () => ({
  id: 1,
  _status: "published",
  hero: {
    eyebrow: "Eyebrow",
    heading: "Line one\r\nLine two",
    headingAccent: "",
    description: "Description",
    primaryLink: { label: "Go", href: "/contact" },
    secondaryLink: { label: "", href: "/services" },
    scrollLabel: "Scroll",
    image: media("architecture", 2200, 1467),
    imageCaption: "",
  },
  introduction: { enabled: false, heading: "Hidden but kept" },
  services: { enabled: true, heading: "Services", featureImage: 42 },
  industries: { enabled: true, heading: "Industries", featured: [solution("healthcare", "Health"), 7] },
  engineering: { enabled: null, heading: "Engineering", capabilities: [{ item: "A" }, { item: "  " }] },
  portfolio: {
    enabled: true,
    heading: "Portfolio",
    projects: [
      {
        slug: "real",
        name: "Real",
        title: "A real project",
        type: "Real projects",
        projectStatus: "Completed",
        intro: "Intro",
        image: null,
      },
      3,
    ],
  },
  approach: { heading: "Approach", steps: [{ title: "First", description: "Do it" }] },
  academy: { enabled: true, heading: "Academy", statusLabel: "In planning" },
  contact: { enabled: false, heading: "Contact" },
});
const categories = [{ slug: "software", number: "01", title: "Software", description: "Build it" }];

test("published content maps to the view without defaults", () => {
  const view = toHomepageView(published(), categories);
  assert.deepEqual(view.hero.headingLines, ["Line one", "Line two"]);
  assert.equal(view.hero.headingAccent, "");
  assert.equal(view.hero.secondaryLink, null, "a link without a label is dropped");
  assert.deepEqual(view.hero.primaryLink, { label: "Go", href: "/contact" });
  assert.equal(view.introduction.enabled, false);
  assert.deepEqual(view.introduction.headingLines, ["Hidden but kept"], "hidden content stays intact");
  assert.equal(view.engineering.enabled, true, "an unset toggle means shown");
  assert.deepEqual(view.engineering.capabilities, ["A"]);
  assert.deepEqual(view.services.categories, categories);
  assert.equal(view.services.featureImage, null, "an unpopulated image is left out");
  assert.equal(view.contact.enabled, false);
});

test("unreadable related records are left out, not shown", () => {
  const view = toHomepageView(published(), categories);
  assert.deepEqual(view.industries.items, [
    { slug: "healthcare", label: "Health", title: "Health title", summary: "One. Two. Three" },
  ]);
  assert.equal(view.portfolio.projects.length, 1);
  assert.equal(view.portfolio.projects[0].status, "Completed");
  assert.equal(view.portfolio.projects[0].linkLabel, "View the project");
  assert.equal(view.portfolio.projects[0].photo, null);
});

test("CMS images keep their alt text, size and WebP variants", () => {
  assert.deepEqual(mediaPhoto(media("architecture", 2200, 1467)), {
    src: "/cms-api/media/file/architecture.jpg",
    srcSet: "/cms-api/media/file/architecture-640.webp 640w, /cms-api/media/file/architecture-1100.webp 1100w",
    width: 2200,
    height: 1467,
    alt: "architecture alt",
  });
  const master = { ...media("architecture", 2200, 1467), mimeType: "image/webp", url: `${site.url}/cms-api/media/file/architecture.webp` };
  assert.equal(
    mediaPhoto(master).srcSet,
    "/cms-api/media/file/architecture-640.webp 640w, /cms-api/media/file/architecture-1100.webp 1100w, /cms-api/media/file/architecture.webp 2200w",
    "a WebP original is the widest candidate, as in the prototype",
  );
  const sameWidth = {
    ...master,
    width: 1100,
    sizes: { ...master.sizes, medium: { url: "/m.webp", width: 1100, mimeType: "image/webp" } },
  };
  assert.doesNotMatch(mediaPhoto(sameWidth).srcSet, /architecture\.webp/, "no duplicate width");
  const cdn = { ...media("cdn", 100, 50), url: "https://media.example.com/cdn.jpg" };
  assert.equal(mediaPhoto(cdn).src, "https://media.example.com/cdn.jpg", "other origins stay absolute");
  assert.equal(mediaPhoto(5), null);
  assert.equal(mediaPhoto({ ...media("x", 0, 0), width: null }), null);
});

test("a hidden section disappears and the scroll cue follows the introduction", () => {
  const content = toHomepageView(published(), categories);
  const html = markup(content);
  assert.doesNotMatch(html, /id="introduction"/);
  assert.doesNotMatch(html, /hero-scroll/, "no link to a hidden section");
  assert.doesNotMatch(html, /contact-section/);
  assert.match(html, /<h1>Line one<br\/>Line two<\/h1>/);
  const shown = markup(approvedHomepageView());
  assert.match(shown, /href="#introduction"/);
  assert.match(shown, /id="introduction"/);
});

test("published empty fields render nothing instead of defaults", () => {
  const doc = published();
  doc.hero.eyebrow = "";
  doc.approach.steps = [];
  const html = markup(toHomepageView(doc, []));
  assert.doesNotMatch(html, /Software\. Systems\. Possibility\./);
  assert.doesNotMatch(html, /approach-list/);
  assert.doesNotMatch(html, /service-number/);
});

test("text helpers", () => {
  assert.deepEqual(toLines(""), []);
  assert.deepEqual(toLines(null), []);
  assert.deepEqual(toLines(" One \nTwo "), ["One", "Two"]);
  assert.equal(toLink({ label: "Go", href: "" }), null);
  assert.deepEqual(toLink({ label: " Go ", href: " /x " }), { label: "Go", href: "/x" });
});

test("the approved content matches the seed's source of truth", () => {
  assert.equal(approvedHomepage.industries.featured.length, 6);
  assert.equal(approvedHomepage.portfolio.projects.length, 2);
  assert.equal(approvedHomepage.academy.statusLabel, "In planning · Enrollment is not open");
});

test("only an unreachable database counts as unavailable", () => {
  assert.equal(isDatabaseUnavailable(Object.assign(new Error("x"), { code: "ECONNREFUSED" })), true);
  assert.equal(isDatabaseUnavailable(new Error("Error: cannot connect to Postgres: refused")), true);
  assert.equal(
    isDatabaseUnavailable(new Error("query failed", { cause: Object.assign(new Error("y"), { code: "57P01" }) })),
    true,
  );
  assert.equal(
    isDatabaseUnavailable(new AggregateError([Object.assign(new Error("a"), { code: "ECONNREFUSED" })])),
    true,
  );
  assert.equal(isDatabaseUnavailable(Object.assign(new Error("Forbidden"), { status: 403 })), false);
  assert.equal(isDatabaseUnavailable(new TypeError("cannot read properties of undefined")), false);
  assert.equal(isDatabaseUnavailable(Object.assign(new Error("dup"), { code: "23505" })), false);
});

// A stand-in for the Payload Local API, recording every call.
function reader({ doc = {}, versions = 0, fail } = {}) {
  const calls = [];
  const logs = [];
  return {
    calls,
    logs,
    findGlobal: async (args) => {
      calls.push(["findGlobal", args]);
      if (fail) throw fail;
      return doc;
    },
    find: async (args) => {
      calls.push(["find", args]);
      return { docs: categories };
    },
    countGlobalVersions: async (args) => {
      calls.push(["countGlobalVersions", args]);
      return { totalDocs: versions };
    },
    logger: { warn: (m) => logs.push(["warn", m]), error: (m) => logs.push(["error", m]) },
  };
}

test("published: content is read as an anonymous visitor, published only", async () => {
  const payload = reader({ doc: published() });
  const result = await readHomepage(async () => payload);
  assert.equal(result.state, "published");
  assert.deepEqual(result.content, toHomepageView(published(), categories));
  const reads = payload.calls.filter(([name]) => name !== "countGlobalVersions");
  assert.equal(reads.length, 2);
  for (const [name, args] of reads) {
    assert.equal(args.overrideAccess, false, `${name} must apply access control`);
    assert.equal(args.draft, false, `${name} must not read drafts`);
  }
  assert.deepEqual(payload.logs, []);
});

test("draft: drafts are never shown; the approved content stays until a first publication", async () => {
  const payload = reader({ doc: {}, versions: 3 });
  const result = await readHomepage(async () => payload);
  assert.equal(result.state, "draft");
  assert.deepEqual(result.content, approvedHomepageView());
  assert.deepEqual(payload.logs, [["warn", homepageNotices.draft]]);
});

test("uninitialized: the approved content is served and the missing seed is logged", async () => {
  const payload = reader({ doc: {}, versions: 0 });
  const result = await readHomepage(async () => payload);
  assert.equal(result.state, "uninitialized");
  assert.deepEqual(result.content, approvedHomepageView());
  assert.deepEqual(payload.logs, [["warn", homepageNotices.uninitialized]]);
});

test("unavailable: an unreachable database falls back and is logged", async (t) => {
  const consoleError = t.mock.method(console, "error", () => {});
  const refused = Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:54330"), { code: "ECONNREFUSED" });
  const atStart = await readHomepage(async () => {
    throw refused;
  });
  assert.equal(atStart.state, "unavailable");
  assert.deepEqual(atStart.content, approvedHomepageView());
  assert.equal(consoleError.mock.callCount(), 1);

  const payload = reader({ fail: new Error("Error: cannot connect to Postgres") });
  const midway = await readHomepage(async () => payload);
  assert.equal(midway.state, "unavailable");
  assert.equal(payload.logs[0][0], "error");
  assert.equal(payload.logs[0][1].msg, homepageNotices.unavailable);
});

test("every other failure is thrown, never masked by the fallback", async () => {
  const forbidden = Object.assign(new Error("You are not allowed to perform this action."), { status: 403 });
  await assert.rejects(readHomepage(async () => reader({ fail: forbidden })), /not allowed/);
  await assert.rejects(
    readHomepage(async () => {
      throw new TypeError("config is broken");
    }),
    /config is broken/,
  );
});

test("the published homepage cannot be unpublished, by a save or by a restore", async () => {
  const versions = { 7: "draft", 8: "published" };
  const req = {
    payload: { findGlobalVersionByID: async ({ id }) => ({ version: { _status: versions[id] } }) },
  };
  const run = (operation, args) => refuseUnpublish({ args, operation, req });
  const unpublishing = (error) =>
    error.status === 400 && error.isPublic === true && /cannot be unpublished/.test(error.message);

  await assert.rejects(run("update", { draft: false, data: { _status: "draft" } }), unpublishing);
  await assert.rejects(run("restoreVersion", { id: 7, draft: false }), unpublishing, "a draft made live");
  const draftSave = { draft: true, data: { _status: "draft", hero: { eyebrow: "Draft" } } };
  assert.equal(await run("update", draftSave), draftSave, "draft saves are fine");
  const publish = { draft: false, data: { _status: "published" } };
  assert.equal(await run("update", publish), publish);
  assert.ok(await run("restoreVersion", { id: 8, draft: false }), "restoring a published version");
  assert.ok(await run("restoreVersion", { id: 7, draft: true }), "restoring as a draft");
});
