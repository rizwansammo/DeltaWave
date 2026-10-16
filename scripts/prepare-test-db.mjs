// Rebuilds the local integration-test database from the committed migrations,
// exactly as a new production database would be created. The development
// database is never touched.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { testDatabaseUrl } from "./test-database.mjs";

if (!existsSync(".next/BUILD_ID")) {
  console.error("No production build found. Run `pnpm build` before `pnpm test:e2e`.");
  process.exit(1);
}

const url = testDatabaseUrl();
console.log(`Recreating ${new URL(url).pathname.slice(1)} from migrations...`);
const result = spawnSync("pnpm", ["payload", "migrate:fresh", "--force-accept-warning"], {
  env: { ...process.env, DATABASE_URL: url },
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exit(result.status ?? 1);
