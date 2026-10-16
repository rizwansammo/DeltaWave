// Loads the approved homepage into the CMS: its photographs, the four service
// categories, the featured industry solutions and portfolio entries, and the
// Homepage global itself, published.
//
//   pnpm seed:homepage
//
// Safe to run any number of times:
//   - once the Homepage global has been saved (published or as a draft), the
//     CMS belongs to its editors and nothing at all is changed;
//   - otherwise each record is looked up by slug (photographs by file name)
//     and only created when missing, so a run that stopped half way can be
//     repeated without duplicates. Existing records are never modified.
//
// It runs through `payload run` with the Local API as trusted server code. Run
// it after `pnpm migrate` in production, with NODE_ENV=production.
import { getPayload } from "payload";
import config from "../payload.config";
import { approvedHomepage as a } from "../lib/cms/homepage-approved";
import { categories, projects, solutions } from "../lib/content";
import type { PortfolioProject, Solution } from "../payload-types";
import { printResults, seedPhoto, type SeedResult } from "./seed-media";

const payload = await getPayload({ config });
const trusted = { overrideAccess: true } as const;
const results: SeedResult[] = [];

const homepage = await payload.findGlobal({ slug: "homepage", depth: 0, draft: false, ...trusted });
const { totalDocs: versions } = await payload.countGlobalVersions({ global: "homepage", ...trusted });
if (versions > 0 || homepage?.updatedAt) {
  console.log(
    `The homepage is already saved in the CMS (${versions} version${versions === 1 ? "" : "s"}). Nothing was changed.`,
  );
} else {
  await seed();
  printResults("Seeded the approved homepage:", results);
}

async function seed() {
  const featuredSolutions = a.industries.featured.map((slug) => required(solutions, slug));
  const featuredProjects = a.portfolio.projects.map((slug) => required(projects, slug));

  const photoKeys = new Set([
    a.hero.image,
    a.services.featureImage,
    a.engineering.image,
    a.academy.image,
    ...categories.map((c) => c.image),
    ...featuredProjects.map((p) => p.image),
  ]);
  const photo: Record<string, number> = {};
  for (const key of photoKeys) photo[key] = await seedPhoto(payload, key, results);

  for (const c of categories) {
    await findOrCreate("service-categories", c.slug, c.title, () =>
      payload.create({
        collection: "service-categories",
        data: {
          title: c.title,
          number: c.number,
          short: c.short,
          description: c.description,
          image: photo[c.image],
          slug: c.slug,
          _status: "published",
        },
        ...trusted,
      }),
    );
  }

  const solutionIds: Record<string, number> = {};
  for (const s of featuredSolutions) {
    solutionIds[s.slug] = await findOrCreate("solutions", s.slug, s.title, () =>
      payload.create({
        collection: "solutions",
        data: {
          title: s.title,
          label: s.label,
          group: s.group as Solution["group"],
          intro: s.intro,
          challenge: s.challenge,
          modules: s.modules.map((item) => ({ item })),
          workflow: s.workflow.map((step) => ({ step })),
          consideration: s.consideration,
          slug: s.slug,
          _status: "published",
        },
        ...trusted,
      }),
    );
  }

  const projectIds: number[] = [];
  for (const p of featuredProjects) {
    projectIds.push(
      await findOrCreate("portfolio-projects", p.slug, p.name, async () =>
        payload.create({
          collection: "portfolio-projects",
          data: {
            name: p.name,
            title: p.title,
            type: p.type as PortfolioProject["type"],
            projectStatus: p.status as PortfolioProject["projectStatus"],
            image: photo[p.image],
            intro: p.intro,
            challenge: p.challenge,
            features: p.features.map((item) => ({ item })),
            direction: p.direction,
            relatedSolution: solutionIds[p.solution] ?? (await findBySlug("solutions", p.solution)),
            slug: p.slug,
            _status: "published",
          },
          ...trusted,
        }),
      ),
    );
  }

  await payload.updateGlobal({
    slug: "homepage",
    data: {
      hero: { ...a.hero, image: photo[a.hero.image] },
      introduction: a.introduction,
      services: { ...a.services, featureImage: photo[a.services.featureImage] },
      industries: { ...a.industries, featured: featuredSolutions.map((s) => solutionIds[s.slug]) },
      engineering: {
        ...a.engineering,
        image: photo[a.engineering.image],
        capabilities: a.engineering.capabilities.map((item) => ({ item })),
      },
      portfolio: { ...a.portfolio, projects: projectIds },
      approach: a.approach,
      academy: { ...a.academy, image: photo[a.academy.image] },
      contact: a.contact,
      _status: "published",
    },
    ...trusted,
  });
  results.push(["homepage", "Homepage global", "created"]);
}

function required<T extends { slug: string }>(list: T[], slug: string): T {
  const item = list.find((x) => x.slug === slug);
  if (!item) throw new Error(`The approved homepage refers to "${slug}", which lib/content.ts does not define.`);
  return item;
}

type SluggedCollection = "service-categories" | "solutions" | "portfolio-projects";

async function findBySlug(collection: SluggedCollection, slug: string) {
  const { docs } = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    pagination: false,
    ...trusted,
  });
  return docs[0]?.id;
}

async function findOrCreate(
  collection: SluggedCollection,
  slug: string,
  name: string,
  create: () => Promise<{ id: number }>,
) {
  const existing = await findBySlug(collection, slug);
  if (existing !== undefined) {
    results.push([collection, name, "kept"]);
    return existing;
  }
  const doc = await create();
  results.push([collection, name, "created"]);
  return doc.id;
}
