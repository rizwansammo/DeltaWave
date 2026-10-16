import type { CollectionConfig } from "payload";
import { auditFields, seoField, slugField } from "../fields";
import { contentAccess, contentHooks, contentVersions } from "../versioned";

// Matches the portfolio filters on the public site.
export const projectTypes = [
  "Real projects",
  "Case studies",
  "Software demonstrations",
  "Product concepts",
  "Under development",
];

// Honest delivery states. Nothing may be described as live or completed
// unless it actually is.
export const projectStatuses = [
  "Planned concept",
  "In development",
  "Live",
  "Completed",
];

const needsClientPermission = ["Real projects", "Case studies"];

export const PortfolioProjects: CollectionConfig = {
  slug: "portfolio-projects",
  labels: { singular: "Portfolio entry", plural: "Portfolio" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "type", "projectStatus", "_status", "updatedAt"],
    group: "Website content",
    description:
      "Projects and product directions under /portfolio. Publish real client work only with written permission.",
  },
  access: contentAccess,
  versions: contentVersions,
  hooks: contentHooks,
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      maxLength: 80,
      admin: { description: "Project or product name, for example Coaching Management SaaS." },
    },
    {
      name: "title",
      label: "Headline",
      type: "text",
      required: true,
      maxLength: 120,
    },
    { name: "type", type: "select", required: true, options: projectTypes },
    {
      // Not "status": that name would share a database enum with the drafts
      // `_status` column.
      name: "projectStatus",
      label: "Project status",
      type: "select",
      required: true,
      options: projectStatuses,
    },
    {
      name: "clientPermission",
      label: "Written publication permission confirmed",
      type: "checkbox",
      defaultValue: false,
      validate: (value: boolean | null | undefined, { siblingData }: { siblingData: { type?: string } }) =>
        !needsClientPermission.includes(siblingData?.type ?? "") ||
        value === true ||
        "Real projects and case studies need confirmed client permission.",
    },
    { name: "image", type: "upload", relationTo: "media" },
    { name: "intro", type: "textarea", required: true, maxLength: 400 },
    {
      name: "challenge",
      label: "The opportunity",
      type: "textarea",
      required: true,
      maxLength: 800,
    },
    {
      name: "features",
      label: "Capabilities",
      type: "array",
      minRows: 1,
      maxRows: 8,
      fields: [{ name: "item", type: "text", required: true, maxLength: 120 }],
    },
    {
      name: "direction",
      label: "What would come next",
      type: "textarea",
      maxLength: 600,
    },
    {
      name: "relatedSolution",
      type: "relationship",
      relationTo: "solutions",
    },
    slugField({ source: "name" }),
    seoField,
    ...auditFields,
  ],
};
