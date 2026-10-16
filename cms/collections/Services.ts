import type { CollectionConfig } from "payload";
import { auditFields, seoField, slugField } from "../fields";
import { contentAccess, contentHooks, contentVersions } from "../versioned";

export const Services: CollectionConfig = {
  slug: "services",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "slug", "_status", "updatedAt"],
    group: "Website content",
    description: "Service detail pages under /services.",
  },
  access: contentAccess,
  versions: contentVersions,
  hooks: contentHooks,
  fields: [
    { name: "title", type: "text", required: true, maxLength: 100 },
    { name: "short", label: "Short statement", type: "text", required: true, maxLength: 120 },
    {
      name: "category",
      type: "relationship",
      relationTo: "service-categories",
      required: true,
    },
    { name: "intro", type: "textarea", required: true, maxLength: 600 },
    {
      name: "problem",
      label: "The business need",
      type: "textarea",
      required: true,
      maxLength: 800,
    },
    {
      name: "audience",
      label: "Designed for",
      type: "textarea",
      required: true,
      maxLength: 400,
    },
    {
      name: "deliverables",
      label: "What the scope can include",
      type: "array",
      minRows: 1,
      maxRows: 10,
      fields: [{ name: "item", type: "text", required: true, maxLength: 120 }],
    },
    {
      name: "approach",
      label: "How we approach the work",
      type: "textarea",
      required: true,
      maxLength: 800,
    },
    {
      name: "technology",
      label: "Technology & planning",
      type: "textarea",
      required: true,
      maxLength: 600,
    },
    {
      name: "relatedSolutions",
      type: "relationship",
      relationTo: "solutions",
      hasMany: true,
      maxRows: 6,
    },
    slugField(),
    seoField,
    ...auditFields,
  ],
};
