// Loads the approved site settings, editorial page content and privacy
// notice into the CMS, published.
//
//   pnpm seed          (content, pages, then the homepage)
//   pnpm seed:pages    (this only)
//
// Safe to run any number of times. Each of the three pieces is independent:
// once it has been saved in the CMS it belongs to its editors and is left
// exactly as it is. A piece that is missing is created; nothing is ever
// overwritten and nothing is duplicated.
//
// It runs through `payload run` with the Local API as trusted server code.
import { getPayload } from "payload";
import config from "../payload.config";
import {
  approvedPageContent,
  approvedPrivacyPage,
  approvedSettings,
} from "../lib/cms/pages-approved";
import { toLexical } from "../lib/cms/lexical";
import { printResults, seedPhoto, type SeedResult } from "./seed-media";

const payload = await getPayload({ config });
const trusted = { overrideAccess: true } as const;
const results: SeedResult[] = [];

await seedSettings();
await seedPageContent();
await seedPrivacy();
printResults("Approved pages and settings:", results);

/** A global is only written while it has never been saved. */
async function isUnsaved(slug: "site-settings" | "page-content", label: string) {
  const [doc, versions] = await Promise.all([
    payload.findGlobal({ slug, depth: 0, draft: false, ...trusted }),
    payload.countGlobalVersions({ global: slug, ...trusted }),
  ]);
  if (versions.totalDocs > 0 || doc?.updatedAt) {
    results.push([slug, `${label} (already saved in the CMS)`, "kept"]);
    return false;
  }
  return true;
}

async function seedSettings() {
  if (!(await isUnsaved("site-settings", "Site settings"))) return;
  await payload.updateGlobal({
    slug: "site-settings",
    data: { ...approvedSettings, _status: "published" },
    ...trusted,
  });
  results.push(["site-settings", "Site settings", "created"]);
}

async function seedPageContent() {
  if (!(await isUnsaved("page-content", "Page content"))) return;
  const a = approvedPageContent;
  const [aboutImage, academyImage] = await Promise.all([
    seedPhoto(payload, a.about.image, results),
    seedPhoto(payload, a.academy.hero.image, results),
  ]);
  await payload.updateGlobal({
    slug: "page-content",
    data: {
      about: {
        ...a.about,
        image: aboutImage,
        intro: {
          ...a.about.intro,
          paragraphs: a.about.intro.paragraphs.map((text) => ({ text })),
        },
      },
      academy: {
        ...a.academy,
        hero: { ...a.academy.hero, image: academyImage },
        intention: {
          ...a.academy.intention,
          paragraphs: a.academy.intention.paragraphs.map((text) => ({ text })),
        },
        topics: {
          ...a.academy.topics,
          groups: a.academy.topics.groups.map((group) => ({
            ...group,
            items: group.items.map((item) => ({ item })),
          })),
        },
      },
      contact: a.contact,
      services: a.services,
      solutions: a.solutions,
      portfolio: a.portfolio,
      _status: "published",
    },
    ...trusted,
  });
  results.push(["page-content", "About, Academy, Contact and the directory introductions", "created"]);
}

async function seedPrivacy() {
  const { docs } = await payload.find({
    collection: "pages",
    where: { slug: { equals: approvedPrivacyPage.slug } },
    limit: 1,
    depth: 0,
    pagination: false,
    ...trusted,
  });
  if (docs[0]) {
    results.push(["pages", `${approvedPrivacyPage.title} (already in the CMS)`, "kept"]);
    return;
  }
  await payload.create({
    collection: "pages",
    data: {
      title: approvedPrivacyPage.title,
      slug: approvedPrivacyPage.slug,
      hero: approvedPrivacyPage.hero,
      body: toLexical(approvedPrivacyPage.body),
      _status: "published",
    },
    ...trusted,
  });
  results.push(["pages", approvedPrivacyPage.title, "created"]);
}
