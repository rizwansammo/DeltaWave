import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";

// Payload's config refuses to load without a secret. Tests never connect to
// the database, so a throwaway value is enough here.
process.env.PAYLOAD_SECRET ||= "test-only-secret-".padEnd(48, "x");

const { default: configPromise } = await import("../payload.config.ts");
const config = await configPromise;
const { allPaths } = await import("../lib/content.ts");
const { reservedPageSlugs } = await import("../cms/collections/Pages.ts");

test("CMS is mounted at /admin with its API at /cms-api", () => {
  assert.equal(config.routes.admin, "/admin");
  assert.equal(config.routes.api, "/cms-api");
  assert.equal(config.graphQL.disable, true);
  assert.ok(existsSync("app/(payload)/admin/[[...segments]]/page.tsx"));
  assert.ok(existsSync("app/(payload)/cms-api/[...slug]/route.ts"));
  // No Payload handlers left at the default /api prefix.
  assert.ok(!existsSync("app/(payload)/api"));
});

test("/api only contains the site's own endpoints", async () => {
  // The enquiry form and the staff draft preview. Payload stays on /cms-api.
  assert.deepEqual(await readdir("app/api"), ["enquiry", "preview"]);
  assert.deepEqual(await readdir("app/api/enquiry"), ["route.ts"]);
  assert.deepEqual(await readdir("app/api/preview"), ["exit", "route.ts"]);
});

test("public content never uses CMS or API prefixes", () => {
  for (const p of allPaths)
    assert.ok(!/^\/(admin|cms-api|api)(\/|$)/.test(p), p);
  for (const prefix of ["admin", "cms-api", "api"])
    assert.ok(reservedPageSlugs.includes(prefix), prefix);
});

test("private routes send noindex headers", async () => {
  const { default: nextConfig } = await import("../next.config.ts");
  const headers = await nextConfig.headers();
  for (const source of ["/admin", "/admin/:path*", "/cms-api/:path*"]) {
    const rule = headers.find((h) => h.source === source);
    assert.ok(rule, source);
    assert.deepEqual(rule.headers, [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]);
  }
});

test("robots.txt blocks everything until indexing is approved, then the CMS", async () => {
  const { default: robots } = await import("../app/robots.ts");
  if (process.env.NEXT_PUBLIC_INDEXABLE !== "true")
    assert.deepEqual(robots().rules, { userAgent: "*", disallow: "/" });
  const source = await readFile("app/robots.ts", "utf8");
  assert.match(source, /disallow: \["\/admin", "\/cms-api"\]/);
});

test("admin branding comes from the shared components", () => {
  const { graphics, beforeNavLinks, afterNavLinks, views } = config.admin.components;
  assert.equal(graphics.Logo, "/components/cms/admin-logo#AdminLogo");
  assert.equal(graphics.Icon, "/components/cms/admin-icon#AdminIcon");
  // The navy sidebar refinement (docs/CMS_NAV_REFINEMENT.md).
  assert.deepEqual(beforeNavLinks, [
    "/components/cms/nav-brand#NavBrand",
    "/components/cms/sidebar-overview#SidebarOverview",
  ]);
  assert.deepEqual(afterNavLinks, ["/components/cms/sidebar-utilities#SidebarUtilities"]);
  assert.equal(
    views.createFirstUser.Component,
    "/components/cms/create-first-user#BrandedCreateFirstUser",
  );
  assert.equal(config.admin.theme, "light");
  assert.equal(config.admin.meta.robots, "noindex, nofollow");
});
