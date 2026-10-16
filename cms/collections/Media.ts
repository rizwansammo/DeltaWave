import type { CollectionConfig } from "payload";
import { adminOnly, staffOnly } from "../access";
import { auditFields } from "../fields";

// Raster images only. SVG is excluded because an uploaded SVG served from the
// site's own origin can carry script.
export const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Image", plural: "Media library" },
  admin: {
    group: "Media",
    defaultColumns: ["filename", "alt", "updatedAt"],
    description:
      "Photography and graphics used on the website. Every image needs alternative text.",
  },
  access: {
    // Public website images are readable by anyone.
    read: () => true,
    create: staffOnly,
    update: staffOnly,
    delete: adminOnly,
  },
  upload: {
    // Local disk in development. Production storage moves to Cloudflare R2.
    staticDir: "media",
    mimeTypes: allowedImageTypes,
    pasteURL: false,
    focalPoint: true,
    adminThumbnail: "thumbnail",
    imageSizes: [
      { name: "thumbnail", width: 400, height: 300, position: "centre" },
      { name: "small", width: 640, formatOptions: { format: "webp" } },
      { name: "medium", width: 1100, formatOptions: { format: "webp" } },
      { name: "large", width: 1800, formatOptions: { format: "webp" } },
    ],
  },
  fields: [
    {
      name: "alt",
      label: "Alternative text",
      type: "text",
      required: true,
      maxLength: 250,
      admin: {
        description:
          "Describe what the image shows for people using screen readers.",
      },
    },
    { name: "caption", type: "text", maxLength: 200 },
    {
      name: "credit",
      label: "Source and licence",
      type: "text",
      maxLength: 250,
      admin: {
        description: "Photographer, source and licence, for example Unsplash License.",
      },
    },
    ...auditFields,
  ],
};
