import { defineConfig, devices } from "@playwright/test";
import { testDatabaseUrl } from "./scripts/test-database.mjs";

// Browser and HTTP tests run against the production build (`pnpm build`)
// served by `next start`, connected to the disposable *_test database that
// `pnpm test:e2e` recreates from migrations first.
const baseURL = "http://localhost:3000";

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results",
  snapshotPathTemplate: ".qa/snapshots/{testFileName}/{arg}{ext}",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm exec next start -p 3000",
    url: `${baseURL}/api/enquiry`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { DATABASE_URL: testDatabaseUrl(), NODE_ENV: "production" },
  },
});
