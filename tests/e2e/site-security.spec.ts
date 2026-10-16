// Runs after cms.spec.ts (alphabetical order), whose first test needs an
// empty accounts table.
import { randomUUID } from "node:crypto";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { admin, apiSession, ensureAdmin, signIn } from "./cms-helpers";

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

  // An invalid sender cannot be published (drafts skip validation).
  const refused = await adminApi.post("/cms-api/globals/site-settings", {
    data: { _status: "published", enquiries: { senderEmail: "not an address" } },
  });
  expect(refused.status()).toBe(400);
  // Switching enquiries on without SMTP, Turnstile and a final privacy
  // notice cannot be published.
  const noReceiver = await adminApi.post("/cms-api/globals/site-settings", {
    data: { _status: "published", enquiries: { acceptOnline: true, notify: true } },
  });
  expect(noReceiver.status()).toBe(400);
  // The test email endpoint is for administrators only.
  expect((await editorApi.post("/cms-api/globals/site-settings/test-email")).status()).toBe(403);
  expect((await visitor.post("/cms-api/globals/site-settings/test-email")).status()).toBe(403);
});

const SMTP_PASSWORD = `E2e-Smtp-${randomUUID()}`;
const smtp = "/cms-api/globals/site-settings/smtp";

test("the SMTP store is closed to the CMS API for everyone, administrators included", async () => {
  for (const api of [visitor, editorApi, adminApi]) {
    expect((await api.get("/cms-api/globals/smtp-settings")).status()).toBe(403);
    expect((await api.post("/cms-api/globals/smtp-settings", { data: { host: "evil.example.com" } })).status()).toBe(403);
    expect((await api.get("/cms-api/globals/smtp-settings/versions")).status()).not.toBe(200);
  }
  expect((await adminApi.post("/cms-api/graphql", { data: { query: "{ SmtpSetting { host } }" } })).status()).not.toBe(200);
});

test("only administrators can read, change or test the SMTP settings", async () => {
  for (const api of [visitor, editorApi]) {
    expect((await api.get(smtp)).status()).toBe(403);
    expect((await api.post(smtp, { data: { host: "evil.example.com", port: 587, security: "starttls", username: "x", password: "y" } })).status()).toBe(403);
    expect((await api.post(smtp, { data: { action: "remove" } })).status()).toBe(403);
    expect((await api.post(`${smtp}/test`, { data: {} })).status()).toBe(403);
  }
  // A signed-in session from another site is not accepted (CSRF).
  const foreign = await adminApi.get(smtp, { headers: { origin: "https://attacker.example" } });
  expect([401, 403]).toContain(foreign.status());
  const status = await (await adminApi.get(smtp)).json();
  expect(status.state).toBe("not-configured");
});

test("the SMTP password is write-only and kept when the field is left empty", async () => {
  const connection = { host: "smtp.deltawave.invalid", port: 587, security: "starttls", username: "website@deltawave.test" };
  const saved = await adminApi.post(smtp, { data: { ...connection, password: SMTP_PASSWORD } });
  expect(saved.status()).toBe(200);
  const savedText = await saved.text();
  expect(savedText).not.toContain(SMTP_PASSWORD);
  const first = await (await adminApi.get(smtp)).json();
  expect(first).toMatchObject({ state: "ready", passwordSet: true, host: "smtp.deltawave.invalid", username: connection.username });
  expect(JSON.stringify(first)).not.toContain(SMTP_PASSWORD);
  expect(Object.keys(first)).not.toContain("password");
  expect(Object.keys(first)).not.toContain("passwordEncrypted");

  // Empty password: the stored one stays.
  const kept = await adminApi.post(smtp, { data: { ...connection, port: 465, security: "tls", password: "" } });
  expect(kept.status()).toBe(200);
  const second = await (await adminApi.get(smtp)).json();
  expect(second).toMatchObject({ passwordSet: true, port: 465, security: "tls", passwordUpdatedAt: first.passwordUpdatedAt });

  // Nothing else returns it either.
  for (const path of [
    "/cms-api/globals/site-settings?draft=true",
    "/cms-api/globals/site-settings",
    "/cms-api/globals/site-settings/versions?limit=50",
    "/cms-api/users/me",
  ]) {
    const text = await (await adminApi.get(path)).text();
    expect(text, path).not.toContain(SMTP_PASSWORD);
    expect(text, path).not.toContain("passwordEncrypted");
  }
});

test("internal hosts and non-SMTP ports are refused without connecting", async () => {
  // Save rejects every private host. Exercise a few test-connection calls
  // separately: that endpoint deliberately limits connection attempts per admin.
  const blockedHosts = ["127.0.0.1", "localhost", "db", "10.0.0.5", "169.254.169.254", "172.17.0.1", "[::1]", "mail.internal"];
  for (const [index, host] of blockedHosts.entries()) {
    const saved = await adminApi.post(smtp, { data: { host, port: 587, security: "starttls", username: "u@deltawave.test", password: "x" } });
    expect(saved.status(), host).toBe(400);
    if (index < 3) {
      const tested = await adminApi.post(`${smtp}/test`, { data: { host, port: 587, security: "starttls", username: "u@deltawave.test", password: "x" } });
      expect(tested.status(), host).toBe(400);
      expect((await tested.json()).errors?.host, host).toBeTruthy();
    }
  }
  const port = await adminApi.post(smtp, { data: { host: "smtp.deltawave.invalid", port: 5432, security: "starttls", username: "u@deltawave.test", password: "x" } });
  expect(port.status()).toBe(400);
  // The stored settings were not changed by any of these.
  expect((await (await adminApi.get(smtp)).json()).host).toBe("smtp.deltawave.invalid");
});

test("a password reset answers the same for known and unknown addresses whatever the mail server does", async () => {
  // smtp.deltawave.invalid never resolves (RFC 6761), so sending fails.
  for (const email of [admin.email, `nobody-${randomUUID().slice(0, 8)}@deltawave.test`]) {
    const reset = await visitor.post("/cms-api/users/forgot-password", { data: { email } });
    expect(reset.status(), email).toBe(200);
  }
});

test("the SMTP panel shows a masked password field to administrators", async ({ page }) => {
  await signIn(page, admin);
  await page.goto("/admin/globals/site-settings");
  await page.getByRole("tab", { name: "Email & enquiries" }).or(page.getByText("Email & enquiries", { exact: true })).first().click();
  const panel = page.getByTestId("smtp-settings");
  await expect(panel).toBeVisible();
  const password = panel.locator("#smtp-password");
  await expect(password).toHaveAttribute("type", "password");
  await expect(password).toHaveAttribute("autocomplete", "new-password");
  await expect(password).toHaveValue("");
  await expect(panel.locator("#smtp-host")).toHaveValue("smtp.deltawave.invalid");
  expect(await page.content()).not.toContain(SMTP_PASSWORD);
  // Removing clears everything.
  page.once("dialog", (dialog) => dialog.accept());
  await panel.getByRole("button", { name: "Remove SMTP settings" }).click();
  await expect(panel.getByText(/SMTP settings removed/)).toBeVisible();
  expect((await (await adminApi.get(smtp)).json()).state).toBe("not-configured");
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
