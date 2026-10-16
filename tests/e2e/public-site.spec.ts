import { expect, test } from "@playwright/test";
import { allPaths } from "../../lib/content";
import { horizontalOverflow, measureBrand, roundedElements, settle, widths } from "./helpers";

test.describe("public routes", () => {
  test("all 43 content pages render with the DeltaWave lockup", async ({ request }) => {
    expect(allPaths).toHaveLength(43);
    for (const path of allPaths) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
      const html = await response.text();
      expect(html, path).toContain('class="brand-wordmark"');
      expect(html.match(/<h1[\s>]/g), path).toHaveLength(1);
    }
  });

  test("unknown addresses get a real 404 with the branded page", async ({ request }) => {
    for (const path of ["/does-not-exist", "/services/not-a-service", "/a/b/c", "/api/users"]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(404);
      expect(await response.text(), path).toContain("A different direction");
    }
  });

  test("robots.txt keeps the private review unindexed", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /");
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap.match(/<url>/g)).toHaveLength(43);
  });

  test("the enquiry endpoint keeps its contract and fails closed", async ({ request, baseURL }) => {
    const status = await request.get("/api/enquiry");
    expect(status.status()).toBe(200);
    expect(status.headers()["cache-control"]).toContain("no-store");
    expect(await status.json()).toEqual({ enabled: false });

    const enquiry = {
      name: "Integration Test",
      email: "test@example.com",
      phone: "+8801821777620",
      company: "",
      service: "Other",
      description: "An integration test enquiry that must never be delivered.",
      consent: true,
      website: "",
      challenge: "",
      startedAt: Date.now() - 5000,
    };
    const foreign = await request.post("/api/enquiry", {
      headers: { origin: "https://attacker.example" },
      data: enquiry,
    });
    expect(foreign.status()).toBe(403);
    const unconfigured = await request.post("/api/enquiry", {
      headers: { origin: baseURL! },
      data: enquiry,
    });
    expect(unconfigured.status()).toBe(503);
  });
});

test.describe("layout and brand", () => {
  for (const width of widths) {
    test(`homepage at ${width}px: lockup proportions, square corners, no overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await settle(page);
      const brand = await measureBrand(page, ".site-header .brand");
      expect(brand?.elnathLoaded).toBe(true);
      expect(brand?.text.map((t) => t.content)).toEqual(["DELTAWAVE", "TECHNOLOGY"]);
      expect(brand?.text[0].font).toBe("ELNATH, sans-serif");
      // Uniform scaling: icon and wordmark keep their exact ratios at every width.
      const scale = brand!.wordmark!.width / 162;
      expect(brand!.wordmark!.height / 39.5).toBeCloseTo(scale, 3);
      expect(brand!.icon!.width / 49.25).toBeCloseTo(scale, 3);
      expect(brand!.icon!.height / 39.5).toBeCloseTo(scale, 3);
      expect(brand!.wordmark!.x - (brand!.icon!.x + brand!.icon!.width)).toBeCloseTo(12 * scale, 2);
      if (width > 1250) expect(scale).toBeCloseTo(1, 5);
      expect(await roundedElements(page)).toEqual([]);
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
      await page.screenshot({
        path: `.qa/screenshots/home-${width}.png`,
        fullPage: true,
        animations: "disabled",
      });
    });
  }

  test("footer reuses the same lockup", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    const header = await measureBrand(page, ".site-header .brand");
    const footer = await measureBrand(page, ".footer .brand");
    expect(footer?.text).toEqual(header?.text);
  });
});

test.describe("navigation behaviour", () => {
  test("desktop mega menus open, close with Escape and return focus", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    // Interact only after the server-rendered navigation has hydrated on CI.
    await settle(page);
    for (const menu of ["Services", "Solutions"]) {
      const toggle = page.locator(`button[aria-controls="mega-${menu}"]`);
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(page.locator(`#mega-${menu}`)).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.locator(`#mega-${menu}`)).toBeHidden();
      await expect(toggle).toBeFocused();
    }
  });

  test("mobile menu and submenus work at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const toggle = page.locator(".mobile-toggle");
    await toggle.click();
    await expect(page.locator("#mobile-nav")).toBeVisible();
    await page.locator('button[aria-controls="mobile-Services"]').click();
    await expect(page.locator("#mobile-Services")).toBeVisible();
    await expect(page.locator("#mobile-Services a").first()).toHaveText("Software engineering & SaaS");
    await page.keyboard.press("Escape");
    await expect(page.locator("#mobile-nav")).toBeHidden();
    await expect(toggle).toBeFocused();
  });

  test("industry directory filters and searches", async ({ page }) => {
    await page.goto("/solutions");
    await expect(page.locator(".result-count")).toHaveText("15 solutions to explore");
    await page.getByRole("button", { name: "People & organizations" }).click();
    await expect(page.locator(".result-count")).toHaveText("4 solutions to explore");
    await page.getByRole("button", { name: "All industries" }).click();
    await page.getByPlaceholder("Find your industry").fill("health");
    await expect(page.locator(".solution-row")).toHaveCount(1);
  });

  test("portfolio keeps its honest empty states", async ({ page }) => {
    await page.goto("/portfolio");
    await page.getByRole("button", { name: "Real projects" }).click();
    await expect(page.getByText("Good work deserves a complete story.")).toBeVisible();
  });

  test("contact form preselects a requested service and stays unavailable", async ({ page }) => {
    await page.goto("/contact?service=Academy%20interest");
    await expect(page.locator("#enquiry-service")).toHaveValue("Academy interest");
    await expect(page.locator(".form-availability")).toContainText("Online enquiries are being prepared");
    await expect(page.locator(".enquiry-form button[type=submit]")).toBeDisabled();
  });
});
