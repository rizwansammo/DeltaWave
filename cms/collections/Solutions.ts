import type { CollectionConfig } from "payload";
import { generatePreviewURL } from "../preview";
import { auditFields, seoField, slugField } from "../fields";
import { solutionGroups } from "../options";
import { contentAccess, contentHooks, contentVersions } from "../versioned";

export const Solutions: CollectionConfig = {
  slug: "solutions",
  labels: { singular: "Industry solution", plural: "Industry solutions" },
  defaultSort: "order",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["order", "title", "group", "slug", "_status"],
    group: "Website content",
    preview: generatePreviewURL("solutions"),
    description:
      "Custom development capabilities under /solutions. Not ready-to-buy products.",
  },
  access: contentAccess,
  versions: contentVersions,
  hooks: contentHooks,
  fields: [
    { name: "title", type: "text", required: true, maxLength: 100 },
    {
      name: "label",
      type: "text",
      required: true,
      maxLength: 40,
      admin: { description: "Short industry label, for example Healthcare." },
    },
    {
      name: "group",
      type: "select",
      required: true,
      options: [...solutionGroups],
    },
    {
      name: "order",
      label: "Directory order",
      type: "number",
      min: 1,
      max: 999,
      index: true,
      admin: {
        position: "sidebar",
        description:
          "Position in the /solutions directory and the menus (1 comes first). Entries are numbered 01, 02 and so on in this order.",
      },
    },
    { name: "intro", type: "textarea", required: true, maxLength: 400 },
    {
      name: "challenge",
      label: "The operational challenge",
      type: "textarea",
      required: true,
      maxLength: 600,
    },
    {
      name: "modules",
      label: "Possible modules",
      type: "array",
      minRows: 1,
      maxRows: 8,
      fields: [{ name: "item", type: "text", required: true, maxLength: 120 }],
    },
    {
      name: "workflow",
      label: "Example workflow",
      type: "array",
      // The page layout is designed for exactly four steps.
      minRows: 4,
      maxRows: 4,
      fields: [{ name: "step", type: "text", required: true, maxLength: 80 }],
    },
    {
      name: "consideration",
      label: "Before we build",
      type: "textarea",
      required: true,
      maxLength: 700,
    },
    {
      name: "supportingServices",
      type: "relationship",
      relationTo: "services",
      hasMany: true,
      maxRows: 4,
    },
    slugField(),
    seoField,
    ...auditFields,
  ],
};
