# Phase 2 plan: content management, homepage editor, publishing and frontend integration

Phase 2 moves the public website from `lib/content.ts` to Payload without changing what visitors see. The prototype parity suite (`tests/e2e/prototype-parity.spec.ts`) is the guard: after each step the pages must still match the approved prototype pixel for pixel, apart from intentional, reviewed content edits.

## Status

**Post-2A admin sidebar refinement:** DeltaWave's deep-navy, branded Payload
navigation is implemented in `docs/CMS_NAV_REFINEMENT.md`. Preserve it while
working on Phase 2B–2D; those phases should focus on CMS data and publishing,
not duplicate the sidebar redesign.

**Phase 2A, the CMS-driven homepage, is complete** (`docs/PHASE2A_REPORT.md`):

- The homepage renders on every request from the published Homepage global through a typed Local API data layer (`lib/cms/`), with explicit published, draft, uninitialized and unavailable states.
- `pnpm seed:homepage` publishes the approved content.
- Editors can now draft in the admin UI.
- The homepage cannot be unpublished.

**Phase 2B, services, industry solutions and portfolio, is complete** (`docs/PHASE2B_REPORT.md`):

- The /services, /solutions and /portfolio directories and all 35 detail pages render from published CMS records, read through `lib/cms/catalog.ts`. So do the Services and Solutions mega menus and the mobile menu.
- Every public page is rendered on request, so a published change appears on the next load and a newly published record is reachable at once.
- `pnpm seed` (content, then homepage) imports the approved records once, in a transaction, without overwriting anything a person has edited.

**Phase 2C + 2D, the remaining pages, site settings and draft preview, are complete** (`docs/PHASE2CD_REPORT.md`):

- About, Academy, Contact and the three directory introductions render from a single **Page content** global; the privacy notice is a record in **Pages**, edited as rich text.
- **Site settings** drive the header call to action, the footer, the contact details, the default search wording and the organization data.
- Staff preview drafts securely in the real design, and Payload's Live Preview is configured at 1440 and 390 px.

**Phase 2 is therefore complete for everything that can be built and verified locally.** The agreed division is:

- **Phase 2:** content management, editorial control, publishing workflow, secure drafts and previews, media management.
- **Phase 3:** production storage (R2), hosting, email delivery, DNS, security hardening, backups and deployment.

The items below are marked where 2A, 2B or 2C/2D covered them. Everything not marked is Phase 3.

Carried over from 2A:

- Payload is bundled more than once in production builds. Errors thrown from our hooks need an explicit `name` to keep their message (see the report). Re-check after Payload or Next.js upgrades.
- WebP uploads are re-encoded by Payload, which removes the ICC profile and lowers quality. Decide whether editors should upload JPEG masters, or whether to keep metadata (`withMetadata`, which also keeps EXIF and so needs a privacy review).
- Payload's document lock: a reviewer who opens a document an editor still has open is asked to take over. Explain this in editor guidance.

## Order of work

### 1. Seed the CMS from the current content
- *2A:* `pnpm seed:homepage` seeds the homepage, its five photographs, the four service categories, the six featured solutions and the two portfolio entries. It does nothing once the Homepage global has been saved.
- *2C:* `pnpm seed:pages` publishes the site settings, the page content and the privacy notice.
- *2B:* `pnpm seed:content` imports all 4 categories, 18 services, 15 solutions and 2 portfolio entries with every relationship, and `pnpm seed` runs it with the others.
- An idempotent `pnpm seed` script (Payload Local API) that imports `lib/content.ts`, `lib/site.ts`, the homepage copy from `components/site/pages.tsx`, the privacy notice (as rich text) and the six photographs with their credits from `docs/IMAGE_CREDITS.md`.
- Everything is created as **published** by an administrator account, so the live site is unchanged.
- Tests compare seeded counts and relationships with the existing content tests (18 services, 15 solutions, 2 projects, relationships resolve).

### 2. A typed server-side data layer
- *2A:* `lib/cms/homepage.ts`, `homepage-state.ts` and `homepage-view.ts` are the pattern. They make anonymous reads (`overrideAccess: false`, `draft: false`), leave unreadable relations out, never fill published fields with defaults, and fall back only before the first publication or during a database outage. The homepage uses `force-dynamic` rather than cache tags. Revisit tags when traffic or the number of CMS pages justifies it.
- `lib/cms/` functions on `getPayload({ config })`, using `payload-types.ts`, with `draft` support for previews.
- Cache by tag, and revalidate the affected pages from Payload `afterChange` and `afterDelete` hooks (`revalidateTag` / `revalidatePath`), so published edits appear without a rebuild.
- Decide how `generateStaticParams` and `dynamicParams` behave once slugs come from the CMS, and keep real 404s. *2B decided:* the frontend layout is `force-dynamic` and there is no static slug list, so new records need no build. Unknown or unpublished slugs are real 404s. Cache tags remain an option if traffic needs them.

### 3. Switch the frontend over, one area at a time
1. Site settings → header call to action, footer, contact details, JSON-LD. *Done in 2C.*
2. Service, solution and portfolio detail pages. *Done in 2B.*
3. Services, Solutions and Portfolio listings, mega menus and the mobile menu. *Done in 2B.*
4. Homepage from the Homepage global (section visibility and featured items). *Done in 2A.*
5. Privacy page from `pages`. *Done in 2C.*

Run unit, render, HTML and parity tests after each area.

### 4. Structured globals for the remaining pages
*Done in 2C:* one **Page content** global with a tab per page (About, Academy, Contact and the three directory introductions), plus the privacy notice in **Pages**.

### 5. Homepage editor and previews
- *Done in 2D:* Next.js draft mode behind a CMS session check, with Payload preview URLs, for every page type.
- *Done in 2D:* live preview (`admin.livePreview`) at 1440 and 390 px, refreshing on save.
- Editor help: field descriptions written for DeltaWave's content, image focal points, character counts. *2A wrote the Homepage descriptions.*

### 6. Publishing workflow
- Hide **Publish changes** from editors in the admin UI (the server already refuses them). *2A did this:* collections hide it through access control, and globals use `AdminPublishButton`. 2A also fixed a Phase 1 defect: the admin evaluates write access without the draft flag, so editors saw read-only forms everywhere. The draft-only rule for editors is now enforced at write time by a `beforeOperation` hook, which covers version restores too.
- Scheduled publishing (`versions.drafts.schedulePublish` with Payload's jobs queue), if wanted.
- Tests for version restore and for the audit fields shown in the sidebar. *2A covers homepage restores:* an editor cannot restore a version as live, and nobody can restore a draft as the live homepage.

### 7. Media and production foundations
- Cloudflare R2 through `@payloadcms/storage-s3`; serve responsive images from Payload's generated sizes. *2A serves the homepage images from the media library through `/cms-api/media/file/*`.* Every image request goes through Payload, so move to R2 or a CDN before launch.
- An email adapter (for example Resend) for password resets; apply the 12-character rule to resets too.
- Choose and prepare the Node.js host and the managed PostgreSQL service; run `pnpm migrate` in the release pipeline (or `prodMigrations` on a long-lived server); database backups and restore drills.

### 7a. Font loading polish
- Add a metric-matched fallback `@font-face` for Manrope (`size-adjust`, `ascent-override`, `descent-override`, `line-gap-override`) so swapping in the web font cannot move text. This also fixes the 1 px select placeholder offset (audit issue 11). Re-run the parity suite afterwards; it should be unaffected.

### 8. Security hardening
- Content-Security-Policy for the site and the admin.
- Rate limits at the edge or in shared storage for `/cms-api/users/login`, `/cms-api/users/forgot-password` and `/api/enquiry`.
- Take the enquiry client IP from the chosen host's trusted proxy header instead of `cf-connecting-ip` (see audit issue 9) before enabling online enquiries.
- Remove the `minimumReleaseAgeExclude` entries in `pnpm-workspace.yaml` once those versions are more than seven days old (after 2026-10-21).

## Decisions needed from the owner

| Decision | Why it matters |
| --- | --- |
| Production host and database provider | Determines the deployment pipeline, migrations step and the client-IP header. |
| Email provider and sender domain | Password resets and enquiry delivery; may need DNS records. |
| Cloudflare Turnstile keys for www.deltawave.tech | Needed to enable online enquiries. |
| Plain links or `next/link` | Client-side navigation changes how the site behaves; needs an accessibility review. |
| ELNATH web-embedding licence | The font is served publicly. |
| Privacy notice wording for the new hosting | Current text refers to the Sites private preview. |
| Whether to store enquiries in the CMS | Needs a privacy notice update and a retention period first. |
| Homepage section reordering | Needs a design review of the band rhythm. |

## Definition of done for Phase 2

- Every public page renders from Payload and passes the parity suite against the prototype (or an approved new baseline).
- Editors can draft, preview and hand over for publishing; administrators publish; visitors never see drafts (existing security tests stay green).
- Published edits appear on the live pages without a rebuild.
- Media is stored in R2 in a staging environment, and password reset email works there.
