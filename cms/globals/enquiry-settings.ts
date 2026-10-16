import type { CheckboxFieldValidation, EmailFieldValidation, Field, Tab } from "payload";
import { email } from "payload/shared";
import { adminOnlyField } from "../access";
import { enquiryPrerequisites } from "../../lib/cms/enquiry-readiness";

// The "Email & enquiries" tab of Site settings. Routing business enquiries is
// an administrator decision: every field is readable and writable by
// administrators only, so editors cannot redirect enquiries and anonymous API
// reads never see the addresses. The SMTP connection at the top is stored
// separately (cms/globals/SmtpSettings.ts), applies as soon as it is saved
// and keeps its password encrypted and write-only.

const adminOnly = { read: adminOnlyField, update: adminOnlyField };

const noLineBreaks = (value: unknown) =>
  typeof value !== "string" || !/[\r\n]/.test(value) || "Use a single line.";

const fields: Field[] = [
  {
    name: "smtp",
    type: "ui",
    admin: { components: { Field: "/components/cms/smtp-settings#SmtpSettings" } },
  },
  {
    name: "acceptOnline",
    label: "Accept online enquiries",
    type: "checkbox",
    defaultValue: false,
    access: adminOnly,
    // Checked when publishing: the form only opens once email, spam
    // protection and an accurate privacy notice are all in place.
    validate: (async (value, { req }) => {
      if (!value) return true;
      const missing = await enquiryPrerequisites(req.payload);
      return missing.length === 0 || `Online enquiries cannot be switched on yet: ${missing.join("; ")}.`;
    }) satisfies CheckboxFieldValidation,
    admin: {
      description:
        "Turns on the contact form. Publishing it requires a working SMTP server above, the Cloudflare Turnstile keys on the server, and a published privacy notice that describes stored enquiries with a confirmed retention period.",
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
    validate: ((value, args) => !value || email(value, args)) satisfies EmailFieldValidation,
    admin: {
      description:
        "The From address of every email the website sends. Leave empty to use the SMTP username. The SMTP account must be allowed to send as this address.",
    },
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
    "The mail server, and who receives website enquiries. Administrators only. The SMTP server applies when saved; the settings below apply once published.",
  fields,
};
