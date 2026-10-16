// Rebuilds the local integration-test database from the committed migrations,
// exactly as a new production database would be created, then loads the
// approved homepage with the seed. The development database and media/ are
// never touched: test uploads live in their own disposable directory.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import { testEnvironment, testMediaDir } from "./test-database.mjs";

if (!existsSync(".next/BUILD_ID")) {
  console.error("No production build found. Run `pnpm build` before `pnpm test:e2e`.");
  process.exit(1);
}

const env = { ...process.env, ...testEnvironment(), NODE_ENV: "production" };
// The arguments are fixed strings; Windows needs a shell to start pnpm.
const run = (args) => {
  const result = spawnSync(["pnpm", ...args].join(" "), { env, stdio: "inherit", shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

console.log(`Recreating ${new URL(env.DATABASE_URL).pathname.slice(1)} from migrations...`);
run(["payload", "migrate:fresh", "--force-accept-warning"]);

const media = path.resolve(testMediaDir);
if (!media.startsWith(path.resolve(".qa") + path.sep)) throw new Error(`Unexpected test media directory: ${media}`);
await rm(media, { recursive: true, force: true });

console.log("Seeding the approved content...");
run(["seed"]);
