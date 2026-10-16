import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { expect, request as playwrightRequest, test, type APIRequestContext } from "@playwright/test";
import { admin, apiSession, publishedHomepage, publishHomepage, signIn } from "./cms-helpers";
import { horizontalOverflow, measureBrand, roundedElements, settle } from "./helpers";

// Runs in order against the disposable *_test database, which starts with the
// seeded homepage content and no accounts.
test.describe.configure({ mode: "serial" });

const password = () => `E2e-${randomUUID()}`;
const editor = { email: "e2e-editor@deltawave.test", password: password() };

test.describe("CMS admin interface", () => {
  test("the first visit leads to a branded account set-up", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const response = await page.goto("/admin");
    expect(response?.headers()["x-robots-tag"]).toBe("noindex, nofollow");
    await expect(page).toHaveURL(/\/admin\/create-first-user$/);
    await expect(page).toHaveTitle("Create first user | DeltaWave CMS");
    await settle(page);
    const brand = await measureBrand(page, ".dw-auth-brand");
    expect(brand?.brand).toMatchObject({ width: 224, height: 40 });
    expect(brand?.elnathLoaded).toBe(true);
    // The first account is offered, and saved, as an administrator.
    await expect(page.locator(".multi-value-label__text")).toHaveText(["Administrator"]);
    expect(await roundedElements(page)).toEqual([]);
    await page.screenshot({ path: ".qa/screenshots/cms-create-first-user.png" });

    await page.fill("#field-email", admin.email);
    await page.fill("#field-password", admin.password);
    await page.fill("#field-confirm-password", admin.password);
    await page.fill("#field-name", "E2E Administrator");
    await page.click("button[type=submit]");
    await page.waitForURL(/\/admin$/);
    await expect(page.locator(".dw-dashboard-intro")).toBeVisible();
  });

  test("dashboard, navigation and header carry the DeltaWave brand", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await signIn(page, admin);
    await settle(page);
    await expect(page).toHaveTitle(/\| DeltaWave CMS$/);
    const nav = await measureBrand(page, ".dw-nav-brand");
    expect(nav?.brand).toMatchObject({ width: 224, height: 40 });
    expect(nav?.text.map((t) => t.content)).toEqual(["DELTAWAVE", "TECHNOLOGY"]);
    const icon = await page.locator(".step-nav__home .dw-admin-icon").boundingBox();
    expect(icon?.height).toBeCloseTo(18, 1);
    expect(icon?.width).toBeCloseTo((49.25 * 18) / 39.5, 1);
    expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toBe(
      "Manrope, Arial, sans-serif",
    );
    expect(await page.evaluate(() => document.fonts.check("13px Manrope"))).toBe(true);
    // Phase 2A sidebar refinement: branding + native, permission-filtered nav.
    await expect(page.locator(".dw-nav-overview")).toBeVisible();
    await expect(page.locator("#nav-global-homepage")).toBeVisible();
    await expect(page.locator("#nav-media")).toBeVisible();
    await expect(page.locator(".dw-nav-utilities a[href='/admin/account']")).toBeVisible();
    await expect(page.locator(".dw-nav-utilities a[href='/']")).toBeVisible();
    expect(
      await page.locator("aside.nav").evaluate((element) => getComputedStyle(element).backgroundColor),
    ).toBe("rgb(19, 43, 70)");
    await page.screenshot({ path: ".qa/screenshots/cms-dashboard-1600.png" });
  });

  test("admin views use square corners throughout", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await signIn(page, admin);
    for (const path of [
      "/admin",
      "/admin/collections/pages",
      "/admin/collections/pages/create",
      "/admin/collections/services/create",
      "/admin/collections/media/create",
      "/admin/globals/homepage",
      "/admin/globals/site-settings",
      "/admin/account",
    ]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      expect(await roundedElements(page), path).toEqual([]);
    }
    await page.goto("/admin/globals/homepage");
    await page.screenshot({ path: ".qa/screenshots/cms-homepage-editor.png" });
  });

  test("sign out and sign in again, with a clear error for a wrong password", async ({ page }) => {
    await signIn(page, admin);
    await page.goto("/admin/logout");
    await page.waitForURL(/\/admin\/login/);
    await settle(page);
    const brand = await measureBrand(page, ".login__brand");
    expect(brand?.brand).toMatchObject({ width: 224, height: 40 });
    await page.screenshot({ path: ".qa/screenshots/cms-login.png" });
    await page.fill("#field-email", admin.email);
    await page.fill("#field-password", "not-the-password");
    await page.click("button[type=submit]");
    await expect(page.getByText(/email or password provided is incorrect/i)).toBeVisible();
    await page.fill("#field-password", admin.password);
    await page.click("button[type=submit]");
    await page.waitForURL(/\/admin$/);
  });

  test("the admin is usable at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin/login");
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    await signIn(page, admin);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    await page.getByRole("button", { name: "Open Menu" }).filter({ visible: true }).first().click();
    await expect(page.locator(".dw-nav-brand")).toBeVisible();
    await page.screenshot({ path: ".qa/screenshots/cms-mobile-nav-390.png" });
  });
});

test.describe("CMS API security", () => {
  let adminApi: APIRequestContext;
  let editorApi: APIRequestContext;
  let visitor: APIRequestContext;

  test.beforeAll(async ({ baseURL }) => {
    adminApi = await apiSession(baseURL!, admin);
    visitor = await apiSession(baseURL!);
  });

  test("Payload's REST API answers at /cms-api, not /api", async () => {
    expect(await (await visitor.get("/cms-api/users/me")).json()).toMatchObject({ user: null });
    expect((await visitor.get("/api/users/me")).status()).toBe(404);
    expect((await visitor.get("/cms-api/graphql")).status()).toBe(404);
    const me = await (await adminApi.get("/cms-api/users/me")).json();
    expect(me.user.roles).toEqual(["admin"]);
  });

  test("session cookies are HttpOnly and SameSite=Lax", async ({ baseURL }) => {
    const context = await playwrightRequest.newContext({ baseURL });
    const login = await context.post("/cms-api/users/login", {
      data: { email: admin.email, password: admin.password },
    });
    const cookie = login.headersArray().find((h) => h.name.toLowerCase() === "set-cookie")?.value ?? "";
    expect(cookie).toMatch(/payload-token=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  test("cookies are ignored on requests from another origin", async () => {
    const forged = await adminApi.get("/cms-api/users/me", {
      headers: { origin: "https://attacker.example" },
    });
    expect((await forged.json()).user).toBeNull();
  });

  test("visitors cannot write anything", async () => {
    expect((await visitor.post("/cms-api/pages", { data: { title: "x", slug: "x" } })).status()).toBe(403);
    expect((await visitor.post("/cms-api/globals/homepage", { data: {} })).status()).toBe(403);
    expect((await visitor.post("/cms-api/users", { data: { email: "a@b.test", password: password() } })).status()).toBe(403);
    expect((await visitor.get("/cms-api/users")).status()).toBe(403);
  });

  test("administrators create editors; weak passwords are refused", async ({ baseURL }) => {
    const weak = await adminApi.post("/cms-api/users", {
      data: { email: "weak@deltawave.test", password: "short-pass", roles: ["editor"] },
    });
    expect(weak.status()).toBe(400);
    // Production responses name the field; the admin form shows the full message.
    expect(JSON.stringify(await weak.json())).toContain("password");
    const created = await adminApi.post("/cms-api/users", {
      data: { ...editor, name: "E2E Editor", roles: ["editor"] },
    });
    expect(created.status()).toBe(201);
    expect((await created.json()).doc.roles).toEqual(["editor"]);
    editorApi = await apiSession(baseURL!, editor);
  });

  test("editors cannot manage accounts or promote themselves", async () => {
    const list = await (await editorApi.get("/cms-api/users")).json();
    expect(list.totalDocs).toBe(1);
    const me = await (await editorApi.get("/cms-api/users/me")).json();
    const promote = await editorApi.patch(`/cms-api/users/${me.user.id}`, {
      data: { roles: ["admin"] },
    });
    expect((await promote.json()).doc?.roles ?? me.user.roles).toEqual(["editor"]);
    expect((await editorApi.post("/cms-api/users", { data: { email: "x@deltawave.test", password: password() } })).status()).toBe(403);
  });

  test("editors draft, administrators publish, visitors see published only", async () => {
    const page = { title: "E2E publishing check", slug: "e2e-publishing-check" };
    // A draft save that asks to publish is either refused or kept as a draft
    // (Payload 3.90 coerces draft saves). It must never become public.
    const publishAttempt = await editorApi.post("/cms-api/pages?draft=true", {
      data: { ...page, slug: "e2e-publish-attempt", _status: "published" },
    });
    expect([201, 403]).toContain(publishAttempt.status());
    if (publishAttempt.status() === 201) {
      const attempt = (await publishAttempt.json()).doc;
      expect(attempt._status).toBe("draft");
      expect((await adminApi.delete(`/cms-api/pages/${attempt.id}`)).status()).toBe(200);
    }
    // Without the draft flag a write would be live, so editors are refused.
    expect((await editorApi.post("/cms-api/pages", { data: { ...page, _status: "published" } })).status()).toBe(403);
    expect((await editorApi.post("/cms-api/pages", { data: page })).status()).toBe(403);

    const draft = await editorApi.post("/cms-api/pages?draft=true", { data: page });
    expect(draft.status()).toBe(201);
    const id = (await draft.json()).doc.id;
    const query = `/cms-api/pages?where[slug][equals]=${page.slug}`;
    expect((await (await visitor.get(query)).json()).totalDocs).toBe(0);
    expect((await (await visitor.get(`${query}&draft=true`)).json()).totalDocs).toBe(0);
    expect((await visitor.get(`/cms-api/pages/${id}`)).status()).toBe(404);
    // Editors may not change the live document or publish an existing one.
    expect((await editorApi.patch(`/cms-api/pages/${id}`, { data: { title: "Live edit" } })).status()).toBe(403);
    const promote = await editorApi.patch(`/cms-api/pages/${id}?draft=true`, {
      data: { _status: "published" },
    });
    expect([200, 403]).toContain(promote.status());
    expect((await (await visitor.get(query)).json()).totalDocs).toBe(0);

    const published = await adminApi.patch(`/cms-api/pages/${id}`, { data: { _status: "published" } });
    expect(published.status()).toBe(200);
    expect((await (await visitor.get(query)).json()).docs[0].title).toBe(page.title);

    const change = await editorApi.patch(`/cms-api/pages/${id}?draft=true`, {
      data: { title: "Unreviewed draft title" },
    });
    expect(change.status()).toBe(200);
    const live = await (await visitor.get(query)).json();
    expect(live.docs[0]?.title).toBe(page.title);
    // Asking for drafts as a visitor never reveals them.
    const asDraft = await (await visitor.get(`${query}&draft=true`)).json();
    expect(asDraft.docs.map((doc: { title: string }) => doc.title)).not.toContain("Unreviewed draft title");
    const adminView = await (await adminApi.get(`/cms-api/pages/${id}?draft=true`)).json();
    expect(adminView.title).toBe("Unreviewed draft title");

    expect((await editorApi.delete(`/cms-api/pages/${id}`)).status()).toBe(403);
    expect((await adminApi.delete(`/cms-api/pages/${id}`)).status()).toBe(200);
  });

  test("reserved addresses cannot be used for pages", async () => {
    for (const slug of ["admin", "cms-api", "api"]) {
      const response = await adminApi.post("/cms-api/pages", { data: { title: "Reserved", slug } });
      expect(response.status(), slug).toBe(400);
    }
  });

  test("homepage drafts stay private until an administrator publishes", async () => {
    // Later specs expect the seeded homepage, so it is restored either way.
    const seeded = await publishedHomepage(adminApi);
    try {
      await homepageDraftsStayPrivate();
    } finally {
      await publishHomepage(adminApi, seeded);
    }
  });

  async function homepageDraftsStayPrivate() {
    const shown = { enabled: false };
    const live = {
      hero: {
        heading: "Technology that\nmoves business",
        headingAccent: "forward.",
        description: "Published homepage description.",
      },
      introduction: shown,
      services: shown,
      industries: shown,
      engineering: shown,
      portfolio: shown,
      approach: shown,
      academy: shown,
      contact: shown,
      _status: "published",
    };
    const attempt = await editorApi.post("/cms-api/globals/homepage?draft=true", {
      data: { ...live, hero: { ...live.hero, description: "Editor publish attempt." } },
    });
    expect([200, 403]).toContain(attempt.status());
    const beforePublish = await (await visitor.get("/cms-api/globals/homepage")).json();
    expect(beforePublish.hero?.description).not.toBe("Editor publish attempt.");
    expect((await adminApi.post("/cms-api/globals/homepage", { data: live })).status()).toBe(200);
    const draft = await editorApi.post("/cms-api/globals/homepage?draft=true", {
      data: { hero: { ...live.hero, description: "Draft only description." } },
    });
    expect(draft.status()).toBe(200);
    const published = await (await visitor.get("/cms-api/globals/homepage")).json();
    expect(published.hero.description).toBe("Published homepage description.");
    const asDraft = await (await visitor.get("/cms-api/globals/homepage?draft=true")).json();
    expect(asDraft.hero?.description).not.toBe("Draft only description.");
    const adminView = await (await adminApi.get("/cms-api/globals/homepage?draft=true")).json();
    expect(adminView.hero.description).toBe("Draft only description.");
  }

  test("uploads accept alt-texted raster images only, within the size limit", async ({ baseURL }) => {
    const png = await readFile("public/brand/deltawave_corporate_blue_64px.png");
    const upload = (file: { name: string; mimeType: string; buffer: Buffer }, alt?: string) =>
      adminApi.post("/cms-api/media", {
        multipart: { file, _payload: JSON.stringify(alt ? { alt } : {}) },
      });
    const ok = await upload({ name: "e2e-icon.png", mimeType: "image/png", buffer: png }, "DeltaWave icon");
    expect(ok.status()).toBe(201);
    const doc = (await ok.json()).doc;
    expect(doc.mimeType).toBe("image/png");
    const served = await visitor.get(doc.url);
    expect(served.status()).toBe(200);
    expect(Buffer.from(await served.body()).equals(png)).toBe(true);

    expect((await upload({ name: "no-alt.png", mimeType: "image/png", buffer: png })).status()).toBe(400);
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    expect((await upload({ name: "e2e.svg", mimeType: "image/svg+xml", buffer: svg }, "SVG")).status()).toBe(400);
    const anonymous = await visitor.post("/cms-api/media", {
      multipart: { file: { name: "a.png", mimeType: "image/png", buffer: png }, _payload: '{"alt":"x"}' },
    });
    expect(anonymous.status()).toBe(403);
    expect((await editorApi.delete(`/cms-api/media/${doc.id}`)).status()).toBe(403);
    expect((await adminApi.delete(`/cms-api/media/${doc.id}`)).status()).toBe(200);

    // Oversize last, on its own connection: the server answers 413 before
    // reading the whole body and then closes that socket, which must not be
    // handed to any later request.
    const oversize = await apiSession(baseURL!, admin);
    const big = Buffer.alloc(11 * 1024 * 1024, 1);
    const rejected = await oversize.post("/cms-api/media", {
      headers: { connection: "close" },
      multipart: { file: { name: "big.png", mimeType: "image/png", buffer: big }, _payload: '{"alt":"Too big"}' },
    });
    expect(rejected.status()).toBe(413);
    await oversize.dispose();
  });

  test("repeated failed sign-ins lock the account", async ({ baseURL }) => {
    const target = { email: "e2e-lock@deltawave.test", password: password() };
    expect((await adminApi.post("/cms-api/users", { data: { ...target, roles: ["editor"] } })).status()).toBe(201);
    const attacker = await apiSession(baseURL!);
    for (let i = 0; i < 5; i++) {
      const attempt = await attacker.post("/cms-api/users/login", {
        data: { email: target.email, password: "wrong-password-123" },
      });
      expect(attempt.status()).not.toBe(200);
    }
    const correct = await attacker.post("/cms-api/users/login", { data: target });
    expect(correct.status()).not.toBe(200);
    expect(JSON.stringify(await correct.json())).toMatch(/locked/i);
  });

  test("signing out ends the session", async ({ baseURL }) => {
    const session = await apiSession(baseURL!, editor);
    expect((await session.post("/cms-api/users/logout")).status()).toBe(200);
    expect((await (await session.get("/cms-api/users/me")).json()).user).toBeNull();
  });
});
