// Creates the first administrator of a new installation, so the public
// "create first user" screen is never open on a live server. Refuses to run
// once any account exists. The address and password come from the
// environment and are never printed.
//
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... node node_modules/payload/bin.js run scripts/create-admin.ts
import { getPayload } from "payload";
import config from "../payload.config";

const email = process.env.ADMIN_EMAIL?.trim();
const password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 16) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 16 characters).");
  process.exit(1);
}

const payload = await getPayload({ config });
const existing = await payload.count({ collection: "users", overrideAccess: true });
if (existing.totalDocs > 0) {
  console.log(`Not created: ${existing.totalDocs} account(s) already exist.`);
  process.exit(0);
}
await payload.create({
  collection: "users",
  data: { email, password, roles: ["admin"] },
  overrideAccess: true,
});
console.log("Created the first administrator account.");
process.exit(0);
