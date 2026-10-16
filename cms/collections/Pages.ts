import type { CollectionConfig } from "payload";
import { auditFields, seoField, slugField } from "../fields";
import { contentAccess, contentHooks, contentVersions } from "../versioned";

// Addresses owned by dedicated routes or the CMS. A page may not use them.
export const reservedPageSlugs = [
  "admin",
  "cms-api",
  "api",
  "services",
  "solutions",
  "portfolio",
];

export const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "_status", "updatedAt"],
    group: "Website content",
    description:
      "Standalone pages with an editorial hero and body text, such as the privacy notice.",
  },
  access: contentAccess,
  versions: contentVersions,
  hooks: contentHooks,
  fields: [
    { name: "title", type: "text", required: true, maxLength: 100 },
    {
      name: "hero",
      type: "group",
      fields: [
        { name: "eyebrow", type: "text", maxLength: 60 },
        {
          name: "heading",
          type: "textarea",
          maxLength: 160,
          admin: { description: "Line breaks are kept. Defaults to the title." },
        },
        { name: "description", type: "textarea", maxLength: 400 },
      ],
    },
    { name: "body", type: "richText" },
    slugField({ reserved: reservedPageSlugs }),
    seoField,
    ...auditFields,
  ],
};
