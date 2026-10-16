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
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      admin: {
        description:
          "Shown on the Services page and at the top of this category's service pages.",
      },
    },
    {
      name: "overview",
      label: "Overview page",
      type: "relationship",
      relationTo: "services",
      admin: {
        description:
          "The service page that introduces this category. Category links lead to it.",
      },
    },
    {
      name: "services",
      type: "relationship",
      relationTo: "services",
      hasMany: true,
      admin: {
        description:
          "Services listed under this category, in display order. The menu shows the first four.",
      },
    },
    {
      name: "menuSolutions",
      label: "Solutions in the menu",
      type: "relationship",
      relationTo: "solutions",
      hasMany: true,
      maxRows: 3,
      admin: {
        description:
          "For a category without services: industry solutions listed under it in the Services menu. Its Services page entry lists the first six solutions instead.",
      },
    },
    slugField(),
    seoField,
    ...auditFields,
  ],
};
