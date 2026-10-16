// Creates an untracked .env from .env.example with freshly generated local
// secrets. An existing .env is never overwritten.
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const target = new URL("../.env", import.meta.url);
if (existsSync(target)) {
  console.log(".env already exists. It was left unchanged.");
  process.exit(0);
}
const template = readFileSync(new URL("../.env.example", import.meta.url), "utf8");
// Hex keeps the password safe inside DATABASE_URL without URL encoding.
const databasePassword = randomBytes(24).toString("hex");
const payloadSecret = randomBytes(32).toString("hex");
const credentialsKey = randomBytes(32).toString("hex");
const env = template
  .replaceAll("replace-with-a-long-random-value", databasePassword)
  .replace("replace-with-at-least-32-random-characters", payloadSecret)
  .replace("replace-with-64-hex-characters", credentialsKey);
writeFileSync(target, env, { flag: "wx" });
console.log(
  "Created .env with a generated local database password, Payload secret and credentials key.",
);
