import { expect, request as playwrightRequest, type APIRequestContext, type Page } from "@playwright/test";
import { approvedHomepage } from "../../lib/cms/homepage-approved";

export type Account = { email: string; password: string };

/**
 * The run's administrator. cms.spec.ts creates it through the first-user
 * screen; ensureAdmin() creates it when a spec file runs on its own.
 */
export const admin: Account = {
  email: "e2e-admin@deltawave.test",
  get password() {
    const password = process.env.E2E_ADMIN_PASSWORD;
    if (!password) throw new Error("E2E_ADMIN_PASSWORD is set by tests/e2e/global-setup.ts.");
    return password;
  },
};

export async function signIn(page: Page, user: Account) {
  await page.goto("/admin/login");
  await page.fill("#field-email", user.email);
  await page.fill("#field-password", user.password);
  await page.click("button[type=submit]");
  await page.waitForURL(/\/admin$/);
}

/** A REST client sending the site's own Origin, signed in when a user is given. */
export async function apiSession(baseURL: string, user?: Account) {
  const context = await playwrightRequest.newContext({
    baseURL,
    extraHTTPHeaders: { origin: baseURL },
  });
  if (user) {
    const login = await context.post("/cms-api/users/login", {
      data: { email: user.email, password: user.password },
    });
    expect(login.status(), `login ${user.email}`).toBe(200);
  }
  return context;
}

/** Signs the administrator in, creating the first account if none exists yet. */
export async function ensureAdmin(baseURL: string) {
  const anonymous = await apiSession(baseURL);
  const init: { initialized: boolean } = await (await anonymous.get("/cms-api/users/init")).json();
  if (!init.initialized) {
    const created = await anonymous.post("/cms-api/users/first-register", {
      data: { email: admin.email, password: admin.password, name: "E2E Administrator" },
    });
    expect(created.status(), "first administrator").toBe(200);
  }
  await anonymous.dispose();
  return apiSession(baseURL, admin);
}

const sections = Object.keys(approvedHomepage) as (keyof typeof approvedHomepage)[];

export type HomepageData = Record<string, unknown>;

/** The live Homepage global with relations as IDs, ready to be published again. */
export async function publishedHomepage(api: APIRequestContext): Promise<HomepageData> {
  const response = await api.get("/cms-api/globals/homepage?depth=0");
  expect(response.status()).toBe(200);
  const doc = await response.json();
  expect(doc._status).toBe("published");
  return Object.fromEntries(sections.map((name) => [name, doc[name]]));
}

/** Publishes homepage content as an administrator. */
export async function publishHomepage(api: APIRequestContext, data: HomepageData) {
  const response = await api.post("/cms-api/globals/homepage?depth=0", {
    data: { ...data, _status: "published" },
  });
  expect(response.status(), await response.text()).toBe(200);
  return (await response.json()).result;
}
