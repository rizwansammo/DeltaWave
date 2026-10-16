import {
  APIError,
  type Field,
  type GlobalBeforeOperationHook,
  type GlobalConfig,
  type GroupField,
  type TextareaFieldValidation,
} from "payload";
import { linkGroup, updatedByField } from "../fields";
import { globalAccess, globalAdminComponents, globalHooks, globalVersions } from "../versioned";

// The homepage is a fixed editorial composition. Editors change copy, images,
// featured items and section visibility. Layout, order, colours and spacing
// stay with the design system. Section names are stable identifiers used by
// the frontend: hero, introduction, services, industries, engineering,
// portfolio, approach, academy, contact.

/**
 * Multi-line heading. Each line break becomes a line break on the page.
 * Required while its section is shown; drafts are not validated.
 */
const heading = (maxLines: number): Field => ({
  name: "heading",
  type: "textarea",
  maxLength: 160,
  validate: ((value, { siblingData }) => {
    const shown = (siblingData as { enabled?: boolean }).enabled !== false;
    if (!value) return shown ? "Add a heading, or hide this section." : true;
    const lines = value.split(/\r?\n/);
    if (lines.length > maxLines) return `Use at most ${maxLines} lines.`;
    if (lines.some((line) => line.length > 48)) return "Keep each line under 48 characters.";
    return true;
  }) satisfies TextareaFieldValidation,
  admin: {
    description: `Up to ${maxLines} lines. Press Enter to start a new line.`,
    rows: maxLines,
  },
});

const enabled: Field = {
  name: "enabled",
  label: "Show this section",
  type: "checkbox",
  defaultValue: true,
  admin: { description: "Untick to hide the section on the website. Its content is kept." },
};

const eyebrow: Field = {
  name: "eyebrow",
  label: "Eyebrow label",
  type: "text",
  maxLength: 60,
  admin: { description: "Small label above the heading. Leave empty for none." },
};

const sideText: Field = {
  name: "sideText",
  type: "textarea",
  maxLength: 220,
  admin: { description: "Shown beside the heading. Press Enter to start a new line." },
};

const link = (name: string, label?: string): Field => ({
  ...(linkGroup(name, label) as GroupField),
  admin: { description: "Shown only when both the label and the link are filled in." },
});

const image = (name: string, description: string): Field => ({
  name,
  type: "upload",
  relationTo: "media",
  admin: { description: `${description} Leave empty for no image.` },
});

const section = (name: string, label: string, fields: Field[], description?: string) => ({
  name,
  label,
  description,
  fields: name === "hero" ? fields : [enabled, ...fields],
});

export const homepageSections = [
  "hero",
  "introduction",
  "services",
  "industries",
  "engineering",
  "portfolio",
  "approach",
  "academy",
  "contact",
] as const;

const cannotUnpublish = () => {
  const error = new APIError(
    "The homepage cannot be unpublished. Hide individual sections, or publish a new version instead.",
    400,
    { global: "homepage" },
    true,
  );
  // Production builds bundle Payload more than once and minify class names.
  // When the error class and the REST error formatter come from different
  // copies, the formatter only keeps the message if the error has a name.
  error.name = "HomepageUnpublishRefused";
  return error;
};

/**
 * Once published, the homepage keeps a live version: visitors would otherwise
 * get no homepage at all. Refused: a live save with the draft status (the
 * admin's Unpublish) and restoring a draft version as the live one. Draft
 * saves and draft restores are unaffected.
 */
export const refuseUnpublish: GlobalBeforeOperationHook = async ({ args, operation, req }) => {
  if (args?.draft === true) return args;
  if (operation === "update" && args?.data?._status === "draft") throw cannotUnpublish();
  if (operation === "restoreVersion") {
    const version = await req.payload.findGlobalVersionByID({
      slug: "homepage",
      id: args.id,
      depth: 0,
      overrideAccess: true,
      req,
    });
    if (version?.version?._status !== "published") throw cannotUnpublish();
  }
  return args;
};

export const Homepage: GlobalConfig = {
  slug: "homepage",
  label: "Homepage",
  admin: {
    group: "Website content",
    description:
      "Copy and media for the homepage composition. The order and layout of sections are fixed by the design system. Save a draft to prepare changes privately; visitors see them after an administrator publishes.",
    components: globalAdminComponents,
  },
  access: globalAccess,
  versions: globalVersions,
  hooks: {
    ...globalHooks,
    beforeOperation: [...globalHooks.beforeOperation, refuseUnpublish],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        section("hero", "Hero", [
          eyebrow,
          heading(3),
          {
            name: "headingAccent",
            label: "Accent line",
            type: "text",
            maxLength: 40,
            admin: { description: "Final heading line, shown in green." },
          },
          { name: "description", type: "textarea", required: true, maxLength: 300 },
          link("primaryLink", "Primary button"),
          link("secondaryLink", "Secondary link"),
          {
            name: "scrollLabel",
            type: "text",
            maxLength: 80,
            admin: {
              description:
                "Link at the foot of the hero that scrolls to the introduction. Hidden while the introduction is hidden.",
            },
          },
          image("image", "Photograph shown with the heading."),
          { name: "imageCaption", type: "text", maxLength: 80 },
        ]),
        section("introduction", "Introduction", [
          eyebrow,
          {
            name: "location",
            type: "textarea",
            maxLength: 120,
            admin: { description: "Shown under the eyebrow. Press Enter to start a new line." },
          },
          heading(3),
          {
            name: "headingMuted",
            label: "Muted line",
            type: "text",
            maxLength: 48,
            admin: { description: "Final heading line, shown in grey." },
          },
          { name: "body", type: "textarea", maxLength: 500 },
          link("link"),
        ]),
        section(
          "services",
          "Services",
          [
            eyebrow,
            heading(2),
            sideText,
            link("link"),
            image("featureImage", "Photograph shown with the service list."),
            { name: "featureCaption", type: "text", maxLength: 100 },
          ],
          "The service list itself comes from the published service categories, in number order.",
        ),
        section("industries", "Industries", [
          eyebrow,
          heading(2),
          sideText,
          link("link"),
          {
            name: "featured",
            label: "Featured industries",
            type: "relationship",
            relationTo: "solutions",
            hasMany: true,
            maxRows: 6,
            admin: {
              description:
                "Up to six, shown in this order in a three column grid. Unpublished or deleted solutions are left out.",
            },
          },
        ]),
        section("engineering", "Engineering", [
          eyebrow,
          heading(2),
          { name: "body", type: "textarea", maxLength: 400 },
          link("link"),
          image("image", "Photograph shown with the capability lines."),
          {
            name: "capabilities",
            type: "array",
            maxRows: 4,
            admin: { description: "Up to four short lines." },
            fields: [{ name: "item", type: "text", required: true, maxLength: 60 }],
          },
        ]),
        section("portfolio", "Portfolio", [
          eyebrow,
          heading(2),
          sideText,
          link("link"),
          {
            name: "projects",
            type: "relationship",
            relationTo: "portfolio-projects",
            hasMany: true,
            maxRows: 2,
            admin: {
              description:
                "Up to two entries, shown in this order. Unpublished or deleted entries are left out.",
            },
          },
        ]),
        section("approach", "Approach", [
          eyebrow,
          heading(2),
          { name: "body", type: "textarea", maxLength: 300 },
          {
            name: "steps",
            type: "array",
            minRows: 2,
            maxRows: 6,
            admin: { description: "Two to six steps, numbered in this order." },
            fields: [
              { name: "title", type: "text", required: true, maxLength: 60 },
              { name: "description", type: "textarea", required: true, maxLength: 220 },
            ],
          },
        ]),
        section("academy", "Academy", [
          eyebrow,
          heading(2),
          { name: "body", type: "textarea", maxLength: 300 },
          {
            name: "statusLabel",
            type: "text",
            maxLength: 80,
            admin: {
              description:
                "State the real status, for example In planning · Enrollment is not open.",
            },
          },
          link("link"),
          image("image", "Photograph shown with the text."),
        ]),
        section(
          "contact",
          "Contact",
          [eyebrow, heading(2)],
          "The enquiry form under this heading is part of the website and has no settings here.",
        ),
      ],
    },
    updatedByField,
  ],
};
