// Imports the approved services, industry solutions and portfolio entries
// from lib/content.ts into the CMS, published, with their relationships.
//
//   pnpm seed            (this, then the homepage seed)
//   pnpm seed:content    (this only)
//
// Safe to run any number of times. The import runs once, in one database
// transaction, so it either completes or changes nothing:
//   - records are matched by slug (photographs by file name), so existing
//     ones, such as those the homepage seed created, are reused, never
//     duplicated;
//   - an existing record's missing relationships and directory order are
//     filled in only if no person has ever saved it. Records people have
//     edited are left exactly as they are and listed for review;
//   - once services exist the import is complete and the content belongs to
//     its editors. Later runs change nothing; they only list approved records
//     that are not in the CMS (for example ones deleted on purpose).
//
// It runs through `payload run` with the Local API as trusted server code. Run
// it after `pnpm migrate` in production, with NODE_ENV=production.
import {
  commitTransaction,
  createLocalReq,
  getPayload,
  initTransaction,
  killTransaction,
  type PayloadRequest,
} from "payload";
import config from "../payload.config";
import { approvedMenuSolutions } from "../lib/cms/catalog-approved";
import { categories, projects, services, solutions } from "../lib/content";
import type { PortfolioProject, Solution } from "../payload-types";
import { printResults, seedPhoto, type SeedResult } from "./seed-media";

type Collection = "service-categories" | "services" | "solutions" | "portfolio-projects";

const payload = await getPayload({ config });
const results: SeedResult[] = [];
const review: string[] = [];

const { totalDocs: existingServices } = await payload.count({ collection: "services", overrideAccess: true });
if (existingServices > 0) {
  console.log(
    `The services, solutions and portfolio were already imported (${existingServices} services in the CMS). Nothing was changed.`,
  );
  const missing = await missingApproved();
  if (missing.length) {
    console.log("Approved records not in the CMS (left as they are; add them in the admin if wanted):");
    for (const line of missing) console.log("  " + line);
  }
} else {
  const req = await createLocalReq({}, payload);
  await initTransaction(req);
  try {
    await importCatalog(req);
    await commitTransaction(req);
  } catch (error) {
    await killTransaction(req);
    console.error("The import was rolled back; the CMS is unchanged.");
    throw error;
  }
  printResults("Imported the approved services, solutions and portfolio:", results);
  if (review.length) {
    console.log("Needs review in the admin (edited by people, so not changed):");
    for (const line of review) console.log("  " + line);
  }
}

async function importCatalog(req: PayloadRequest) {
  const t = { overrideAccess: true, req } as const;
  const id = (map: Record<string, number>, slug: string) => {
    if (!(slug in map)) throw new Error(`lib/content.ts refers to "${slug}", which it does not define.`);
    return map[slug];
  };

  const photo: Record<string, number> = {};
  for (const key of new Set([...categories.map((c) => c.image), ...projects.map((p) => p.image)]))
    photo[key] = await seedPhoto(payload, key, results, req);

  // Stage 1: every record, with the relations that already resolve.
  const categoryIds: Record<string, number> = {};
  for (const c of categories)
    categoryIds[c.slug] = await findOrCreate(req, "service-categories", c.slug, c.title, () =>
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
        ...t,
      }),
    );

  const solutionIds: Record<string, number> = {};
  for (const [index, s] of solutions.entries())
    solutionIds[s.slug] = await findOrCreate(req, "solutions", s.slug, s.title, () =>
      payload.create({
        collection: "solutions",
        data: {
          title: s.title,
          label: s.label,
          group: s.group as Solution["group"],
          order: index + 1,
          intro: s.intro,
          challenge: s.challenge,
          modules: s.modules.map((item) => ({ item })),
          workflow: s.workflow.map((step) => ({ step })),
          consideration: s.consideration,
          slug: s.slug,
          _status: "published",
        },
        ...t,
      }),
    );

  const serviceIds: Record<string, number> = {};
  for (const s of services)
    serviceIds[s.slug] = await findOrCreate(req, "services", s.slug, s.title, () =>
      payload.create({
        collection: "services",
        data: {
          title: s.title,
          short: s.short,
          category: id(categoryIds, s.category),
          intro: s.intro,
          problem: s.problem,
          audience: s.audience,
          deliverables: s.deliverables.map((item) => ({ item })),
          approach: s.approach,
          technology: s.technology,
          relatedSolutions: s.related.map((slug) => id(solutionIds, slug)),
          slug: s.slug,
          _status: "published",
        },
        ...t,
      }),
    );

  const projectIds: Record<string, number> = {};
  for (const p of projects)
    projectIds[p.slug] = await findOrCreate(req, "portfolio-projects", p.slug, p.name, () =>
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
          relatedSolution: id(solutionIds, p.solution),
          slug: p.slug,
          _status: "published",
        },
        ...t,
      }),
    );

  // Stage 2: the relations that needed the other records to exist first.
  for (const c of categories)
    await complete(req, "service-categories", categoryIds[c.slug], c.title, {
      image: photo[c.image],
      overview: services.some((s) => s.slug === c.slug) ? serviceIds[c.slug] : null,
      services: c.links.map((slug) => id(serviceIds, slug)),
      menuSolutions: (approvedMenuSolutions[c.slug] ?? []).map((slug) => id(solutionIds, slug)),
    });
  for (const [index, s] of solutions.entries())
    await complete(req, "solutions", solutionIds[s.slug], s.title, {
      order: index + 1,
      supportingServices: s.services.map((slug) => id(serviceIds, slug)),
    });
  for (const p of projects)
    await complete(req, "portfolio-projects", projectIds[p.slug], p.name, {
      image: photo[p.image],
      relatedSolution: id(solutionIds, p.solution),
    });
}

async function findBySlug(req: PayloadRequest | undefined, collection: Collection, slug: string) {
  const { docs } = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    req,
  });
  return docs[0]?.id;
}

async function findOrCreate(
  req: PayloadRequest,
  collection: Collection,
  slug: string,
  name: string,
  create: () => Promise<{ id: number }>,
) {
  const existing = await findBySlug(req, collection, slug);
  if (existing !== undefined) {
    results.push([collection, name, "kept"]);
    return existing;
  }
  const doc = await create();
  results.push([collection, name, "created"]);
  return doc.id;
}

function isEmpty(value: unknown) {
  return value === null || value === undefined || (Array.isArray(value) && value.length === 0);
}

/**
 * Fills the given fields where the record has none, but only if no person has
 * ever saved the record (no version carries an `updatedBy`). Values already
 * present are never replaced.
 */
async function complete(
  req: PayloadRequest,
  collection: Exclude<Collection, "services">,
  id: number,
  name: string,
  wanted: Record<string, unknown>,
) {
  const t = { overrideAccess: true, req } as const;
  const doc = (await payload.findByID({ collection, id, depth: 0, ...t })) as unknown as Record<string, unknown>;
  const missing = Object.fromEntries(
    Object.entries(wanted).filter(([field, value]) => !isEmpty(value) && isEmpty(doc[field])),
  );
  if (Object.keys(missing).length === 0) return;
  const { totalDocs: editedByPeople } = await payload.countVersions({
    collection,
    where: { and: [{ parent: { equals: id } }, { "version.updatedBy": { exists: true } }] },
    ...t,
  });
  if (editedByPeople > 0) {
    review.push(`${collection}: ${name} (not set: ${Object.keys(missing).join(", ")})`);
    return;
  }
  await payload.update({ collection, id, data: { ...missing, _status: doc._status }, ...t } as never);
  results.push([collection, `${name} (${Object.keys(missing).join(", ")})`, "completed"]);
}

async function missingApproved() {
  const approved: [Collection, { slug: string }[]][] = [
    ["service-categories", categories],
    ["services", services],
    ["solutions", solutions],
    ["portfolio-projects", projects],
  ];
  const missing: string[] = [];
  for (const [collection, records] of approved)
    for (const r of records) if ((await findBySlug(undefined, collection, r.slug)) === undefined) missing.push(`${collection}: ${r.slug}`);
  return missing;
}
