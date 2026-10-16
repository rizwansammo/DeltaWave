import type { EmailFieldValidation, Endpoint, Field, Tab } from "payload";
import { email } from "payload/shared";
import { adminOnlyField, isAdmin } from "../access";
import { allowedSenderDomains, headerSafe, isAllowedSender, mailConfigured } from "../../lib/mail";

// The "Email & enquiries" tab of Site settings. Routing business enquiries is
// an administrator decision: every field is readable and writable by
// administrators only, so editors cannot redirect enquiries and anonymous API
// reads never see the addresses. SMTP credentials are environment variables
// and never appear here.

const adminOnly = { read: adminOnlyField, update: adminOnlyField };

const noLineBreaks = (value: unknown) =>
  typeof value !== "string" || !/[\r\n]/.test(value) || "Use a single line.";

const fields: Field[] = [
  {
    name: "mailStatus",
    type: "ui",
    admin: { components: { Field: "/components/cms/mail-status#MailStatus" } },
  },
  {
    name: "acceptOnline",
    label: "Accept online enquiries",
    type: "checkbox",
    defaultValue: false,
    access: adminOnly,
    admin: {
      description:
        "Turns on the contact form. It also needs the Cloudflare Turnstile keys on the server. Publish an accurate privacy notice first: enquiries are stored in this CMS.",
    },
  },
  {
    name: "notify",
    label: "Email each new enquiry",
    type: "checkbox",
    defaultValue: true,
    access: adminOnly,
    admin: { description: "Enquiries are always saved first; the email is a notification." },
  },
  {
    name: "senderName",
    label: "Sender name",
    type: "text",
    maxLength: 80,
    defaultValue: "DeltaWave Technology Website",
    access: adminOnly,
    validate: noLineBreaks,
  },
  {
    name: "senderEmail",
    label: "Sender email (from address)",
    type: "email",
    access: adminOnly,
    validate: (value: string | null | undefined) =>
      !value ||
      isAllowedSender(value) ||
      `Use an address the mail server may send for: ${allowedSenderDomains().join(", ")}.`,
    admin: { description: "Leave empty to use the server's default sender." },
  },
  {
    name: "recipient",
    label: "Primary enquiry receiver",
    type: "email",
    access: adminOnly,
    // Needed once enquiries are accepted with notifications on; until then
    // the rest of Site settings can be published without it.
    validate: ((value, args) => {
      if (value) return email(value, args);
      const { acceptOnline, notify } = (args.siblingData ?? {}) as { acceptOnline?: boolean; notify?: boolean };
      return !acceptOnline || notify === false || "Add the address that receives enquiries.";
    }) satisfies EmailFieldValidation,
    admin: {
      description:
        "Where new enquiries are emailed. Separate from the public contact email, so changing one never changes the other.",
    },
  },
  {
    name: "additionalRecipients",
    label: "Additional receivers",
    type: "array",
    maxRows: 5,
    access: adminOnly,
    labels: { singular: "Receiver", plural: "Receivers" },
    fields: [{ name: "email", type: "email", required: true }],
  },
  {
    name: "replyToVisitor",
    label: "Reply goes to the visitor",
    type: "checkbox",
    defaultValue: true,
    access: adminOnly,
    admin: { description: "Sets Reply-To to the address the visitor entered, so replying answers them." },
  },
  {
    name: "subjectPrefix",
    label: "Subject prefix",
    type: "text",
    maxLength: 60,
    defaultValue: "Website enquiry",
    access: adminOnly,
    validate: noLineBreaks,
  },
];

export const enquirySettingsTab: Tab = {
  name: "enquiries",
  label: "Email & enquiries",
  description:
    "Who receives website enquiries and how they are notified. Administrators only. Changes apply once published.",
  fields,
};

const lastTest = new Map<string, number>();

/**
 * POST /cms-api/globals/site-settings/test-email: sends one fixed message to
 * the published primary receiver. Administrators only, once a minute, and
 * never to an address supplied in the request.
 */
export const testEmailEndpoint: Endpoint = {
  path: "/test-email",
  method: "post",
  handler: async (req) => {
    if (!isAdmin(req.user)) return Response.json({ message: "Administrators only." }, { status: 403 });
    if (!mailConfigured())
      return Response.json({ message: "Email is not configured on the server." }, { status: 409 });
    const key = String(req.user!.id);
    const now = Date.now();
    if (now - (lastTest.get(key) ?? 0) < 60_000)
      return Response.json({ message: "Please wait a minute before sending another test." }, { status: 429 });
    lastTest.set(key, now);
    const settings = await req.payload.findGlobal({
      slug: "site-settings",
      depth: 0,
      draft: false,
      overrideAccess: true,
    });
    const to = settings.enquiries?.recipient;
    if (!to) return Response.json({ message: "Publish a primary enquiry receiver first." }, { status: 409 });
    const from = settings.enquiries?.senderEmail;
    try {
      await req.payload.sendEmail({
        to,
        ...(from ? { from: { address: from, name: headerSafe(settings.enquiries?.senderName || "") } } : {}),
        subject: "DeltaWave website: test email",
        text: "This is a test from the DeltaWave CMS. Enquiry notifications will arrive at this address.",
      });
      return Response.json({ message: `The mail server accepted a test message for ${to}.` });
    } catch {
      return Response.json({ message: "The mail server did not accept the test message." }, { status: 502 });
    }
  },
};
