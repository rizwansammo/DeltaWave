import type { Payload } from "payload";
import { smtpReady } from "../mail";

// What must be in place before an administrator may publish "Accept online
// enquiries": email, spam protection, and a privacy notice that tells
// visitors their enquiry is stored and for how long.

type Env = Record<string, string | undefined>;

export const turnstileConfigured = (env: Env = process.env) =>
  Boolean(env.TURNSTILE_SECRET_KEY && (env.TURNSTILE_SITE_KEY || env.NEXT_PUBLIC_TURNSTILE_SITE_KEY));

/** Marker text of the stored-enquiries section and of its unfilled retention period. */
export const privacyMarkers = { section: "How enquiries are stored", placeholder: "[retention period" };

/** The published privacy page describes stored enquiries and states a retention period. */
export async function privacyNoticeReady(payload: Payload) {
  const { docs } = await payload.find({
    collection: "pages",
    where: { slug: { equals: "privacy" } },
    draft: false,
    overrideAccess: true,
    depth: 0,
    limit: 1,
    pagination: false,
  });
  const page = docs[0];
  if (!page || page._status !== "published") return false;
  const text = JSON.stringify(page);
  return text.includes(privacyMarkers.section) && !text.includes(privacyMarkers.placeholder);
}

/** Plain-language reasons the form cannot open yet; empty when it can. */
export async function enquiryPrerequisites(payload: Payload, env: Env = process.env) {
  const missing: string[] = [];
  if (!(await smtpReady(payload, env))) missing.push("the SMTP server above is not configured");
  if (!turnstileConfigured(env)) missing.push("the Cloudflare Turnstile keys are not set on the server");
  if (!(await privacyNoticeReady(payload)))
    missing.push(
      `the published privacy notice must include "${privacyMarkers.section}" with the retention period filled in`,
    );
  return missing;
}
