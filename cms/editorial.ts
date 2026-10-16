import type { Field, GroupField, TextareaFieldValidation } from "payload";
import { linkGroup } from "./fields";

// Field shapes shared by the editorial page models. Copy, media, links and
// lists are editable; layout, spacing and styling stay in the design system.

/** Small label above a heading. */
export const eyebrow = (description = "Small label above the heading. Leave empty for none."): Field => ({
  name: "eyebrow",
  label: "Eyebrow label",
  type: "text",
  maxLength: 60,
  admin: { description },
});

/** Multi-line heading. Each line break becomes a line break on the page. */
export const heading = ({
  name = "heading",
  label,
  maxLines = 3,
  required = false,
  lineLength = 48,
}: { name?: string; label?: string; maxLines?: number; required?: boolean; lineLength?: number } = {}): Field => ({
  name,
  label,
  type: "textarea",
  required,
  maxLength: 200,
  validate: ((value) => {
    if (!value) return required ? "Add a heading." : true;
    const lines = value.split(/\r?\n/);
    if (lines.length > maxLines) return `Use at most ${maxLines} lines.`;
    if (lines.some((line) => line.length > lineLength))
      return `Keep each line under ${lineLength} characters.`;
    return true;
  }) satisfies TextareaFieldValidation,
  admin: { description: `Up to ${maxLines} lines. Press Enter to start a new line.`, rows: maxLines },
});

/** Body copy as separate paragraphs, in order. */
export const paragraphs = (
  name = "paragraphs",
  label = "Paragraphs",
  description = "One paragraph per row, in the order they are shown.",
): Field => ({
  name,
  label,
  type: "array",
  maxRows: 6,
  admin: { description },
  labels: { singular: "Paragraph", plural: "Paragraphs" },
  fields: [{ name: "text", type: "textarea", required: true, maxLength: 700 }],
});

export const image = (name: string, description: string): Field => ({
  name,
  type: "upload",
  relationTo: "media",
  admin: { description: `${description} Leave empty for no image.` },
});

export const link = (name: string, label?: string): Field => ({
  ...(linkGroup(name, label) as GroupField),
  admin: { description: "Shown only when both the label and the link are filled in." },
});

/** Hero band at the top of a page. */
export const pageHero = (maxLines = 2): Field => ({
  name: "hero",
  label: "Hero",
  type: "group",
  fields: [
    { name: "label", type: "text", required: true, maxLength: 60 },
    heading({ maxLines, required: true }),
    { name: "description", label: "Lead paragraph", type: "textarea", required: true, maxLength: 400 },
  ],
});

/** The "Start a conversation" band at the foot of a page. */
export const callToAction = (description = "The band at the foot of the page."): Field => ({
  name: "cta",
  label: "Closing call to action",
  type: "group",
  admin: { description },
  fields: [
    heading({ name: "title", label: "Heading", maxLines: 2, lineLength: 60 }),
    { name: "description", type: "textarea", maxLength: 300 },
    {
      name: "service",
      label: "Preselected service",
      type: "text",
      maxLength: 60,
      admin: {
        description:
          "Optional. Preselects this service on the contact form. Use a service category title, Academy interest or Other.",
      },
    },
  ],
});

/** Search and sharing wording for one page. */
export const pageSeo: Field = {
  name: "seo",
  label: "Search & sharing",
  type: "group",
  admin: {
    description:
      "How the page appears in search results and shared links. Leave empty to use the page's own heading and the site defaults.",
  },
  fields: [
    { name: "title", type: "text", maxLength: 70 },
    { name: "description", type: "textarea", maxLength: 170 },
  ],
};

/** A section that editors may hide. Its content is kept while hidden. */
export const enabled: Field = {
  name: "enabled",
  label: "Show this section",
  type: "checkbox",
  defaultValue: true,
  admin: { description: "Untick to hide the section on the website. Its content is kept." },
};
