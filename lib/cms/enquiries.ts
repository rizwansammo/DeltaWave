import config from "@payload-config";
import { createHash } from "node:crypto";
import { getPayload } from "payload";
import type { Enquiry } from "@/lib/enquiry";
import { headerSafe, isAllowedSender, mailConfigured } from "@/lib/mail";

// Stores accepted website enquiries and emails the notification. Called only
// by the enquiry route after validation, rate limiting and Turnstile; it is
// trusted server code, so it uses the Local API with overrideAccess. Nothing
// here logs a visitor's personal data.

export type EnquiryRouting = {
  accepting: boolean;
  notify: boolean;
  senderName: string;
  senderEmail: string;
  recipients: string[];
  replyToVisitor: boolean;
  subjectPrefix: string;
};

/** The published Email & enquiries settings. Drafts never route enquiries. */
export async function getEnquiryRouting(): Promise<EnquiryRouting> {
  const payload = await getPayload({ config });
  const settings = await payload.findGlobal({
    slug: "site-settings",
    depth: 0,
    draft: false,
    overrideAccess: true,
  });
  const e = settings._status === "published" ? (settings.enquiries ?? {}) : {};
  const recipients = [e.recipient, ...(e.additionalRecipients ?? []).map((row) => row.email)]
    .map((address) => address?.trim())
    .filter((address): address is string => Boolean(address));
  return {
    accepting: e.acceptOnline === true,
    notify: e.notify !== false,
    senderName: headerSafe(e.senderName || "DeltaWave Technology Website"),
    senderEmail: e.senderEmail && isAllowedSender(e.senderEmail) ? e.senderEmail : "",
    recipients: [...new Set(recipients)],
    replyToVisitor: e.replyToVisitor !== false,
    subjectPrefix: headerSafe(e.subjectPrefix || "Website enquiry"),
  };
}

/** A stable key for one form submission, so a retried request is stored once. */
export function submissionKey(enquiry: Enquiry, now = new Date()) {
  const source = enquiry.submissionId
    ? `id:${enquiry.submissionId}`
    : // Older forms without an ID: the same message on the same day.
      `content:${enquiry.email.toLowerCase()}|${enquiry.service}|${enquiry.description}|${now.toISOString().slice(0, 10)}`;
  return createHash("sha256").update(source).digest("hex");
}

export async function storeEnquiry(enquiry: Enquiry) {
  const payload = await getPayload({ config });
  const key = submissionKey(enquiry);
  const find = async () =>
    (
      await payload.find({
        collection: "enquiries",
        where: { submissionKey: { equals: key } },
        limit: 1,
        depth: 0,
        pagination: false,
        overrideAccess: true,
        select: { notification: true },
      })
    ).docs[0];
  const existing = await find();
  if (existing) return { id: existing.id, duplicate: true, notified: existing.notification === "Sent" };
  try {
    const doc = await payload.create({
      collection: "enquiries",
      overrideAccess: true,
      data: {
        name: enquiry.name,
        email: enquiry.email,
        phone: enquiry.phone,
        company: enquiry.company,
        service: enquiry.service,
        description: enquiry.description,
        consent: enquiry.consent,
        submittedAt: new Date().toISOString(),
        submissionKey: key,
        status: "New",
        notification: "Pending",
      },
    });
    return { id: doc.id, duplicate: false, notified: false };
  } catch (error) {
    // A simultaneous retry may have stored it first (the key is unique).
    const raced = await find();
    if (raced) return { id: raced.id, duplicate: true, notified: raced.notification === "Sent" };
    throw error;
  }
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function notificationMessage(enquiry: Enquiry, routing: EnquiryRouting) {
  const rows: [string, string][] = [
    ["Name", enquiry.name],
    ["Email", enquiry.email],
    ["Phone", enquiry.phone],
    ["Organization", enquiry.company || "Not supplied"],
    ["Service", enquiry.service],
  ];
  const text = [
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Project description:",
    enquiry.description,
    "",
    "The visitor agreed that these details may be used to respond to this enquiry.",
    "This enquiry is also saved in the DeltaWave CMS under Administration → Enquiries.",
  ].join("\n");
  const html = [
    `<table cellpadding="4" style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">`,
    ...rows.map(
      ([label, value]) =>
        `<tr><th align="left" style="padding-right:16px">${label}</th><td>${escapeHtml(value)}</td></tr>`,
    ),
    `</table>`,
    `<p style="font-family:Arial,sans-serif;font-size:14px"><strong>Project description</strong></p>`,
    `<p style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap">${escapeHtml(enquiry.description)}</p>`,
    `<p style="font-family:Arial,sans-serif;font-size:12px;color:#555">The visitor agreed that these details may be used to respond. Also saved in the DeltaWave CMS under Administration → Enquiries.</p>`,
  ].join("");
  return {
    subject: headerSafe(`${routing.subjectPrefix}: ${enquiry.service} from ${enquiry.name}`).slice(0, 200),
    text,
    html,
  };
}

/** Emails the notification and records the outcome on the enquiry. */
export async function notifyEnquiry(id: number | string, enquiry: Enquiry, routing?: EnquiryRouting) {
  const payload = await getPayload({ config });
  const route = routing ?? (await getEnquiryRouting());
  const record = (notification: "Sent" | "Failed", notificationNote: string) =>
    payload.update({
      collection: "enquiries",
      id,
      data: { notification, notificationNote },
      overrideAccess: true,
    });
  if (!route.notify) {
    await record("Failed", "Not emailed: notifications are switched off in Site settings.");
    return false;
  }
  if (!mailConfigured()) {
    await record("Failed", "Not emailed: the mail server is not configured.");
    return false;
  }
  if (route.recipients.length === 0) {
    await record("Failed", "Not emailed: no enquiry receiver is published in Site settings.");
    return false;
  }
  try {
    const message = notificationMessage(enquiry, route);
    const info = (await payload.sendEmail({
      to: route.recipients,
      ...(route.senderEmail ? { from: { address: route.senderEmail, name: route.senderName } } : {}),
      ...(route.replyToVisitor ? { replyTo: enquiry.email } : {}),
      ...message,
    })) as { accepted?: unknown[] } | undefined;
    if (!info?.accepted?.length) {
      await record("Failed", "The mail server did not accept any receiver.");
      return false;
    }
    await record("Sent", "Accepted by the mail server (inbox delivery is not guaranteed).");
    return true;
  } catch (error) {
    payload.logger.error({
      msg: "Enquiry notification failed",
      enquiry: id,
      reason: error instanceof Error ? error.message.slice(0, 200) : "unknown",
    });
    await record("Failed", "The mail server did not accept the message.");
    return false;
  }
}
