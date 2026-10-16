import type { GlobalConfig } from "payload";
import {
  callToAction,
  enabled,
  eyebrow,
  heading,
  image,
  link,
  pageHero,
  pageSeo,
  paragraphs,
} from "../editorial";
import { updatedByField } from "../fields";
import { generatePreviewURL } from "../preview";
import { globalAccess, globalAdminComponents, globalHooks, globalVersions } from "../versioned";

// The editorial copy of the pages that are not a record of their own: About,
// Academy, Contact, and the introductions of the Services, Solutions and
// Portfolio directories. One global with a tab per page keeps the admin
// navigation short. Section names are stable identifiers used by the frontend.

export const PageContent: GlobalConfig = {
  slug: "page-content",
  label: "Page content",
  admin: {
    group: "Website content",
    preview: generatePreviewURL("page-content"),
    description:
      "Copy and media for the About, Academy and Contact pages and for the three directory introductions. Save a draft to prepare changes privately; visitors see them after an administrator publishes.",
    components: globalAdminComponents,
  },
  access: globalAccess,
  versions: globalVersions,
  hooks: globalHooks,
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          name: "about",
          label: "About",
          description: "The /about page.",
          fields: [
            pageHero(),
            image("image", "Wide photograph under the hero."),
            { name: "imageCaption", type: "text", maxLength: 120 },
            {
              name: "intro",
              label: "Who we are",
              type: "group",
              fields: [
                eyebrow(),
                heading({ maxLines: 2 }),
                { name: "lead", label: "Lead paragraph", type: "textarea", maxLength: 400 },
                paragraphs(),
              ],
            },
            {
              name: "vision",
              type: "group",
              fields: [
                { name: "label", type: "text", maxLength: 40 },
                heading({ maxLines: 2, lineLength: 60 }),
                { name: "body", type: "textarea", maxLength: 500 },
              ],
            },
            {
              name: "mission",
              type: "group",
              fields: [
                { name: "label", type: "text", maxLength: 40 },
                heading({ maxLines: 2, lineLength: 60 }),
                { name: "body", type: "textarea", maxLength: 500 },
              ],
            },
            {
              name: "principles",
              label: "Our approach",
              type: "group",
              fields: [
                enabled,
                eyebrow(),
                heading({ name: "title", label: "Section heading", maxLines: 1, lineLength: 60 }),
                {
                  name: "items",
                  label: "Principles",
                  type: "array",
                  maxRows: 6,
                  admin: { description: "Numbered 01, 02 and so on in this order." },
                  fields: [
                    { name: "title", type: "text", required: true, maxLength: 60 },
                    { name: "description", type: "textarea", required: true, maxLength: 300 },
                  ],
                },
              ],
            },
            {
              name: "direction",
              label: "Our direction",
              type: "group",
              fields: [
                enabled,
                eyebrow(),
                heading({ maxLines: 2, lineLength: 60 }),
                { name: "body", type: "textarea", maxLength: 700 },
                link("link"),
              ],
            },
            callToAction(),
            pageSeo,
          ],
        },
        {
          name: "academy",
          label: "Academy",
          description:
            "The /academy page. State the real status only: the Academy is a planned initiative and enrollment is not open.",
          fields: [
            {
              name: "hero",
              label: "Hero",
              type: "group",
              fields: [
                eyebrow(),
                heading({ maxLines: 3, required: true, lineLength: 30 }),
                {
                  name: "headingAccent",
                  label: "Accent line",
                  type: "text",
                  maxLength: 40,
                  admin: { description: "Final heading line, shown in green." },
                },
                { name: "description", label: "Lead paragraph", type: "textarea", required: true, maxLength: 400 },
                {
                  name: "statusLabel",
                  type: "text",
                  maxLength: 80,
                  admin: {
                    description:
                      "State the real status, for example In planning · Enrollment is not open. Do not announce courses, fees, instructors or dates before they are confirmed.",
                  },
                },
                image("image", "Photograph beside the heading."),
              ],
            },
            {
              name: "intention",
              label: "The intention",
              type: "group",
              fields: [enabled, eyebrow(), heading({ maxLines: 2 }), paragraphs()],
            },
            {
              name: "topics",
              label: "Proposed learning areas",
              type: "group",
              fields: [
                enabled,
                eyebrow(),
                heading({ name: "title", label: "Section heading", maxLines: 1, lineLength: 60 }),
                {
                  name: "groups",
                  label: "Learning areas",
                  type: "array",
                  maxRows: 6,
                  admin: { description: "Numbered 01, 02 and so on in this order." },
                  fields: [
                    { name: "title", type: "text", required: true, maxLength: 60 },
                    {
                      name: "items",
                      label: "Topics",
                      type: "array",
                      minRows: 1,
                      maxRows: 8,
                      fields: [{ name: "item", type: "text", required: true, maxLength: 80 }],
                    },
                  ],
                },
              ],
            },
            {
              name: "next",
              label: "A phased initiative",
              type: "group",
              fields: [
                enabled,
                eyebrow(),
                heading({ maxLines: 2 }),
                { name: "body", type: "textarea", maxLength: 500 },
                link("link", "Button"),
              ],
            },
            pageSeo,
          ],
        },
        {
          name: "contact",
          label: "Contact",
          description:
            "The /contact page. The business address, email and phone come from Site settings.",
          fields: [
            {
              name: "hero",
              label: "Hero",
              type: "group",
              fields: [
                eyebrow(),
                heading({ maxLines: 2, required: true }),
                { name: "description", label: "Lead paragraph", type: "textarea", required: true, maxLength: 400 },
              ],
            },
            {
              name: "section",
              label: "Enquiry section",
              type: "group",
              admin: { description: "The heading above the contact details and the enquiry form." },
              fields: [
                eyebrow(),
                heading({ maxLines: 2 }),
                { name: "detailsIntro", label: "Text beside the details", type: "textarea", maxLength: 300 },
                { name: "note", label: "Closing note", type: "text", maxLength: 160 },
              ],
            },
            {
              name: "next",
              label: "What happens next",
              type: "group",
              fields: [
                enabled,
                eyebrow(),
                heading({ maxLines: 2, lineLength: 60 }),
                { name: "body", type: "textarea", maxLength: 600 },
              ],
            },
            pageSeo,
          ],
        },
        {
          name: "services",
          label: "Services directory",
          description:
            "The introduction of /services. The four categories and their services come from their own records.",
          fields: [
            pageHero(),
            { name: "heroButton", label: "Hero button", type: "text", maxLength: 40 },
            callToAction(),
            pageSeo,
          ],
        },
        {
          name: "solutions",
          label: "Solutions directory",
          description:
            "The introduction of /solutions. The industry solutions themselves come from their own records.",
          fields: [
            pageHero(),
            {
              name: "opening",
              label: "Opening note",
              type: "group",
              fields: [
                { name: "label", type: "text", maxLength: 60 },
                { name: "body", type: "textarea", maxLength: 400 },
                link("link"),
              ],
            },
            callToAction(),
            pageSeo,
          ],
        },
        {
          name: "portfolio",
          label: "Portfolio directory",
          description:
            "The introduction of /portfolio. The entries themselves come from their own records.",
          fields: [
            pageHero(),
            {
              name: "note",
              label: "Status note",
              type: "group",
              admin: {
                description:
                  "Shown while every published entry is a planned product concept. Keep it factual.",
              },
              fields: [
                { name: "statusLabel", type: "text", maxLength: 60 },
                { name: "body", type: "textarea", maxLength: 400 },
              ],
            },
            callToAction(),
            pageSeo,
          ],
        },
      ],
    },
    updatedByField,
  ],
};
