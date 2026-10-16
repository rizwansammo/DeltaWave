import type { Field, GlobalConfig, TextareaFieldValidation } from "payload";
import { linkGroup, updatedByField } from "../fields";
import { globalAccess, globalHooks, globalVersions } from "../versioned";

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
};

const eyebrow: Field = { name: "eyebrow", label: "Eyebrow label", type: "text", maxLength: 60 };
const sideText: Field = { name: "sideText", type: "textarea", maxLength: 220 };

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

export const Homepage: GlobalConfig = {
  slug: "homepage",
  label: "Homepage",
  admin: {
    group: "Website settings",
    description:
      "Copy and media for the homepage composition. The order and layout of sections are fixed by the design system.",
  },
  access: globalAccess,
  versions: globalVersions,
  hooks: globalHooks,
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
          linkGroup("primaryLink", "Primary button"),
          linkGroup("secondaryLink", "Secondary link"),
          { name: "scrollLabel", type: "text", maxLength: 80 },
          { name: "image", type: "upload", relationTo: "media" },
          { name: "imageCaption", type: "text", maxLength: 80 },
        ]),
        section("introduction", "Introduction", [
          eyebrow,
          { name: "location", type: "textarea", maxLength: 120 },
          heading(3),
          {
            name: "headingMuted",
            label: "Muted line",
            type: "text",
            maxLength: 48,
            admin: { description: "Final heading line, shown in grey." },
          },
          { name: "body", type: "textarea", maxLength: 500 },
          linkGroup("link"),
        ]),
        section(
          "services",
          "Services",
          [
            eyebrow,
            heading(2),
            sideText,
            linkGroup("link"),
            { name: "featureImage", type: "upload", relationTo: "media" },
            { name: "featureCaption", type: "text", maxLength: 100 },
          ],
          "The service list itself comes from the published service categories, in number order.",
        ),
        section("industries", "Industries", [
          eyebrow,
          heading(2),
          sideText,
          linkGroup("link"),
          {
            name: "featured",
            label: "Featured industries",
            type: "relationship",
            relationTo: "solutions",
            hasMany: true,
            maxRows: 6,
            admin: { description: "Up to six, shown in a three column grid." },
          },
        ]),
        section("engineering", "Engineering", [
          eyebrow,
          heading(2),
          { name: "body", type: "textarea", maxLength: 400 },
          linkGroup("link"),
          { name: "image", type: "upload", relationTo: "media" },
          {
            name: "capabilities",
            type: "array",
            maxRows: 4,
            fields: [{ name: "item", type: "text", required: true, maxLength: 60 }],
          },
        ]),
        section("portfolio", "Portfolio", [
          eyebrow,
          heading(2),
          sideText,
          linkGroup("link"),
          {
            name: "projects",
            type: "relationship",
            relationTo: "portfolio-projects",
            hasMany: true,
            maxRows: 2,
            admin: { description: "Up to two entries. Only published entries appear." },
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
          linkGroup("link"),
          { name: "image", type: "upload", relationTo: "media" },
        ]),
        section("contact", "Contact", [eyebrow, heading(2)]),
      ],
    },
    updatedByField,
  ],
};
