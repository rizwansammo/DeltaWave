// A short-lived administrator for checking a deployment in the browser
// without using a real person's account. Only addresses of the form
// cms-verify-<hex>@deltawave.invalid are accepted, so it cannot create or
// delete anyone else. The password comes from the environment and is never
// printed. Always run "delete" when the check is finished.
//
//   VERIFY_EMAIL=... VERIFY_PASSWORD=... node node_modules/payload/bin.js run scripts/verification-account.ts create
//   VERIFY_EMAIL=... node node_modules/payload/bin.js run scripts/verification-account.ts delete
import { getPayload } from "payload";
import config from "../payload.config";

const action = process.argv.at(-1);
const email = process.env.VERIFY_EMAIL?.trim() ?? "";
if (!/^cms-verify-[0-9a-f]{8,32}@deltawave\.invalid$/.test(email) || !["create", "delete"].includes(action ?? "")) {
  console.error("Usage: VERIFY_EMAIL=cms-verify-<hex>@deltawave.invalid … create|delete");
  process.exit(1);
}
const payload = await getPayload({ config });
if (action === "create") {
  const password = process.env.VERIFY_PASSWORD ?? "";
  if (password.length < 24) {
    console.error("VERIFY_PASSWORD must be at least 24 characters.");
    process.exit(1);
  }
  await payload.create({
    collection: "users",
    data: { email, password, name: "Deployment verification (temporary)", roles: ["admin"] },
    overrideAccess: true,
  });
  console.log("Created the temporary verification account.");
} else {
  const result = await payload.delete({ collection: "users", where: { email: { equals: email } }, overrideAccess: true });
  console.log(`Deleted ${result.docs.length} verification account(s).`);
}
process.exit(0);
