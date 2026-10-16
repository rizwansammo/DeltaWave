// Runs after cms.spec.ts (alphabetical order), whose first test needs an
// empty accounts table.
import { randomUUID } from "node:crypto";
import { expect, request as playwrightRequest, test, type APIRequestContext } from "@playwright/test";
import { approvedPageContent, approvedSettings } from "../../lib/cms/pages-approved";
import { admin, apiSession, ensureAdmin, signIn } from "./cms-helpers";

// The About, Academy, Contact and privacy pages, the shared site settings and
// the draft preview, against the disposable *_test database. Every test puts
// back what it changed.
test.describe.configure({ mode: "serial" });

let adminApi: APIRequestContext;
let editorApi: APIRequestContext;
let visitor: APIRequestContext;
let baseOrigin: string;
const editor = {
  email: `e2e-pages-editor-${randomUUID().slice(0, 8)}@deltawave.test`,
  password: `E2e-${randomUUID()}`,
};

test.beforeAll(async ({ baseURL }) => {
  baseOrigin = baseURL!;
  adminApi = await ensureAdmin(baseURL!);
  visitor = await apiSession(baseURL!);
  const created = await adminApi.post("/cms-api/users", {
    data: { ...editor, name: "E2E Pages Editor", roles: ["editor"] },
  });
  expect(created.status()).toBe(201);
  editorApi = await apiSession(baseURL!, editor);
});

/** Server rendering separates text nodes with comments; drop them to read copy. */
const plain = (html: string) => html.replace(/<!--.*?-->/g, "");

async function page(path: string, status = 200, api: APIRequestContext = visitor) {
  const response = await api.get(path);
  expect(response.status(), path).toBe(status);
  return response.text();
}

const globalDoc = async (slug: string) =>
  (await (await adminApi.get(`/cms-api/globals/${slug}?depth=0`)).json());

/** Publishes a global as an administrator, keeping every other field. */
async function publishGlobal(slug: string, data: Record<string, unknown>) {
  const response = await adminApi.post(`/cms-api/globals/${slug}?depth=0`, {
    data: { ...data, _status: "published" },
  });
  expect(response.status(), await response.text()).toBe(200);
}

test("the About, Academy and Contact pages render the published content", async () => {
  const about = plain(await page("/about"));
  expect(about).toContain(approvedPageContent.about.hero.heading.split(String.fromCharCode(10))[0]);
  expect(about).toContain(approvedPageContent.about.intro.lead);
  expect(about).toContain("Business context first");
  expect(about).toContain(approvedPageContent.about.imageCaption);

  const academy = plain(await page("/academy"));
  expect(academy).toContain(approvedPageContent.academy.hero.statusLabel);
  expect(academy).toContain("Everyday digital confidence");
  // Nothing may claim the Academy is open.
  expect(academy).not.toMatch(/enroll now|fees from|book your seat/i);

  const contact = plain(await page("/contact"));
  expect(contact).toContain(approvedPageContent.contact.section.note);
  expect(contact).toContain(approvedPageContent.contact.next.body);
  // The service list comes from the published categories plus the extras.
  for (const option of [
    "Software engineering &amp; SaaS",
    "Academy interest",
    "Other",
  ])
    expect(contact).toContain(option);
});

test("the privacy notice renders from rich text, with safe links only", async () => {
  const html = plain(await page("/privacy"));
  expect(html).toContain("<h2>Information you provide</h2>");
  expect(html).toContain("<h2>Business contact</h2>");
  expect(html).toContain(`<a href="mailto:${approvedSettings.contact.email}">`);
  const start = html.indexOf('class="container prose"');
  const body = html.slice(start, html.indexOf("</article>", start));
  expect(body).not.toContain("<script");
  expect(body).not.toContain("javascript:");
});

test("stored rich text cannot inject markup or an unsafe link", async () => {
  const slug = `e2e-rich-text-${randomUUID().slice(0, 6)}`;
  const text = (value: string) => ({
    type: "text",
    detail: 0,
    format: 0,
    mode: "normal",
    style: "",
    text: value,
    version: 1,
  });
  const paragraph = (children: unknown[]) => ({
    type: "paragraph",
    children,
    direction: "ltr",
    format: "",
    indent: 0,
    version: 1,
    textFormat: 0,
  });
  const created = await adminApi.post("/cms-api/pages", {
    data: {
      title: "E2E rich text check",
      slug,
      hero: { heading: "E2E rich text check", description: "Checking stored markup." },
      body: {
        root: {
          type: "root",
          direction: "ltr",
          format: "",
          indent: 0,
          version: 1,
          children: [
            paragraph([text("<script>alert(1)</script> & <b>bold</b>")]),
            paragraph([
              {
                type: "link",
                children: [text("Unsafe link")],
                direction: "ltr",
                format: "",
                indent: 0,
                version: 3,
                fields: { linkType: "custom", newTab: false, url: "javascript:alert(1)" },
              },
            ]),
          ],
        },
      },
      _status: "published",
    },
  });
  expect(created.status()).toBe(201);
  const id = (await created.json()).doc.id;
  try {
    const html = plain(await page("/" + slug));
    const start = html.indexOf('class="container prose"');
    const body = html.slice(start, html.indexOf("</article>", start));
    // The angle brackets are shown as text, never as markup.
    expect(body).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(body).not.toContain("<script>alert(1)");
    expect(body).not.toContain("javascript:");
    // The label survives; only the address is dropped.
    expect(body).toContain("Unsafe link");
  } finally {
    expect((await adminApi.delete(`/cms-api/pages/${id}`)).status()).toBe(200);
  }
});

test("site settings drive the header, footer, contact details and structured data", async () => {
  const original = await globalDoc("site-settings");
  const name = `DeltaWave Technology ${randomUUID().slice(0, 6)}`;
  const cta = `Say hello ${randomUUID().slice(0, 4)}`;
  const phone = "+8801700000000";
  try {
    // A draft change stays private.
    const draft = await editorApi.post("/cms-api/globals/site-settings?draft=true", {
      data: { identity: { ...original.identity, siteName: "Draft only name" } },
    });
    expect(draft.status()).toBe(200);
    expect(plain(await page("/about"))).not.toContain("Draft only name");

    await publishGlobal("site-settings", {
      ...original,
      identity: { ...original.identity, siteName: name },
      contact: { ...original.contact, phone, phoneDisplay: "+880 1700 000000" },
      header: { ctaLabel: cta, ctaHref: "/contact" },
      footer: { ...original.footer, locationLabel: "Based in Bhola" },
    });
    const about = plain(await page("/about"));
    expect(about).toContain(`class="header-cta" href="/contact">${cta}`);
    expect(about).toContain(`© ${new Date().getFullYear()} ${name}`);
    expect(about).toContain("Based in Bhola");
    expect(about).toContain(`href="tel:${phone}"`);
    expect(about).toContain(`"telephone":"${phone}"`); // organization data
    expect(await page("/contact")).toContain("+880 1700 000000");
  } finally {
    await publishGlobal("site-settings", original);
  }
  expect(plain(await page("/about"))).toContain(approvedSettings.footer.locationLabel);
});

test("page content drafts stay private until an administrator publishes", async () => {
  const original = await globalDoc("page-content");
  const heading = `A considered approach ${randomUUID().slice(0, 6)}`;
  try {
    const draft = await editorApi.post("/cms-api/globals/page-content?draft=true", {
      data: { about: { ...original.about, hero: { ...original.about.hero, heading } } },
    });
    expect(draft.status()).toBe(200);
    expect(await page("/about")).not.toContain(heading);
    // Editors may not publish or write the live document.
    expect(
      (await editorApi.post("/cms-api/globals/page-content", { data: { about: original.about } })).status(),
    ).toBe(403);

    await publishGlobal("page-content", {
      ...original,
      about: { ...original.about, hero: { ...original.about.hero, heading } },
    });
    expect(plain(await page("/about"))).toContain(heading);
  } finally {
    await publishGlobal("page-content", original);
  }
  expect(plain(await page("/about"))).toContain(approvedPageContent.about.hero.heading.split(String.fromCharCode(10))[0]);
});

test("a standalone page can be unpublished and is then a real 404", async () => {
  const privacy = (await (await adminApi.get("/cms-api/pages?where[slug][equals]=privacy&depth=0")).json())
    .docs[0];
  try {
    expect((await adminApi.patch(`/cms-api/pages/${privacy.id}`, { data: { _status: "draft" } })).status()).toBe(200);
    await page("/privacy", 404);
    expect(await page("/sitemap.xml")).not.toContain("/privacy");
  } finally {
    expect((await adminApi.patch(`/cms-api/pages/${privacy.id}`, { data: { _status: "published" } })).status()).toBe(200);
  }
  await page("/privacy");
  expect(await page("/sitemap.xml")).toContain("/privacy");
});

test("draft preview is refused without a CMS session and cannot redirect elsewhere", async () => {
  expect((await visitor.get("/api/preview?path=/about", { maxRedirects: 0 })).status()).toBe(401);
  for (const path of [
    "https://attacker.example/",
    "//attacker.example/",
    "/admin",
    "/api/enquiry",
    "",
  ]) {
    const response = await adminApi.get(`/api/preview?path=${encodeURIComponent(path)}`, {
      maxRedirects: 0,
    });
    expect(response.status(), path).toBe(400);
  }
});

test("staff preview drafts in the real design; a leaked preview cookie shows nothing", async () => {
  const original = await globalDoc("page-content");
  const draftHeading = `Draft heading ${randomUUID().slice(0, 6)}`;
  const staff = await apiSession(baseOrigin, admin);
  try {
    const saved = await editorApi.post("/cms-api/globals/page-content?draft=true", {
      data: { about: { ...original.about, hero: { ...original.about.hero, heading: draftHeading } } },
    });
    expect(saved.status()).toBe(200);

    // Anonymous visitors never see it, even asking for drafts.
    expect(plain(await page("/about"))).not.toContain(draftHeading);

    // An administrator turns on preview and sees the draft in the real design.
    const enable = await staff.get("/api/preview?path=/about", { maxRedirects: 0 });
    expect(enable.status()).toBe(307);
    expect(enable.headers()["location"]).toBe("/about");
    expect(enable.headers()["x-robots-tag"]).toContain("noindex");
    const preview = await staff.get("/about");
    expect(preview.status()).toBe(200);
    const previewHtml = plain(await preview.text());
    expect(previewHtml).toContain(draftHeading);
    expect(previewHtml).toContain("Draft preview");
    expect(preview.headers()["x-robots-tag"]).toContain("noindex");
    expect(preview.headers()["cache-control"]).toContain("no-store");

    // The preview cookie on its own, without a CMS session, reveals nothing.
    const cookies = (await staff.storageState()).cookies.filter(
      (cookie) => cookie.name === "__prerender_bypass",
    );
    expect(cookies).toHaveLength(1);
    const stranger = await playwrightRequest.newContext({
      baseURL: baseOrigin,
      storageState: { cookies, origins: [] },
    });
    const strangerHtml = plain(await (await stranger.get("/about")).text());
    expect(strangerHtml).not.toContain(draftHeading);
    expect(strangerHtml).not.toContain("Draft preview");
    await stranger.dispose();

    // Leaving preview returns to the published page.
    const exit = await staff.get("/api/preview/exit?path=/about", { maxRedirects: 0 });
    expect(exit.status()).toBe(307);
    expect(plain(await (await staff.get("/about")).text())).not.toContain(draftHeading);
  } finally {
    await publishGlobal("page-content", original);
    await staff.dispose();
  }
});

test("an editor can preview drafts but still cannot publish", async () => {
  const staffEditor = await apiSession(baseOrigin, editor);
  const original = await globalDoc("page-content");
  const draftHeading = `Editor draft ${randomUUID().slice(0, 6)}`;
  try {
    expect(
      (
        await staffEditor.post("/cms-api/globals/page-content?draft=true", {
          data: { about: { ...original.about, hero: { ...original.about.hero, heading: draftHeading } } },
        })
      ).status(),
    ).toBe(200);
    expect((await staffEditor.get("/api/preview?path=/about", { maxRedirects: 0 })).status()).toBe(307);
    expect(plain(await (await staffEditor.get("/about")).text())).toContain(draftHeading);
    expect(plain(await page("/about"))).not.toContain(draftHeading);
  } finally {
    await publishGlobal("page-content", original);
    await staffEditor.dispose();
  }
});

test("the admin offers a preview button and live preview widths", async ({ page: browser }) => {
  await signIn(browser, admin);
  await browser.goto("/admin/globals/page-content");
  await browser.waitForLoadState("networkidle");
  const previewLink = browser.locator('a[href*="/api/preview"]').first();
  await expect(previewLink).toHaveAttribute("href", /path=%2Fabout/);
  // Payload's own live preview toggle, configured with desktop and mobile.
  await expect(browser.locator(".live-preview-toggler, #live-preview-toggler")).toHaveCount(1);
});
