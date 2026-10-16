// Runs after cms.spec.ts (alphabetical order), whose first test needs an
// empty accounts table.
import { randomUUID } from "node:crypto";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { apiSession, ensureAdmin } from "./cms-helpers";

// Phase 3: stored enquiries, the routing settings and the security headers,
// against the production build and the disposable *_test database.
test.describe.configure({ mode: "serial" });

let adminApi: APIRequestContext;
let editorApi: APIRequestContext;
let visitor: APIRequestContext;

test.beforeAll(async ({ baseURL }) => {
  adminApi = await ensureAdmin(baseURL!);
  visitor = await apiSession(baseURL!);
  const editor = { email: `e2e-sec-editor-${randomUUID().slice(0, 8)}@deltawave.test`, password: `E2e-${randomUUID()}` };
  expect((await adminApi.post("/cms-api/users", { data: { ...editor, roles: ["editor"] } })).status()).toBe(201);
  editorApi = await apiSession(baseURL!, editor);
});

test("enquiries can only be read and managed by administrators", async () => {
  for (const api of [visitor, editorApi]) {
    expect((await api.get("/cms-api/enquiries")).status()).toBe(403);
    expect((await api.get("/cms-api/enquiries/1")).status()).toBe(403);
    expect((await api.patch("/cms-api/enquiries/1", { data: { status: "Closed" } })).status()).toBe(403);
    expect((await api.delete("/cms-api/enquiries/1")).status()).toBe(403);
  }
  expect((await adminApi.get("/cms-api/enquiries")).status()).toBe(200);
  // Nobody creates enquiries through the CMS API, administrators included.
  for (const api of [visitor, editorApi, adminApi]) {
    const created = await api.post("/cms-api/enquiries", {
      data: { name: "x", email: "x@example.com", phone: "+880100000000", service: "Other", description: "x".repeat(30), submittedAt: new Date().toISOString() },
    });
    expect(created.status()).toBe(403);
  }
});

test("enquiry routing is invisible to visitors and editors and editable by administrators only", async () => {
  const asVisitor = await (await visitor.get("/cms-api/globals/site-settings")).json();
  expect(asVisitor.enquiries?.recipient).toBeUndefined();
  expect(JSON.stringify(asVisitor)).not.toContain("acceptOnline");
  const asEditor = await (await editorApi.get("/cms-api/globals/site-settings?draft=true")).json();
  expect(asEditor.enquiries?.recipient).toBeUndefined();

  // An editor's attempt to redirect enquiries is ignored.
  await editorApi.post("/cms-api/globals/site-settings?draft=true", {
    data: { enquiries: { recipient: "attacker@example.com", acceptOnline: true } },
  });
  const asAdmin = await (await adminApi.get("/cms-api/globals/site-settings?draft=true")).json();
  expect(asAdmin.enquiries?.recipient ?? "").not.toBe("attacker@example.com");
  expect(asAdmin.enquiries?.acceptOnline ?? false).toBe(false);

  // An unapproved sender domain cannot be published (drafts skip validation).
  const refused = await adminApi.post("/cms-api/globals/site-settings", {
    data: { _status: "published", enquiries: { senderEmail: "website@attacker.example" } },
  });
  expect(refused.status()).toBe(400);
  // Switching enquiries on without a receiver cannot be published either.
  const noReceiver = await adminApi.post("/cms-api/globals/site-settings", {
    data: { _status: "published", enquiries: { acceptOnline: true, notify: true } },
  });
  expect(noReceiver.status()).toBe(400);
  // The test email endpoint is for administrators only.
  expect((await editorApi.post("/cms-api/globals/site-settings/test-email")).status()).toBe(403);
  expect((await visitor.post("/cms-api/globals/site-settings/test-email")).status()).toBe(403);
});

test("the form stays closed while enquiries are not accepted", async () => {
  expect(await (await visitor.get("/api/enquiry")).json()).toEqual({ enabled: false });
});

test("pages and the admin carry the security headers", async ({ page }) => {
  for (const path of ["/", "/contact", "/admin/login"]) {
    const response = await visitor.get(path);
    const csp = response.headers()["content-security-policy"] ?? "";
    expect(csp, path).toContain("default-src 'self'");
    expect(csp, path).toContain("object-src 'none'");
    expect(csp, path).toContain("frame-ancestors 'self'");
    expect(csp, path).not.toContain("unsafe-eval");
    expect(response.headers()["x-content-type-options"], path).toBe("nosniff");
  }
  // The admin still works under the policy.
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /Content Security Policy/i.test(message.text())) errors.push(message.text());
  });
  await page.goto("/admin/login");
  await expect(page.locator("#field-email")).toBeVisible();
  await page.goto("/contact");
  await expect(page.locator(".enquiry-form")).toBeVisible();
  expect(errors).toEqual([]);
});
