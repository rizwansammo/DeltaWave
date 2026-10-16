import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { measureBrand, settle, widths } from "./helpers";

// Visual parity with the approved prototype. Start the prototype (DeltaWave-UI
// on Vinext) and run with PROTOTYPE_URL, for example http://127.0.0.1:5173.
// The prototype's screenshot is the expected image; any differing pixel fails.
const prototype = process.env.PROTOTYPE_URL;

const pages = [
  "/",
  "/about",
  "/services",
  "/services/cloud-managed-it",
  "/solutions",
  "/solutions/healthcare-diagnostics",
  "/portfolio",
  "/portfolio/coaching-management",
  "/academy",
  "/contact",
  "/privacy",
  "/does-not-exist",
];

async function capture(page: Page, url: string, fullPage = true) {
  await page.goto(url);
  // The prototype briefly shows a streamed loading state; wait for the page.
  await page.locator("main h1").waitFor({ state: "visible" });
  await settle(page);
  // Chromium keeps a native <select>'s text position from before the swapped
  // web font loaded until it is laid out again. Which site wins that race is
  // timing, not design, so re-lay out selects on both sides.
  await page.evaluate(() => {
    for (const select of document.querySelectorAll("select")) {
      select.style.display = "none";
      void select.offsetHeight;
      select.style.display = "";
    }
  });
  return {
    image: await page.screenshot({ fullPage, animations: "disabled" }),
    brand: await measureBrand(page, ".site-header .brand"),
  };
}

async function compare(name: string, expected: Buffer, actual: Buffer) {
  const snapshot = test.info().snapshotPath(name);
  await mkdir(path.dirname(snapshot), { recursive: true });
  await writeFile(snapshot, expected);
  expect.soft(actual, name).toMatchSnapshot(name, { maxDiffPixels: 0 });
}

test.describe("parity with the approved prototype", () => {
  test.skip(!prototype, "Set PROTOTYPE_URL to the running prototype to compare.");

  for (const width of widths) {
    test(`pages at ${width}px`, async ({ page, baseURL }) => {
      test.setTimeout(300_000);
      await page.setViewportSize({ width, height: 900 });
      for (const route of pages) {
        const expected = await capture(page, prototype + route);
        const actual = await capture(page, baseURL + route);
        expect.soft(actual.brand, `${route} lockup geometry`).toEqual(expected.brand);
        await compare(`${width}${route === "/" ? "-home" : route.replaceAll("/", "-")}.png`, expected.image, actual.image);
      }
    });
  }

  test("open menus match", async ({ page, baseURL }) => {
    const states: [string, number, (page: Page) => Promise<void>][] = [
      ["services-mega-menu", 1440, (p) => p.locator('button[aria-controls="mega-Services"]').click()],
      ["solutions-mega-menu", 1440, (p) => p.locator('button[aria-controls="mega-Solutions"]').click()],
      [
        "mobile-menu",
        390,
        async (p) => {
          await p.locator(".mobile-toggle").click();
          await p.locator('button[aria-controls="mobile-Services"]').click();
        },
      ],
    ];
    for (const [name, width, open] of states) {
      await page.setViewportSize({ width, height: 900 });
      const shots: Buffer[] = [];
      for (const origin of [prototype!, baseURL!]) {
        await page.goto(origin + "/");
        await settle(page);
        await open(page);
        shots.push(await page.screenshot({ animations: "disabled" }));
      }
      await compare(`${name}.png`, shots[0], shots[1]);
    }
  });
});
