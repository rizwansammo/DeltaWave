// Runs after cms.spec.ts (alphabetical order), whose first test needs an empty accounts table.
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { approvedCatalog } from "../../lib/cms/catalog-approved";
import { toCatalog, type Catalog } from "../../lib/cms/catalog-view";
import { testEnvironment } from "../../scripts/test-database.mjs";
import { admin, apiSession, ensureAdmin, signIn } from "./cms-helpers";

// Services, industry solutions and the portfolio as driven by the seeded CMS
// records, against the disposable *_test database. Every test restores what
// it changes.
test.describe.configure({ mode: "serial" });

let adminApi: APIRequestContext;
let editorApi: APIRequestContext;
let visitor: APIRequestContext;
const editor = {
  email: `e2e-catalog-editor-${randomUUID().slice(0, 8)}@deltawave.test`,
  password: `E2e-${randomUUID()}`,
};

test.beforeAll(async ({ baseURL }) => {
  adminApi = await ensureAdmin(baseURL!);
  visitor = await apiSession(baseURL!);
  const created = await adminApi.post("/cms-api/users", {
    data: { ...editor, name: "E2E Catalog Editor", roles: ["editor"] },
  });
  expect(created.status()).toBe(201);
  editorApi = await apiSession(baseURL!, editor);
});

const html = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

async function page(path: string, status = 200) {
  const response = await visitor.get(path);
  expect(response.status(), path).toBe(status);
  return response.text();
}

/** The published catalog as an anonymous visitor reads it through the REST API. */
async function publishedCatalog(): Promise<Catalog> {
  const all = async (collection: string, sort: string) =>
    (await (await visitor.get(`/cms-api/${collection}?depth=0&pagination=false&sort=${sort}`)).json()).docs;
  const docs = {
    categories: await all("service-categories", "number"),
    services: await all("services", "createdAt"),
    solutions: await all("solutions", "order"),
    projects: await all("portfolio-projects", "createdAt"),
    media: await all("media", "createdAt"),
  };
  return toCatalog(docs);
}

const withoutImages = (catalog: Catalog) =>
  JSON.parse(JSON.stringify(catalog, (key, value) => (key === "photo" || key === "image" ? null : value)));

type Doc = { id: number; slug: string; title: string; name: string; _status: string };
const bySlug = async (collection: string, slug: string): Promise<Doc> =>
  (await (await adminApi.get(`/cms-api/${collection}?where[slug][equals]=${slug}&depth=0`)).json()).docs[0];
const rows = (body: string) => (body.match(/class="solution-row"/g) ?? []).length;
const patch = async (api: APIRequestContext, path: string, data: Record<string, unknown>) =>
  (await api.patch(path, { data })).status();

test("the seeded records are exactly the approved services, solutions and portfolio", async () => {
  const catalog = await publishedCatalog();
  expect(catalog.categories).toHaveLength(4);
  expect(catalog.services).toHaveLength(18);
  expect(catalog.solutions).toHaveLength(15);
  expect(catalog.projects).toHaveLength(2);
  // Copy, slugs, order and every relationship match lib/content.ts.
  expect(withoutImages(catalog)).toEqual(withoutImages(approvedCatalog()));
  expect(catalog.categories.every((c) => c.photo)).toBe(true);
  expect(catalog.projects.every((p) => p.photo)).toBe(true);
});

test("every detail page and directory is served from the published records", async () => {
  const catalog = await publishedCatalog();
  for (const s of catalog.services) {
    const body = await page("/services/" + s.slug);
    expect(body, s.slug).toContain(`<h1>${html(s.title)}</h1>`);
    expect(body, s.slug).toContain(`<title>${html(s.seo.title)} | DeltaWave Technology</title>`);
  }
  for (const s of catalog.solutions) expect(await page("/solutions/" + s.slug), s.slug).toContain(`<h1>${html(s.title)}</h1>`);
  for (const p of catalog.projects) expect(await page("/portfolio/" + p.slug), p.slug).toContain(`<h1>${html(p.name)}</h1>`);

  const services = await page("/services");
  for (const c of catalog.categories) {
    expect(services).toContain(html(c.description));
    for (const s of c.services) expect(services).toContain(`href="/services/${s.slug}"`);
  }
  const solutions = await page("/solutions");
  expect(rows(solutions)).toBe(15);
  for (const s of catalog.solutions) expect(solutions).toContain(`href="/solutions/${s.slug}"`);
  const portfolio = await page("/portfolio");
  for (const p of catalog.projects) expect(portfolio).toContain(`href="/portfolio/${p.slug}"`);
});

test("the header menus list the published services and solutions", async ({ page: browser }) => {
  const catalog = await publishedCatalog();
  await browser.setViewportSize({ width: 1440, height: 900 });
  await browser.goto("/about");
  await browser.locator('button[aria-controls="mega-Services"]').click();
  const services = browser.locator("#mega-Services");
  for (const c of catalog.categories) {
    await expect(services.locator(`a.mega-heading[href="${c.href}"]`)).toContainText(c.title);
    for (const s of c.services.slice(0, 4)) await expect(services.locator(`a[href="/services/${s.slug}"]`)).toHaveText(s.title);
    for (const s of c.menuSolutions) await expect(services.locator(`a[href="/solutions/${s.slug}"]`)).toHaveText(s.title);
  }
  await browser.keyboard.press("Escape");
  await browser.locator('button[aria-controls="mega-Solutions"]').click();
  await expect(browser.locator("#mega-Solutions a.mega-sub")).toHaveCount(catalog.solutions.length);

  await browser.setViewportSize({ width: 390, height: 844 });
  await browser.goto("/about");
  await browser.locator(".mobile-toggle").click();
  await browser.locator('button[aria-controls="mobile-Solutions"]').click();
  await expect(browser.locator("#mobile-Solutions a")).toHaveText(catalog.solutions.map((s) => s.title));
});

test("a service draft stays private until an administrator publishes it; pages and menus follow", async ({ browser }) => {
  const original = await bySlug("services", "web-application-development");
  const draft = `Web applications ${randomUUID().slice(0, 6)}`;
  const save = async (p: Page, button: string) => {
    const response = p.waitForResponse((r) => r.url().includes(`/cms-api/services/${original.id}`) && r.request().method() === "PATCH");
    await p.click(button);
    expect((await response).status()).toBe(200);
  };
  try {
    // The editor changes the title in the admin and saves a draft.
    const editorPage = await (await browser.newContext()).newPage();
    await signIn(editorPage, editor);
    await editorPage.goto(`/admin/collections/services/${original.id}`);
    const field = editorPage.locator("#field-title");
    await expect(field).toHaveValue(original.title);
    await expect(editorPage.locator("#action-save")).toHaveCount(0);
    await field.fill(draft);
    await save(editorPage, "#action-save-draft");
    for (const path of ["/services/web-application-development", "/services", "/about"])
      expect(await page(path), path).not.toContain(draft);
    expect(await page("/services/web-application-development")).toContain(`<h1>${html(original.title)}</h1>`);
    // Editors can never change the live record directly.
    expect(await patch(editorApi, `/cms-api/services/${original.id}`, { title: draft })).toBe(403);
    expect(await patch(editorApi, `/cms-api/services/${original.id}?draft=true`, { title: draft, _status: "published" })).toBe(403);

    // The administrator reviews and publishes it in the admin.
    const adminPage = await (await browser.newContext()).newPage();
    await signIn(adminPage, admin);
    await adminPage.goto(`/admin/collections/services/${original.id}`);
    await expect(adminPage.locator("#field-title")).toHaveValue(draft);
    await adminPage.waitForLoadState("networkidle");
    const locked = adminPage.locator("#document-locked");
    if (await locked.isVisible()) await locked.getByRole("button", { name: /take over/i }).click();
    await save(adminPage, "#action-save");

    // Detail page, category listing, related lists and menus, without a rebuild.
    expect(await page("/services/web-application-development")).toContain(`<h1>${draft}</h1>`);
    expect(await page("/services")).toContain(draft);
    expect(await page("/services/software-engineering")).toContain(`<h3>${draft}</h3>`);
    expect(await page("/solutions/education-coaching")).toContain(`<h3>${draft}</h3>`);
    expect(await page("/about")).toContain(draft);
    await Promise.all([editorPage, adminPage].map((p) => p.context().close()));
  } finally {
    expect(await patch(adminApi, `/cms-api/services/${original.id}`, { title: original.title, _status: "published" })).toBe(200);
  }
  expect(await page("/services/web-application-development")).toContain(`<h1>${html(original.title)}</h1>`);
});

test("solution and portfolio drafts stay private; publishing updates pages, directory and menus", async () => {
  const solution = await bySlug("solutions", "healthcare-diagnostics");
  const project = await bySlug("portfolio-projects", "coaching-management");
  const solutionTitle = `Healthcare systems ${randomUUID().slice(0, 6)}`;
  const projectName = `Coaching Platform ${randomUUID().slice(0, 6)}`;
  try {
    expect(await patch(editorApi, `/cms-api/solutions/${solution.id}?draft=true`, { title: solutionTitle })).toBe(200);
    expect(await patch(editorApi, `/cms-api/portfolio-projects/${project.id}?draft=true`, { name: projectName })).toBe(200);
    for (const path of ["/solutions/healthcare-diagnostics", "/solutions", "/portfolio/coaching-management", "/portfolio", "/", "/about"]) {
      const body = await page(path);
      expect(body, path).not.toContain(solutionTitle);
      expect(body, path).not.toContain(projectName);
    }
    const asDraft = await (await visitor.get(`/cms-api/solutions/${solution.id}?draft=true`)).json();
    expect(asDraft.title).toBe(solution.title);

    expect(await patch(adminApi, `/cms-api/solutions/${solution.id}`, { title: solutionTitle, _status: "published" })).toBe(200);
    expect(await patch(adminApi, `/cms-api/portfolio-projects/${project.id}`, { name: projectName, _status: "published" })).toBe(200);
    expect(await page("/solutions/healthcare-diagnostics")).toContain(`<h1>${solutionTitle}</h1>`);
    expect(await page("/solutions")).toContain(`<h3>${solutionTitle}</h3>`);
    expect(await page("/about")).toContain(solutionTitle); // Solutions menu
    expect(await page("/portfolio/coaching-management")).toContain(`<h1>${projectName}</h1>`);
    expect(await page("/portfolio")).toContain(projectName);
    expect(await page("/")).toContain(projectName); // Homepage portfolio section
  } finally {
    expect(await patch(adminApi, `/cms-api/solutions/${solution.id}`, { title: solution.title, _status: "published" })).toBe(200);
    expect(await patch(adminApi, `/cms-api/portfolio-projects/${project.id}`, { name: project.name, _status: "published" })).toBe(200);
  }
});

test("unpublished and missing records are real 404s and leave every listing", async () => {
  const service = await bySlug("services", "managed-it-support");
  const solution = await bySlug("solutions", "accounting-finance");
  try {
    expect(await patch(adminApi, `/cms-api/services/${service.id}`, { _status: "draft" })).toBe(200);
    expect(await patch(adminApi, `/cms-api/solutions/${solution.id}`, { _status: "draft" })).toBe(200);
    await page("/services/managed-it-support", 404);
    await page("/solutions/accounting-finance", 404);
    for (const path of ["/services", "/services/cloud-managed-it", "/solutions", "/about", "/sitemap.xml"]) {
      const body = await page(path);
      expect(body, path).not.toContain("/services/managed-it-support");
      expect(body, path).not.toContain("/solutions/accounting-finance");
    }
    expect(rows(await page("/solutions"))).toBe(14);
  } finally {
    expect(await patch(adminApi, `/cms-api/services/${service.id}`, { _status: "published" })).toBe(200);
    expect(await patch(adminApi, `/cms-api/solutions/${solution.id}`, { _status: "published" })).toBe(200);
  }
  await page("/services/managed-it-support");
  for (const path of ["/services/not-a-service", "/solutions/not-a-solution", "/portfolio/not-a-project", "/services/managed-it-support/extra"])
    await page(path, 404);
});

test("a newly published solution is reachable at once; hidden pages stay out of search", async () => {
  const created = await adminApi.post("/cms-api/solutions", {
    data: {
      title: "E2E fisheries cooperative",
      label: "Cooperative",
      group: "Services & communities",
      order: 16,
      intro: "Created by the catalog e2e test.",
      challenge: "None.",
      modules: [{ item: "Members" }, { item: "Catch records" }],
      workflow: [{ step: "A" }, { step: "B" }, { step: "C" }, { step: "D" }],
      consideration: "None.",
      slug: "e2e-fisheries-cooperative",
      seo: { noIndex: true },
      _status: "published",
    },
  });
  expect(created.status()).toBe(201);
  const id = (await created.json()).doc.id;
  try {
    const body = await page("/solutions/e2e-fisheries-cooperative");
    expect(body).toContain("<h1>E2E fisheries cooperative</h1>");
    expect(body).toMatch(/<meta name="robots" content="noindex[^"]*"\/>/);
    const directory = await page("/solutions");
    expect(rows(directory)).toBe(16);
    expect(directory).toMatch(/<span class="solution-index">16<\/span><h3>E2E fisheries cooperative<\/h3>/);
    expect(await page("/sitemap.xml")).not.toContain("e2e-fisheries-cooperative");
  } finally {
    expect((await adminApi.delete(`/cms-api/solutions/${id}`)).status()).toBe(200);
  }
  await page("/solutions/e2e-fisheries-cooperative", 404);
});

test("running the content seed again changes nothing and keeps published edits", async () => {
  test.setTimeout(180_000);
  const solution = await bySlug("solutions", "events-membership");
  const edited = `Events and memberships ${randomUUID().slice(0, 6)}`;
  expect(await patch(adminApi, `/cms-api/solutions/${solution.id}`, { title: edited, _status: "published" })).toBe(200);
  try {
    const total = async (path: string) => (await (await adminApi.get(path)).json()).totalDocs;
    const counts = async () =>
      Promise.all(["services", "solutions", "service-categories", "portfolio-projects", "media"].map((c) => total(`/cms-api/${c}?limit=1`)));
    const before = await counts();
    const seed = spawnSync("pnpm seed:content", {
      shell: true,
      encoding: "utf8",
      env: { ...process.env, ...testEnvironment(), NODE_ENV: "production" },
    });
    expect(seed.status, seed.stderr).toBe(0);
    expect(seed.stdout).toContain("Nothing was changed");
    expect(await counts()).toEqual(before);
    expect(await page("/solutions/events-membership")).toContain(`<h1>${edited}</h1>`);
  } finally {
    expect(await patch(adminApi, `/cms-api/solutions/${solution.id}`, { title: solution.title, _status: "published" })).toBe(200);
  }
});
