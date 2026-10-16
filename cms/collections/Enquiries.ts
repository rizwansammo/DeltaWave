import type { CollectionConfig, FieldAccess } from "payload";
import { adminOnly, isAdmin } from "../access";
import { updatedByField } from "../fields";

// Enquiries sent through the website's contact form. Personal data, so:
//   - only administrators can see, change or delete them (enforced on the
//     server for REST, GraphQL is off, and the admin hides the collection);
//   - nobody creates them through the API: the enquiry route stores them with
//     the Local API after validation, spam and rate checks;
//   - what the visitor submitted is read-only; staff add status and notes.
// Retention: delete records once they are no longer needed (see the privacy
// notice). Select several in the list to delete them together.

export const enquiryStatuses = ["New", "Contacted", "In progress", "Closed"] as const;
export const notificationStatuses = ["Pending", "Sent", "Failed"] as const;

const never = () => false;
const readOnlyField: { access: { create: FieldAccess; update: FieldAccess } } = {
  access: { create: never, update: never },
};

export const Enquiries: CollectionConfig = {
  slug: "enquiries",
  labels: { singular: "Enquiry", plural: "Enquiries" },
  defaultSort: "-submittedAt",
  admin: {
    group: "Administration",
    useAsTitle: "name",
    defaultColumns: ["name", "service", "status", "notification", "submittedAt"],
    listSearchableFields: ["name", "email", "service", "company"],
    description:
      "Enquiries from the website's contact form. Visible to administrators only. Update the status as you follow up, and delete records once they are no longer needed.",
    hidden: ({ user }) => !isAdmin(user as { roles?: ("admin" | "editor")[] | null } | null),
  },
  access: {
    create: never,
    read: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  timestamps: true,
  fields: [
    {
      type: "row",
      fields: [
        { name: "status", type: "select", required: true, defaultValue: "New", options: [...enquiryStatuses] },
        {
          name: "notification",
          label: "Email notification",
          type: "select",
          required: true,
          defaultValue: "Pending",
          options: [...notificationStatuses],
          ...readOnlyField,
          admin: { description: "Sent means the mail server accepted it, not that it reached the inbox." },
        },
      ],
    },
    {
      name: "notificationNote",
      label: "Notification detail",
      type: "text",
      maxLength: 300,
      ...readOnlyField,
      admin: { condition: (data) => Boolean(data?.notificationNote) },
    },
    { name: "internalNotes", label: "Internal notes", type: "textarea", maxLength: 4000 },
    {
      type: "collapsible",
      label: "Submitted by the visitor",
      fields: [
        { name: "name", type: "text", required: true, maxLength: 120, ...readOnlyField },
        { name: "email", type: "email", required: true, ...readOnlyField },
        { name: "phone", type: "text", required: true, maxLength: 30, ...readOnlyField },
        { name: "company", label: "Company / organization", type: "text", maxLength: 120, ...readOnlyField },
        { name: "service", label: "Requested service", type: "text", required: true, maxLength: 80, index: true, ...readOnlyField },
        { name: "description", label: "Project description", type: "textarea", required: true, maxLength: 5000, ...readOnlyField },
        {
          name: "consent",
          label: "Agreed to be contacted about this enquiry",
          type: "checkbox",
          defaultValue: false,
          ...readOnlyField,
        },
        {
          name: "submittedAt",
          type: "date",
          required: true,
          index: true,
          admin: { date: { pickerAppearance: "dayAndTime" } },
          ...readOnlyField,
        },
      ],
    },
    {
      // A hash of the form's submission ID, so a retried request is not
      // stored twice. Never shown.
      name: "submissionKey",
      type: "text",
      unique: true,
      index: true,
      admin: { hidden: true },
      ...readOnlyField,
    },
    updatedByField,
  ],
};
