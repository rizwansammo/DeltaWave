import {
  ValidationError,
  type CollectionConfig,
  type FieldHook,
  type PayloadRequest,
} from "payload";
import { adminOnly, adminOnlyField, isAdmin, isStaff, roles } from "../access";

const MIN_PASSWORD_LENGTH = 12;

const noAccountsYet = async (req: PayloadRequest) => {
  const { totalDocs } = await req.payload.count({
    collection: "users",
    overrideAccess: true,
    req,
  });
  return totalDocs === 0;
};

/** The very first account is always saved as an administrator. */
const firstUserIsAdmin: FieldHook = async ({ req, operation, value }) =>
  operation === "create" && (await noAccountsYet(req)) ? ["admin"] : value;

export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Account", plural: "Accounts" },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "name", "roles", "updatedAt"],
    group: "Administration",
    description: "People who can sign in to the DeltaWave CMS.",
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 8 * 60 * 60,
    cookies: {
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
  access: {
    admin: ({ req }) => isStaff(req.user),
    create: adminOnly,
    delete: adminOnly,
    unlock: adminOnly,
    read: ({ req }) => {
      if (isAdmin(req.user)) return true;
      return req.user ? { id: { equals: req.user.id } } : false;
    },
    update: ({ req }) => {
      if (isAdmin(req.user)) return true;
      return req.user ? { id: { equals: req.user.id } } : false;
    },
  },
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        const password = data?.password;
        if (typeof password === "string" && password.length < MIN_PASSWORD_LENGTH) {
          throw new ValidationError({
            collection: "users",
            errors: [
              {
                message: `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
                path: "password",
              },
            ],
            req,
          });
        }
        return data;
      },
    ],
  },
  fields: [
    { name: "name", type: "text", maxLength: 120 },
    {
      name: "roles",
      type: "select",
      hasMany: true,
      required: true,
      saveToJWT: true,
      defaultValue: async ({ req }) => ((await noAccountsYet(req)) ? ["admin"] : ["editor"]),
      options: [
        { label: "Administrator", value: roles[0] },
        { label: "Editor", value: roles[1] },
      ],
      access: { create: adminOnlyField, update: adminOnlyField },
      hooks: { beforeChange: [firstUserIsAdmin] },
      admin: {
        description:
          "Administrators publish and manage accounts. Editors prepare drafts. The first account is always an administrator.",
      },
    },
  ],
};
