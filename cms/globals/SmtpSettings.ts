import type { GlobalConfig } from "payload";
import { allowedSmtpPorts, smtpSecurityModes } from "../../lib/smtp";

// Storage for the SMTP connection, edited only through the administrator
// endpoints in cms/globals/smtp-endpoints.ts (the "SMTP server" panel in
// Site settings → Email & enquiries). Nobody, administrators included, can
// read or write it through the REST API; there are no versions or drafts, so
// a replaced password leaves no copy behind. The password is stored
// encrypted (lib/secrets.ts) and is never returned by any endpoint.

const nobody = () => false;

export const SmtpSettings: GlobalConfig = {
  slug: "smtp-settings",
  label: "SMTP server",
  admin: { hidden: true },
  graphQL: false,
  access: { read: nobody, update: nobody, readVersions: nobody },
  fields: [
    { name: "host", type: "text", maxLength: 253 },
    {
      name: "port",
      type: "select",
      options: allowedSmtpPorts.map((port) => ({ label: String(port), value: String(port) })),
    },
    { name: "security", type: "select", options: [...smtpSecurityModes] },
    { name: "username", type: "text", maxLength: 254 },
    {
      name: "passwordEncrypted",
      type: "text",
      maxLength: 2048,
      access: { read: nobody, create: nobody, update: nobody },
    },
    { name: "passwordUpdatedAt", type: "date" },
    { name: "updatedBy", type: "text", maxLength: 254 },
    {
      name: "lastTest",
      type: "group",
      fields: [
        { name: "at", type: "date" },
        { name: "ok", type: "checkbox" },
        { name: "message", type: "text", maxLength: 400 },
      ],
    },
  ],
};
