import type { Field, FieldHook, TextFieldSingleValidation } from "payload";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const toSlug = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Generates the slug from the source field when it is left empty. */
const fillSlug =
  (source: string): FieldHook =>
  ({ value, data }) => {
    if (typeof value === "string" && value.trim()) return toSlug(value);
    const fallback = data?.[source];
    return typeof fallback === "string" ? toSlug(fallback) : value;
  };

/**
 * URL slug shown in the sidebar. Unique and indexed for public lookups.
 * `reserved` lists addresses owned by other routes, such as /admin.
 */
export const slugField = ({
  source = "title",
  reserved = [],
}: { source?: string; reserved?: string[] } = {}): Field => ({
  name: "slug",
  type: "text",
  required: true,
  unique: true,
  index: true,
  maxLength: 80,
  validate: ((value) => {
    if (!value) return true;
    if (!slugPattern.test(value))
      return "Use lowercase letters, numbers and single hyphens, for example cloud-managed-it.";
    if (reserved.includes(value))
      return "This address is reserved by the website. Choose another slug.";
    return true;
  }) satisfies TextFieldSingleValidation,
  hooks: { beforeValidate: [fillSlug(source)] },
  admin: {
    position: "sidebar",
    description:
      "Part of the page address. Generated from the title when left empty. Changing it changes the public URL.",
  },
});

/**
 * Internal paths, https links, email and phone links only. Rejects
 * protocol-relative and script URLs.
 */
export const validateHref: TextFieldSingleValidation = (value) => {
  if (!value) return true;
  if (/^\/(?!\/)/.test(value)) return true;
  if (/^(https:\/\/|mailto:|tel:)\S+$/i.test(value)) return true;
  return "Use an internal path such as /contact, or an https://, mailto: or tel: link.";
};

/** A label and destination pair, such as a call to action. */
export const linkGroup = (name: string, label?: string): Field => ({
  name,
  label,
  type: "group",
  fields: [
    { name: "label", type: "text", maxLength: 60 },
    { name: "href", label: "Link", type: "text", maxLength: 300, validate: validateHref },
  ],
});

/** Search and sharing metadata. Empty values fall back to site defaults. */
export const seoField: Field = {
  name: "seo",
  label: "Search & sharing",
  type: "group",
  admin: {
    description: "Optional. Leave empty to use the title, summary and site defaults.",
  },
  fields: [
    { name: "title", type: "text", maxLength: 70 },
    { name: "description", type: "textarea", maxLength: 170 },
    { name: "image", type: "upload", relationTo: "media" },
    {
      name: "noIndex",
      label: "Hide from search engines",
      type: "checkbox",
      defaultValue: false,
    },
  ],
};

const stampUser: FieldHook = ({ req, value, operation }) =>
  req.user && (operation === "create" || operation === "update") ? req.user.id : value;

const keepCreator: FieldHook = ({ req, value, operation }) =>
  operation === "create" && req.user ? req.user.id : value;

// Audit fields are filled by hooks, so they only appear once there is a value.
const auditAdmin = (name: string) => ({
  position: "sidebar" as const,
  readOnly: true,
  condition: (data: Record<string, unknown>) => Boolean(data?.[name]),
});

/** Who last changed a document or global. Stored with every version. */
export const updatedByField: Field = {
  name: "updatedBy",
  type: "relationship",
  relationTo: "users",
  hooks: { beforeChange: [stampUser] },
  admin: auditAdmin("updatedBy"),
};

/** Who created and last changed a document. Stored with every version. */
export const auditFields: Field[] = [
  {
    name: "createdBy",
    type: "relationship",
    relationTo: "users",
    access: { update: () => false },
    hooks: { beforeChange: [keepCreator] },
    admin: auditAdmin("createdBy"),
  },
  updatedByField,
];
