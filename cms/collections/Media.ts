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
    group: "Media & settings",
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
    // MEDIA_DIR keeps the end-to-end suite's uploads apart from development's.
    staticDir: process.env.MEDIA_DIR || "media",
    mimeTypes: allowedImageTypes,
    pasteURL: false,
    focalPoint: true,
    adminThumbnail: "thumbnail",
    imageSizes: [
      { name: "thumbnail", width: 400, height: 300, position: "centre" },
      { name: "small", width: 640, formatOptions: { format: "webp" } },
      { name: "medium", width: 1100, formatOptions: { format: "webp" } },
      // Never enlarged: a photo narrower than 1800 px gets a full-size WebP
      // here, so high-density screens still receive the whole image.
      { name: "large", width: 1800, withoutEnlargement: true, formatOptions: { format: "webp" } },
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
