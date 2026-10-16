import type { GlobalConfig } from "payload";
import { linkGroup, updatedByField, validateHref } from "../fields";
import { globalAccess, globalAdminComponents, globalHooks, globalVersions } from "../versioned";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site settings",
  admin: {
    group: "Media & settings",
    description: "Business identity, contact details, search defaults, header and footer.",
    components: globalAdminComponents,
  },
  access: globalAccess,
  versions: globalVersions,
  hooks: globalHooks,
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          name: "identity",
          label: "Identity",
          fields: [
            { name: "siteName", type: "text", required: true, maxLength: 80 },
            { name: "tagline", type: "textarea", maxLength: 200 },
          ],
        },
        {
          name: "contact",
          label: "Contact",
          fields: [
            { name: "email", type: "email", required: true },
            {
              name: "phone",
              label: "Phone (international format)",
              type: "text",
              maxLength: 20,
              validate: (value: string | null | undefined) =>
                !value || /^\+[1-9]\d{6,14}$/.test(value) ||
                "Use the international format, for example +8801821777620.",
            },
            { name: "phoneDisplay", label: "Phone as displayed", type: "text", maxLength: 30 },
            { name: "location", type: "textarea", maxLength: 200 },
            { name: "publicWebsite", type: "text", maxLength: 80 },
          ],
        },
        {
          label: "Social links",
          fields: [
            {
              name: "social",
              type: "array",
              maxRows: 8,
              admin: { description: "Add only official DeltaWave profiles." },
              fields: [
                {
                  name: "platform",
                  type: "select",
                  required: true,
                  options: ["LinkedIn", "Facebook", "X", "YouTube", "Instagram", "GitHub"],
                },
                {
                  name: "url",
                  type: "text",
                  required: true,
                  validate: (value: string | null | undefined) =>
                    !value || /^https:\/\/\S+$/i.test(value) || "Use a full https:// address.",
                },
              ],
            },
          ],
        },
        {
          name: "seoDefaults",
          label: "Search defaults",
          fields: [
            { name: "title", type: "text", maxLength: 70 },
            { name: "description", type: "textarea", maxLength: 170 },
            { name: "image", type: "upload", relationTo: "media" },
          ],
        },
        {
          label: "Header & footer",
          fields: [
            {
              name: "header",
              type: "group",
              fields: [
                {
                  name: "ctaLabel",
                  label: "Call to action label",
                  type: "text",
                  maxLength: 30,
                },
                {
                  name: "ctaHref",
                  label: "Call to action link",
                  type: "text",
                  validate: validateHref,
                },
              ],
            },
            {
              name: "footer",
              type: "group",
              fields: [
                { name: "statement", type: "textarea", maxLength: 160 },
                { name: "caption", type: "textarea", maxLength: 160 },
                linkGroup("closingLink", "Closing link"),
              ],
            },
          ],
        },
      ],
    },
    updatedByField,
  ],
};
