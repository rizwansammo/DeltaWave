# Phase 2B report: services, industry solutions and portfolio from the CMS

Phase 2B connects the services, industry solutions and portfolio pages, and the header menus, to Payload. With the approved content the site is unchanged: all 44 rendered documents are byte-identical to the pre-2B markup, and the browser comparison with the prototype shows no differing pixels.

## Implemented

- **Services:** `/services` (four categories in number order, with their services, images and descriptions) and all 18 service pages. Breadcrumbs, the overview page of each category with its service list, related industry solutions, and contact buttons that preselect the category.
- **Industry solutions:** `/solutions` (directory order and numbering, group filters, search over title, introduction and modules, empty state) and all 15 solution pages (modules, four-step workflow, supporting services).
- **Portfolio:** `/portfolio` (type filters, honest empty states, numbering) and both entries (status, image, capabilities, related solution).
- **Navigation:** the desktop Services and Solutions mega menus and the mobile menu list published categories, services and solutions. Behaviour, styling, keyboard handling and animation are unchanged.
- **Rendering:** the frontend layout is `force-dynamic` and there is no static slug list. A publish appears on the next page load, a new published record is reachable at once, and unpublished, deleted or unknown slugs are real 404s.
- **Published only:** `lib/cms/catalog.ts` reads through the Local API as an anonymous visitor (`overrideAccess: false`, `draft: false`), once per request. Relations resolve only to published records, so unpublished or deleted records vanish from every list without broken links.
- **SEO:** page titles, descriptions and sharing images come from the record (or its *Search & sharing* fields). *Hide from search engines* adds `noindex` and removes the page from the sitemap, which now lists the published records. URLs and canonicals are unchanged.
- **CMS unavailable:** these pages have no fallback content. The error is logged and the branded error page is shown. The header shows its plain links without menus. The homepage keeps its Phase 2A behaviour.
- **Honest status wording:** the "planned product concept" wording ("No commercial release", "Representative industry photography", the portfolio note) is shown only for entries that are Product concepts with status Planned concept. A real project published later is not mislabelled.

## Collections and fields

All five existing collections are reused, with their access rules, versions, drafts and publishing hooks. Two fields were added (migration `20261016_161108_phase2b_catalog_order`, additive only):

| Collection | New field | Why |
| --- | --- | --- |
| Industry solutions | `order` (*Directory order*, sidebar) | The approved numbering and order of the 15 solutions; 2A had created six of them out of order. The admin list sorts by it. |
| Service categories | `menuSolutions` (*Solutions in the menu*, up to 3) | The three curated solutions shown under *Business & industry solutions* in the Services menu (a category without services). |

Fields used:

- **Service categories:** `title`, `number`, `short`, `description`, `image`, `overview`, `services`, `menuSolutions`.
- **Services:** `title`, `short`, `category`, `intro`, `problem`, `audience`, `deliverables`, `approach`, `technology`, `relatedSolutions`, `slug`, `seo`.
- **Industry solutions:** `title`, `label`, `group`, `order`, `intro`, `challenge`, `modules`, `workflow`, `consideration`, `supportingServices`, `slug`, `seo`.
- **Portfolio:** `name`, `title`, `type`, `projectStatus`, `image`, `intro`, `challenge`, `features`, `direction`, `relatedSolution`, `slug`, `seo`.

The solution groups and the portfolio types and statuses now live in `cms/options.ts`, shared by the schema and the public filters.

## Content seeding

`pnpm seed` runs `pnpm seed:content` and then `pnpm seed:homepage`. Neither runs on application start.

`pnpm seed:content` (`scripts/seed-content.ts`):

- **All or nothing.** The import runs in one database transaction, so it either completes or changes nothing. A failure during development was rolled back cleanly.
- **No duplicates.** Records are matched by slug (photographs by file name) and reused, including those the homepage seed created.
- **Relationships in two stages:** first the records, then category overviews, service lists, menu solutions, supporting services and directory order.
- **People's edits are never overwritten.** An existing record is completed only where a field is empty *and* no person has ever saved the record (no version has `updatedBy`). Records people have edited are left exactly as they are and listed under *Needs review*.
- **Runs once.** Once services exist the import is complete. Later runs change nothing, so a record an administrator deleted on purpose is not recreated. They only list approved records missing from the CMS.

The approved source is `lib/content.ts`, with `approvedMenuSolutions` in `lib/cms/catalog-approved.ts`. Photo upload logic is shared with the homepage seed (`scripts/seed-media.ts`).

**Development database:** imported with this phase. It now holds 4 categories, 18 services, 15 solutions and 2 portfolio entries. Nothing needed review, and your account and the published homepage (1 version) are unchanged. The two new columns were added by development push mode.

## Publishing verification

Run against the production build and the seeded test database (`tests/e2e/site-content.spec.ts`):

- **Service, through the admin UI.** An editor changes *Web application development* and saves a draft. The editor sees no Publish button, and their direct writes and publish attempts are refused with 403. The service page, `/services` and the menus still show the published title. The administrator opens the record (taking over the edit lock if it is held) and publishes. On the next request the detail page, the Services directory, the category overview page, a solution's supporting-services list and the header menu all show the change. Restored afterwards.
- **Solution and portfolio entry, through the API.** Editor drafts are invisible on the pages, the directories, the menus and the homepage, and to visitors asking for drafts. After the administrator publishes, `/solutions/…`, `/solutions`, the Solutions menu, `/portfolio/…`, `/portfolio` and the homepage portfolio section update. Restored afterwards.
- **Unpublishing** a service and a solution makes their pages 404 and removes them from the directories, the category page, the menus and the sitemap. Republishing restores them.
- **A newly created and published solution** is reachable immediately and numbered 16. Marked *Hide from search engines*, it carries `noindex` and stays out of the sitemap. Deleting it makes it a 404 again.
- **Re-running `pnpm seed:content`** after an administrator's published edit reports "Nothing was changed", leaves the record counts unchanged and keeps the edit.

## Tests executed

| Check | Result |
| --- | --- |
| `pnpm typecheck` | Passes |
| `pnpm lint` | 0 errors, the same 14 documented warnings |
| `pnpm test` | 67 of 67 pass (7 new in `tests/catalog.test.mjs`, including the markup lock on all 44 documents) |
| `pnpm test:render` | 43 pages and the 404 render from the approved data, identical to the pre-2B baseline |
| `pnpm build` (once) | Passes; `/`, `/[...slug]` and the sitemap are dynamic |
| e2e: `cms`, `homepage`, `public-site`, `site-content` specs | 52 of 52 pass in 1.8 minutes (17 CMS, 11 homepage, 16 public site, 8 new) |
| Visual parity with the prototype at 1440 and 390 px, plus open menus | 3 of 3 pass, 0 differing pixels (12 pages per width) |
| Seed checks on the test database | Rollback on failure; import, then a second run with no changes; a record edited by an administrator is left unchanged and listed for review |

The full six-width parity matrix was not run, as briefed. It is unaffected unless markup changes, and the markup lock covers markup.

**Test maintenance:**

- `tests/routing.test.mjs` failed before this phase: the GitHub sidebar refinement added `SidebarOverview` and `SidebarUtilities` to the admin config without updating its expected list. The assertion now matches the approved config.
- The new browser spec is named `site-content.spec.ts` so that it runs after `cms.spec.ts`, whose first test needs an empty accounts table.

## Key files

- **New:**
  - `lib/cms/catalog.ts`, `lib/cms/catalog-view.ts`, `lib/cms/catalog-approved.ts`
  - `components/site/catalog.tsx`
  - `cms/options.ts`
  - `scripts/seed-content.ts`, `scripts/seed-media.ts`
  - migration `20261016_161108_phase2b_catalog_order`
  - `tests/catalog.test.mjs`, `tests/render-site.mjs`, `tests/fixtures/site.approved.json`
  - `tests/e2e/site-content.spec.ts`
- **Changed:**
  - `app/(frontend)/layout.tsx` (dynamic, menus) and `app/(frontend)/[...slug]/page.tsx`
  - `app/sitemap.ts`, `lib/metadata.ts`
  - `components/site/pages.tsx` (the six catalog pages take data), `components/site/directories.tsx`, `components/site/navigation.tsx`
  - `cms/collections/Solutions.ts`, `cms/collections/ServiceCategories.ts`, `cms/collections/PortfolioProjects.ts`
  - `scripts/seed-homepage.ts`, `scripts/prepare-test-db.mjs`
  - `payload-types.ts`, `package.json`
  - `tests/render.mjs`, `tests/tsx-loader.mjs`, `tests/routing.test.mjs`
  - docs: `README.md`, `docs/ARCHITECTURE.md`, `docs/CMS_CONTENT_MODEL.md`, `docs/PHASE2_PLAN.md`
- **Unchanged:** the admin sidebar, `app/(payload)/custom.scss`, `components/brand/`, fonts, favicons and the homepage integration.

## Known limitations

- Every public page now reads the database on each request (one shared catalog read). That is simple and immediate at this scale. Cache tags with publish hooks are the next step if traffic needs them.
- While the database is down, the services, solutions and portfolio pages show the error page and the header has no menus. This is deliberate: there is no stale fallback.
- The ordering of a category's services is the order of its `services` list. A service missing from that list still has its page but is not listed under the category.
- Portfolio entries are listed in creation order. There is no ordering field, because two entries did not justify one.
- Carried over from 2A: Payload re-encodes WebP uploads, the document lock asks reviewers to take over, and every image goes through `/cms-api/media/file/*` until R2.

## Future-phase dependencies

- **2C/2D:** About, Academy, Contact and Privacy pages; site settings (header call to action, footer, contact details, JSON-LD).
- **Later:** draft previews and live preview; R2 media storage; cache tags if needed.
- **Contact form:** its service options (`lib/site.ts`) still come from code. A renamed category stops preselecting the form until those options move to the CMS.
