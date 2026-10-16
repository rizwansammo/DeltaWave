import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { images } from "../../lib/images";
import { testEnvironment } from "../../scripts/test-database.mjs";
import {
  admin,
  apiSession,
  ensureAdmin,
  publishedHomepage,
  publishHomepage,
  signIn,
  type HomepageData,
} from "./cms-helpers";
import { settle } from "./helpers";

// The public homepage as driven by the seeded Homepage global, against the
// disposable *_test database. Each test publishes the seeded content again
// afterwards, so the order of tests does not matter for their results.
test.describe.configure({ mode: "serial" });

let adminApi: APIRequestContext;
let editorApi: APIRequestContext;
let visitor: APIRequestContext;
let seeded: HomepageData;
const editor = {
  email: `e2e-home-editor-${randomUUID().slice(0, 8)}@deltawave.test`,
  password: `E2e-${randomUUID()}`,
};

test.beforeAll(async ({ baseURL }) => {
  adminApi = await ensureAdmin(baseURL!);
  visitor = await apiSession(baseURL!);
  seeded = await publishedHomepage(adminApi);
  const created = await adminApi.post("/cms-api/users", {
    data: { ...editor, name: "E2E Homepage Editor", roles: ["editor"] },
  });
  expect(created.status()).toBe(201);
  editorApi = await apiSession(baseURL!, editor);
});

test.afterEach(async () => {
  await publishHomepage(adminApi, seeded);
});

type Section = Record<string, unknown> & { enabled?: boolean };
type Sections = Record<string, Section>;

/** Publishes the seeded homepage with a change applied. */
async function publishWith(change: (data: Sections) => void) {
  const data = structuredClone(seeded) as Sections;
  change(data);
  return publishHomepage(adminApi, data);
}

const homepageHtml = async () => {
  const response = await visitor.get("/");
  expect(response.status()).toBe(200);
  return response.text();
};

type Picture = {
  tag: string;
  alt: string | null;
  width: string | null;
  height: string | null;
  src: string | null;
  srcset: string | null;
};

/**
 * Parses markup with the browser's own parser and serialiser, so server HTML
 * and the fixture compare fairly. Comments (React's text separators) are
 * dropped; image addresses are lifted out to be checked separately.
 */
function analyse(page: Page, html: string, selector: string | null) {
  return page.evaluate(
    ([html, selector]) => {
      const doc = new DOMParser().parseFromString(html.replace(/<!--[\s\S]*?-->/g, ""), "text/html");
      const root = selector ? doc.querySelector(selector) : doc.body;
      if (!root) throw new Error(`No ${selector} in the page`);
      const pictures = [...root.querySelectorAll("img, source")].map((el) => {
        const picture = {
          tag: el.tagName.toLowerCase(),
          alt: el.getAttribute("alt"),
          width: el.getAttribute("width"),
          height: el.getAttribute("height"),
          src: el.getAttribute("src"),
          srcset: el.getAttribute("srcset"),
        };
        el.removeAttribute("src");
        el.removeAttribute("srcset");
        return picture;
      });
      return { markup: root.innerHTML, pictures };
    },
    [html, selector] as const,
  );
}

const withoutAddresses = ({ tag, alt, width, height }: Picture) => ({ tag, alt, width, height });

const candidates = (srcset: string | null) =>
  (srcset ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const [url, width] = c.split(/\s+/);
      return { url, width: Number.parseInt(width, 10) };
    });

test("the published homepage is the approved composition, all nine sections", async ({ page }) => {
  const fixture = (await readFile("tests/fixtures/homepage.approved.html", "utf8")).trimEnd();
  await page.goto("about:blank");
  const expected = await analyse(page, fixture, null);
  const actual = await analyse(page, await homepageHtml(), "main#main-content");

  // Same markup, classes and copy as the prototype, apart from image addresses.
  expect(actual.markup).toBe(expected.markup);
  expect(actual.pictures.map(withoutAddresses)).toEqual(expected.pictures.map(withoutAddresses));
  for (const selector of [
    ".home-hero",
    "#introduction",
    ".services-section",
    ".industry-section",
    ".engineering-section",
    ".portfolio-section",
    ".approach-section",
    ".academy-band",
    ".contact-section",
  ]) {
    expect(actual.markup, selector).toContain(
      selector.startsWith("#") ? `id="${selector.slice(1)}"` : selector.slice(1),
    );
  }

  // Every image now comes from the media library, offering at least the
  // prototype's WebP widths.
  for (const [i, picture] of actual.pictures.entries()) {
    const approved = expected.pictures[i];
    if (picture.tag === "img") expect(picture.src).toMatch(/^\/cms-api\/media\/file\/[\w-]+\.webp$/);
    const widths = candidates(picture.srcset).map((c) => c.width);
    for (const width of candidates(approved.srcset).map((c) => c.width)) expect(widths).toContain(width);
  }
});

test("photographs are served from the media library as the approved files", async ({ page }) => {
  await page.goto("about:blank");
  const { pictures } = await analyse(page, await homepageHtml(), "main#main-content");
  let identical = 0;
  for (const picture of pictures) {
    const urls = picture.tag === "img" ? [{ url: picture.src!, width: 0 }] : candidates(picture.srcset);
    for (const { url, width } of urls) {
      const response = await visitor.get(url);
      expect(response.status(), url).toBe(200);
      expect(response.headers()["content-type"], url).toBe("image/webp");
      const key = url.match(/\/file\/([a-z]+)[-.]/)?.[1] ?? "";
      const approved = images[key];
      expect(approved, url).toBeTruthy();
      const file =
        width === 640 || width === 1100
          ? `${approved.file}-${width}.webp`
          : width === 0 || width === approved.width
            ? `${approved.file}.webp`
            : null;
      if (!file) continue; // A size the prototype never had, such as 1800 px.
      expect(Buffer.from(await response.body()).equals(await readFile(`public/images/${file}`)), url).toBe(true);
      identical++;
    }
  }
  expect(identical).toBeGreaterThanOrEqual(pictures.length);
});

test("every homepage link leads somewhere real", async ({ page }) => {
  await page.goto("/");
  const hrefs = await page
    .locator("main a[href]")
    .evaluateAll((links) => [...new Set(links.map((a) => a.getAttribute("href")!))]);
  expect(hrefs.length).toBeGreaterThan(15);
  for (const href of hrefs) {
    if (href.startsWith("#")) {
      await expect(page.locator(href), href).toHaveCount(1);
    } else if (/^(mailto|tel):/.test(href)) {
      expect(href).toMatch(/^(mailto:[^@\s]+@[\w.-]+\.[a-z]{2,}|tel:\+\d{8,15})$/);
    } else {
      expect(href, "internal links only").toMatch(/^\/(?!\/)/);
      expect((await visitor.get(href)).status(), href).toBe(200);
    }
  }
});

test("an editor's draft stays private until an administrator publishes it, without a rebuild", async ({
  browser,
}) => {
  const published = "Software. Systems. Possibility.";
  const draft = `A reviewed idea ${randomUUID().slice(0, 6)}`;

  const save = async (page: Page, button: string) => {
    const response = page.waitForResponse(
      (r) => r.url().includes("/cms-api/globals/homepage") && r.request().method() === "POST",
    );
    await page.click(button);
    expect((await response).status()).toBe(200);
  };

  // The editor changes the hero eyebrow and saves a draft.
  const editorPage = await (await browser.newContext()).newPage();
  await editorPage.setViewportSize({ width: 1440, height: 900 });
  await signIn(editorPage, editor);
  await editorPage.goto("/admin/globals/homepage");
  const field = editorPage.locator("#field-hero__eyebrow");
  await expect(field).toHaveValue(published);
  await expect(field).toBeEditable();
  // Editors prepare drafts; only administrators are offered Publish.
  await expect(editorPage.locator("#action-save-draft")).toBeVisible();
  await expect(editorPage.locator("#action-save")).toHaveCount(0);
  await field.fill(draft);
  await save(editorPage, "#action-save-draft");
  await expect(editorPage.getByText(/draft saved successfully/i)).toBeVisible();
  await expect(field).toBeEditable();
  await editorPage.screenshot({ path: ".qa/screenshots/homepage-flow-1-editor-draft.png" });

  // Visitors still get the published homepage, in the page and through the API.
  const visitorPage = await (await browser.newContext()).newPage();
  await visitorPage.setViewportSize({ width: 1440, height: 900 });
  await visitorPage.goto("/");
  await expect(visitorPage.locator(".home-hero .eyebrow")).toHaveText(published);
  await settle(visitorPage);
  await visitorPage.screenshot({ path: ".qa/screenshots/homepage-flow-2-visitor-before.png", animations: "disabled" });
  const asDraft = await (await visitor.get("/cms-api/globals/homepage?draft=true")).json();
  expect(asDraft.hero.eyebrow).toBe(published);

  // An administrator reviews the draft and publishes it.
  const adminPage = await (await browser.newContext()).newPage();
  await adminPage.setViewportSize({ width: 1440, height: 900 });
  await signIn(adminPage, admin);
  await adminPage.goto("/admin/globals/homepage");
  await expect(adminPage.locator("#field-hero__eyebrow")).toHaveValue(draft);
  // While the editor's lock on the homepage lasts, Payload offers to take over.
  await adminPage.waitForLoadState("networkidle");
  const locked = adminPage.locator("#document-locked");
  if (await locked.isVisible()) {
    await expect(locked).toContainText(`${editor.email} is currently editing`);
    await locked.getByRole("button", { name: /take over/i }).click();
    await expect(locked).toBeHidden();
  }
  await save(adminPage, "#action-save");
  await expect(adminPage.getByText(/updated successfully|published successfully/i).first()).toBeVisible();
  await adminPage.screenshot({ path: ".qa/screenshots/homepage-flow-3a-admin-published.png" });

  // The next page load shows it: no rebuild, no cache purge.
  await visitorPage.reload();
  await expect(visitorPage.locator(".home-hero .eyebrow")).toHaveText(draft);
  await settle(visitorPage);
  await visitorPage.screenshot({ path: ".qa/screenshots/homepage-flow-3-visitor-after.png", animations: "disabled" });
  await Promise.all([editorPage, visitorPage, adminPage].map((p) => p.context().close()));
});

test("hidden sections disappear, keep their content and come back", async () => {
  await publishWith((d) => {
    d.academy.enabled = false;
    d.introduction.enabled = false;
  });
  const hidden = await homepageHtml();
  expect(hidden).not.toContain("academy-band");
  expect(hidden).not.toContain('id="introduction"');
  expect(hidden).not.toContain("hero-scroll"); // Its link target is gone.
  for (const shown of ["home-hero", "services-section", "industry-section", "portfolio-section", "contact-section"])
    expect(hidden).toContain(shown);
  const stored = await (await adminApi.get("/cms-api/globals/homepage?depth=0")).json();
  expect(stored.academy.heading).toBe((seeded.academy as Section).heading);

  await publishHomepage(adminApi, seeded);
  const shown = await homepageHtml();
  expect(shown).toContain("academy-band");
  expect(shown).toContain('id="introduction"');
});

test("published empty fields stay empty instead of falling back to defaults", async () => {
  await publishWith((d) => {
    d.hero.eyebrow = "";
    d.introduction.body = "";
    d.engineering.capabilities = [];
    d.academy.statusLabel = "";
  });
  const html = await homepageHtml();
  expect(html).not.toContain("Software. Systems. Possibility.");
  expect(html).not.toContain("developing technology enterprise");
  expect(html).not.toContain("capability-lines");
  expect(html).not.toContain("Enrollment is not open");
  expect(html).toContain("moves business");
});

const findBySlug = async (collection: string, slug: string) =>
  (await (await adminApi.get(`/cms-api/${collection}?where[slug][equals]=${slug}&depth=0`)).json()).docs[0];

const setStatus = async (collection: string, id: number, status: "draft" | "published") =>
  expect((await adminApi.patch(`/cms-api/${collection}/${id}`, { data: { _status: status } })).status()).toBe(200);

test("unpublished and deleted related records are left out", async ({ page }) => {
  const cards = () => page.locator(".industry-preview a");

  // An unpublished solution leaves the grid; the numbering stays continuous.
  const healthcare = await findBySlug("solutions", "healthcare-diagnostics");
  await setStatus("solutions", healthcare.id, "draft");
  try {
    await page.goto("/");
    await expect(cards()).toHaveCount(5);
    await expect(page.locator('.industry-preview a[href="/solutions/healthcare-diagnostics"]')).toHaveCount(0);
    await expect(cards().last().locator(".small-label")).toHaveText("05 / Automation");
  } finally {
    await setStatus("solutions", healthcare.id, "published");
  }
  await page.goto("/");
  await expect(cards()).toHaveCount(6);

  // An unpublished portfolio entry is left out.
  const commerce = await findBySlug("portfolio-projects", "commerce-management");
  await setStatus("portfolio-projects", commerce.id, "draft");
  try {
    await page.goto("/");
    await expect(page.locator(".project-list .project-entry")).toHaveCount(1);
  } finally {
    await setStatus("portfolio-projects", commerce.id, "published");
  }

  // A deleted solution disappears from the homepage without an error.
  const temporary = await adminApi.post("/cms-api/solutions", {
    data: {
      title: "Temporary e2e solution",
      label: "Temporary",
      group: "Commerce & operations",
      intro: "Created by the homepage e2e test.",
      challenge: "None.",
      modules: [{ item: "One" }, { item: "Two" }, { item: "Three" }],
      workflow: [{ step: "A" }, { step: "B" }, { step: "C" }, { step: "D" }],
      consideration: "None.",
      slug: "e2e-temporary-solution",
      _status: "published",
    },
  });
  expect(temporary.status()).toBe(201);
  const temporaryId = (await temporary.json()).doc.id;
  await publishWith((d) => {
    d.industries.featured = [...(d.industries.featured as number[]).slice(0, 5), temporaryId];
  });
  await page.goto("/");
  await expect(cards().last()).toHaveAttribute("href", "/solutions/e2e-temporary-solution");
  expect((await adminApi.delete(`/cms-api/solutions/${temporaryId}`)).status()).toBe(200);
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(cards()).toHaveCount(5);
});

test("a deleted hero image leaves no broken image behind", async ({ page }) => {
  const upload = await adminApi.post("/cms-api/media", {
    multipart: {
      file: { name: "e2e-hero.webp", mimeType: "image/webp", buffer: await readFile("public/images/servers-640.webp") },
      _payload: JSON.stringify({ alt: "Temporary hero image" }),
    },
  });
  expect(upload.status()).toBe(201);
  const media = (await upload.json()).doc;
  await publishWith((d) => {
    d.hero.image = media.id;
  });
  await page.goto("/");
  await expect(page.locator(".hero-visual img")).toHaveAttribute("alt", "Temporary hero image");

  expect((await adminApi.delete(`/cms-api/media/${media.id}`)).status()).toBe(200);
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.locator(".hero-visual img")).toHaveCount(0);
  await expect(page.locator(".hero-caption")).toHaveText("Engineering digital progress.");
  await expect(page.locator(".home-hero h1")).toContainText("moves business");
});

test("the homepage cannot be unpublished, by a save or by restoring a draft", async () => {
  const response = await adminApi.post("/cms-api/globals/homepage", { data: { _status: "draft" } });
  expect(response.status()).toBe(400);
  expect(JSON.stringify(await response.json())).toContain("cannot be unpublished");

  // Restoring a draft version as the live one would unpublish it as well.
  const saved = await editorApi.post("/cms-api/globals/homepage?draft=true", {
    data: { hero: { ...(seeded.hero as Section), eyebrow: "Draft to restore" } },
  });
  expect(saved.status()).toBe(200);
  const drafts = await (
    await adminApi.get("/cms-api/globals/homepage/versions?where[version._status][equals]=draft&sort=-updatedAt&limit=1")
  ).json();
  const draftVersion = drafts.docs[0].id;
  const restored = await adminApi.post(`/cms-api/globals/homepage/versions/${draftVersion}`);
  expect(restored.status()).toBe(400);
  expect(JSON.stringify(await restored.json())).toContain("cannot be unpublished");
  // An editor cannot restore any version as the live one.
  expect((await editorApi.post(`/cms-api/globals/homepage/versions/${draftVersion}`)).status()).toBe(403);

  const live = await (await visitor.get("/cms-api/globals/homepage")).json();
  expect(live._status).toBe("published");
  expect(await homepageHtml()).toContain("Software. Systems. Possibility.");
});

test("an editor cannot publish the homepage or change the live version directly", async () => {
  const hero = { ...(seeded.hero as Section), eyebrow: "Editor attempt" };
  for (const attempt of [
    editorApi.post("/cms-api/globals/homepage", { data: { hero } }),
    editorApi.post("/cms-api/globals/homepage", { data: { hero, _status: "published" } }),
    editorApi.post("/cms-api/globals/homepage?draft=true", { data: { hero, _status: "published" } }),
  ])
    expect((await attempt).status()).toBe(403);
  expect(await homepageHtml()).not.toContain("Editor attempt");
});

test("running the seed again changes nothing, even after an administrator's edit", async () => {
  test.setTimeout(180_000);
  const edit = "An administrator's published description.";
  await publishWith((d) => {
    d.hero.description = edit;
  });
  const counts = async () => {
    const total = async (path: string) => (await (await adminApi.get(path)).json()).totalDocs;
    return {
      media: await total("/cms-api/media?limit=1"),
      categories: await total("/cms-api/service-categories?limit=1"),
      solutions: await total("/cms-api/solutions?limit=1"),
      projects: await total("/cms-api/portfolio-projects?limit=1"),
      homepageVersions: await total("/cms-api/globals/homepage/versions?limit=1"),
    };
  };
  const before = await counts();
  const seed = spawnSync("pnpm seed:homepage", {
    shell: true,
    encoding: "utf8",
    env: { ...process.env, ...testEnvironment(), NODE_ENV: "production" },
  });
  expect(seed.status, seed.stderr).toBe(0);
  expect(seed.stdout).toContain("Nothing was changed");
  expect(await counts()).toEqual(before);
  expect(await homepageHtml()).toContain(edit);
});
