import type { CollectionConfig } from "payload";
import { auditFields, seoField, slugField } from "../fields";
import { contentAccess, contentHooks, contentVersions } from "../versioned";

export const ServiceCategories: CollectionConfig = {
  slug: "service-categories",
  labels: { singular: "Service category", plural: "Service categories" },
  defaultSort: "number",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["number", "title", "slug", "_status"],
    group: "Website content",
    description:
      "The four capability groups shown on the Services page, mega menu and homepage.",
  },
  access: contentAccess,
  versions: contentVersions,
  hooks: contentHooks,
  fields: [
    { name: "title", type: "text", required: true, maxLength: 80 },
    {
      name: "number",
      type: "text",
      required: true,
      maxLength: 2,
      validate: (value: string | null | undefined) =>
        !value || /^\d{2}$/.test(value) || "Use two digits, for example 01.",
      admin: { description: "Display label and order, for example 01." },
    },
    { name: "short", label: "Short statement", type: "text", required: true, maxLength: 90 },
    { name: "description", type: "textarea", required: true, maxLength: 300 },
    { name: "image", type: "upload", relationTo: "media" },
    {
      name: "overview",
      label: "Overview page",
      type: "relationship",
      relationTo: "services",
      admin: { description: "The service page that introduces this category." },
    },
    {
      name: "services",
      type: "relationship",
      relationTo: "services",
      hasMany: true,
      admin: { description: "Services listed under this category, in display order." },
    },
    slugField(),
    seoField,
    ...auditFields,
  ],
};
