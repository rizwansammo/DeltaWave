// Resolves the local integration-test database: the development DATABASE_URL
// with "_test" appended to the database name. Only local hosts are allowed so
// a misconfigured environment can never point tests at a shared database.
import { existsSync } from "node:fs";

/** Uploads made against the test database, kept apart from media/. */
export const testMediaDir = ".qa/test-media";

export function testDatabaseUrl() {
  if (existsSync(".env")) process.loadEnvFile(".env");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");
  const url = new URL(process.env.DATABASE_URL);
  if (!["127.0.0.1", "localhost"].includes(url.hostname))
    throw new Error(`Refusing to use a non-local database host: ${url.hostname}`);
  const name = url.pathname.slice(1);
  url.pathname = `/${name.endsWith("_test") ? name : `${name}_test`}`;
  return url.href;
}

/** Environment for anything that talks to the test database. */
/** A fixed key for the disposable test database only; never used elsewhere. */
export const testCredentialsKey = "7e57".repeat(16);

export const testEnvironment = () => ({
  DATABASE_URL: testDatabaseUrl(),
  MEDIA_DIR: testMediaDir,
  CREDENTIALS_ENCRYPTION_KEY: testCredentialsKey,
});
