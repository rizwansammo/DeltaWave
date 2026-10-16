import type { GlobalConfig } from "payload";
import { linkGroup, updatedByField, validateHref } from "../fields";
import { generatePreviewURL } from "../preview";
import { site } from "../../lib/site";
import { globalAccess, globalAdminComponents, globalHooks, globalVersions } from "../versioned";
import { enquirySettingsTab, testEmailEndpoint } from "./enquiry-settings";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site settings",
  admin: {
    group: "Media & settings",
    preview: generatePreviewURL("site-settings"),
    description:
      "Business identity, contact details, search defaults, header and footer. These values are used across the website, so publish changes carefully.",
    components: globalAdminComponents,
  },
  access: globalAccess,
  versions: globalVersions,
  hooks: globalHooks,
  endpoints: [testEmailEndpoint],
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          name: "identity",
          label: "Identity",
          fields: [
            {
              name: "siteName",
              type: "text",
              required: true,
              maxLength: 80,
              admin: { description: "Used in page titles, sharing cards and the footer copyright." },
            },
            {
              name: "tagline",
              type: "textarea",
              maxLength: 200,
              admin: { description: "One line about the business, used as the default search description." },
            },
          ],
        },
        {
          name: "contact",
          label: "Contact",
          fields: [
            {
              name: "email",
              type: "email",
              required: true,
              admin: { description: "Business inbox shown on the site and used for enquiry delivery." },
            },
            {
              name: "phone",
              label: "Phone (international format)",
              type: "text",
              maxLength: 20,
              validate: (value: string | null | undefined) =>
                !value || /^\+[1-9]\d{6,14}$/.test(value) ||
                "Use the international format, for example +8801821777620.",
            },
            {
              name: "phoneDisplay",
              label: "Phone as displayed",
              type: "text",
              maxLength: 30,
              admin: { description: "How the number is written on the page, for example +880 1821 777620." },
            },
            {
              name: "location",
              label: "Business location",
              type: "textarea",
              maxLength: 200,
              admin: { description: "The address shown in the footer and on the contact page." },
            },
            {
              name: "postalAddress",
              label: "Structured address",
              type: "group",
              admin: {
                description:
                  "Used for the search engine business listing (structured data). Leave empty to omit it.",
              },
              fields: [
                { name: "street", type: "text", maxLength: 120 },
                { name: "locality", label: "City or district", type: "text", maxLength: 80 },
                { name: "region", label: "State or division", type: "text", maxLength: 80 },
                { name: "postalCode", type: "text", maxLength: 20 },
                {
                  name: "country",
                  label: "Country code",
                  type: "text",
                  maxLength: 2,
                  admin: { description: "Two letters, for example BD." },
                },
              ],
            },
            {
              name: "publicWebsite",
              label: "Website as displayed",
              type: "text",
              maxLength: 80,
              admin: {
                description: `Shown on the contact page and linked to the homepage. The real address stays ${site.url}.`,
              },
            },
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
          description: "Used where a page has no search and sharing values of its own.",
          fields: [
            {
              name: "title",
              type: "text",
              maxLength: 70,
              admin: { description: "Falls back to the site name." },
            },
            {
              name: "description",
              type: "textarea",
              maxLength: 170,
              admin: { description: "Falls back to the tagline." },
            },
            {
              name: "image",
              label: "Sharing image",
              type: "upload",
              relationTo: "media",
              admin: { description: "Shown when a page is shared. Falls back to the approved photograph." },
            },
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
                  admin: { description: "The button at the right of the header. Hidden if either field is empty." },
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
                {
                  name: "statement",
                  type: "textarea",
                  maxLength: 160,
                  admin: { description: "Beside the lockup. Press Enter to start a new line." },
                },
                {
                  name: "locationLabel",
                  type: "text",
                  maxLength: 60,
                  admin: { description: "Small label above the address, for example Based in Bangladesh." },
                },
                {
                  name: "caption",
                  type: "textarea",
                  maxLength: 160,
                  admin: { description: "Under the address. Press Enter to start a new line." },
                },
                linkGroup("closingLink", "Closing link"),
              ],
            },
          ],
        },
        enquirySettingsTab,
      ],
    },
    updatedByField,
  ],
};
