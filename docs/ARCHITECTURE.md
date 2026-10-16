# Architecture

DeltaWave Technology runs as **one Next.js application** that serves the public website and the Payload CMS from the same origin. In production that origin is `https://www.deltawave.tech`; locally it is `http://localhost:3000`.

## Route ownership

| Path | Owner | Notes |
| --- | --- | --- |
| `/` | `app/(frontend)/page.tsx` | Rendered on every request from the published Homepage global (Phase 2A). See "Homepage content" below. |
| `/services`, `/solutions`, `/portfolio` and their 35 detail pages | `app/(frontend)/[...slug]` | Rendered on every request from the published CMS records (Phase 2B), through `lib/cms/catalog.ts`. Unknown or unpublished slugs are real 404s; a newly published record is reachable at once. |
| About, Academy, Contact, Privacy | `app/(frontend)/[...slug]` | Still from code (Phase 2C/2D), rendered on request with the shared layout. |
| Unknown paths | `app/(frontend)/[...slug]` → `not-found.tsx` | Real HTTP 404 with the branded page in production builds. |
| `/admin`, `/admin/*` | `app/(payload)/admin/[[...segments]]` | Payload admin panel. Sends `X-Robots-Tag: noindex, nofollow`. |
| `/cms-api/*` | `app/(payload)/cms-api/[...slug]/route.ts` | Payload REST API (`config.routes.api`). Sends `X-Robots-Tag`. |
| `/api/enquiry` | `app/api/enquiry/route.ts` | The prototype's enquiry endpoint, unchanged. |
| `/robots.txt`, `/sitemap.xml` | `app/robots.ts`, `app/sitemap.ts` | Robots disallows everything until `NEXT_PUBLIC_INDEXABLE=true`, then still disallows `/admin` and `/cms-api`. |

The two route groups each have their own root layout, so the admin never loads the site stylesheet and the site never loads Payload's CSS. Static segments (`admin`, `cms-api`, `api`) take precedence over the site's catch-all, and the CMS `pages` collection refuses those addresses as slugs.

**Why `/cms-api` and not Payload's default `/api`:** the prototype already owns `/api/enquiry`. Next.js would route a static `/api/enquiry` ahead of a Payload catch-all, but two owners under one prefix invites future collisions (for example a Payload collection called `enquiry`). A separate prefix makes ownership obvious. The admin panel uses `config.routes.api` for every call, so no admin behaviour depends on `/api`.

**GraphQL is disabled** (`graphQL.disable: true`). The site will read content through Payload's Local API on the server, so GraphQL would only add public attack surface. No GraphQL route files exist.

## Runtime and stack

| Layer | Choice | Version |
| --- | --- | --- |
| Runtime | Node.js | `>=22.13`; developed and tested on 24.18.1 |
| Framework | Next.js App Router (Turbopack builds) | 16.4.1 |
| UI | React / React DOM | 19.2.9 |
| CMS | Payload (`payload`, `@payloadcms/next`, `ui`, `richtext-lexical`, `db-postgres`) | 3.90.2 |
| Database | PostgreSQL via `@payloadcms/db-postgres` (node-postgres + Drizzle, managed by Payload) | PostgreSQL 18.6 locally |
| Images | sharp | 0.35.5 |
| Package manager | pnpm (pinned through `packageManager`) | 11.25.0 |
| Tests | Node test runner, Playwright | Playwright 1.62.1 |
| Lint / types | ESLint + `eslint-config-next`, TypeScript | 10.12.0 / 16.4.0, 5.9.3 |

Payload 4 exists only as a beta and was not considered. Payload 3.90.2 declares support for Next.js `>=16.3.3 <17`.

### Security releases installed ahead of the age policy

`pnpm-workspace.yaml` keeps the prototype's supply-chain rule: a package version must be at least seven days old before it is installed. Two coordinated security releases from 2026-10-14 are exempted by **exact version only**:

- `next@16.4.1` (and its `@next/env` and `@next/swc-*` binaries): GHSA-673q-mjm6-r5xr and GHSA-2464-fhr4-w9xw (critical, unauthenticated remote code execution, all 16.x up to 16.4.0) and GHSA-p3m5-59mp-jv5r (denial of service).
- `react@19.2.9`, `react-dom@19.2.9`: GHSA-xqc2-xf4c-x3h3 (critical remote code execution in React Server Components) and GHSA-h3gv-c5rc-p453.

All of these versions carry npm provenance attestations. Remove the exemptions once the versions are more than seven days old. `sharp@0.35.5` already meets the age rule and the GHSA-2464 requirement (`>=0.35.5`).

ESLint 9 is end of life, so ESLint 10 is used. Three plugins bundled by `eslint-config-next` (import, jsx-a11y, react) do not yet list ESLint 10 in their peer range; they run without errors, and `pnpm peers check` reports the mismatch.

## Database

- **Local:** `docker-compose.yml` runs a dedicated container `deltawave-postgres` (image `postgres:18.6-alpine3.24`) with the named volume `deltawave-pgdata`, bound to `127.0.0.1:54330` only. It does not restart on its own. Credentials come from the untracked `.env`, created by `pnpm setup:env`.
- **Development schema:** `pnpm dev` uses Payload's push mode, which syncs the schema automatically. Do not run `pnpm migrate` against the development database.
- **Every other environment:** migrations in `migrations/`, created with `pnpm migrate:create <name>` and applied with `pnpm migrate` before the new build goes live. The initial migration creates all 46 tables and has been applied to a fresh database in tests.
- **Test database:** `pnpm test:e2e` recreates `<db>_test` from the migrations every run, then runs the homepage seed against it (`scripts/prepare-test-db.mjs`). It refuses non-local hosts and only targets names ending in `_test`. Uploads made in tests go to `.qa/test-media` (`MEDIA_DIR`), which is emptied with the database, so tests never write to `media/`.
- **Content seed:** `pnpm seed:homepage` (`scripts/seed-homepage.ts`, run through `payload run`) loads the approved homepage, its photographs and the records it features. It changes nothing once the Homepage global has been saved. In production run it once after `pnpm migrate`, with `NODE_ENV=production`.
- Drizzle is used only inside Payload's adapter. The prototype's own Drizzle/D1 setup was empty and has not been carried over, so Payload is the only owner of the schema.

## Homepage content

The frontend layout is dynamic (`force-dynamic`): every request reads published content, so a publish in `/admin` appears on the next page load, with no rebuild, cache tag or extra infrastructure. The header's Services and Solutions menus come from the published catalog on every page.

1. `lib/cms/homepage.ts` connects with `getPayload` and calls `readHomepage` (`lib/cms/homepage-state.ts`).
2. `readHomepage` reads the global and the service categories through the Local API with `overrideAccess: false` and `draft: false`, exactly as an anonymous visitor would. Drafts, and related records the visitor may not read (unpublished or deleted), never reach the page; Payload returns them as bare IDs and the mapper leaves them out.
3. `toHomepageView` (`lib/cms/homepage-view.ts`) turns the document into the plain view the unchanged `HomePage` component renders. A field published empty renders nothing; there are no per-field defaults.

| State | When | Visitors see | Logged |
| --- | --- | --- | --- |
| `published` | A published version exists (newer drafts are ignored) | The published content | No |
| `draft` | Drafts were saved but nothing was ever published | The approved content | Warning |
| `uninitialized` | The global was never saved (seed not run) | The approved content | Warning |
| `unavailable` | The database cannot be reached | The approved content | Error |

Any other error (access, validation, programming) is thrown rather than hidden behind the fallback. The approved content (`lib/cms/homepage-approved.ts`) is the prototype's copy verbatim; it is also what the seed publishes. A published homepage cannot be unpublished (a `beforeChange` hook refuses it through the admin and REST API), so once published the site never falls back to it except during a database outage.

## Services, solutions and portfolio content

`getCatalog()` (`lib/cms/catalog.ts`) reads the published service categories, services, solutions, portfolio entries and their media through the Local API as an anonymous visitor (`overrideAccess: false`, `draft: false`, depth 0). React's `cache` makes it one read per request, shared by the header menus, the page and its metadata. `toCatalog` (`lib/cms/catalog-view.ts`) resolves relationships against the published records only, so a link to an unpublished or deleted record simply disappears. Directory order comes from the solutions' **Directory order** field and the categories' number.

There is no fallback content for these pages. If the database cannot be reached the error is logged and the branded error page is shown, and the header keeps only its plain links (`getNavigationMenu` returns null). The approved catalog (`lib/cms/catalog-approved.ts`) is used only by the seed and the markup tests.

The sitemap (`app/sitemap.ts`, dynamic) lists the fixed pages plus every published record without **Hide from search engines**. Such records also get `noindex` metadata.

## Media storage

Uploads are stored on local disk in `media/` (gitignored; `MEDIA_DIR` overrides the directory, which the e2e suite uses), served through `/cms-api/media/file/*` with the collection's access rules. Production storage moves to **Cloudflare R2** through `@payloadcms/storage-s3` (R2 is S3-compatible); the variables are reserved in `.env.example`. Local disk is not suitable for multi-instance or ephemeral hosting.

## Security configuration

| Concern | Implementation |
| --- | --- |
| Authentication | Payload's built-in local strategy on the `users` collection. Sessions on (revocable), 8-hour token lifetime, lockout after 5 failed attempts for 15 minutes, 12-character minimum password on create/update. |
| Cookies | `payload-token`, HttpOnly, `SameSite=Lax`, `Secure` in production. |
| CSRF | `csrf: [serverURL]`. Cookie authentication from any other `Origin` is ignored (verified in tests). |
| CORS | `cors: [serverURL]` only. |
| Roles | `admin` (publish, delete, accounts) and `editor` (drafts only). See `docs/CMS_CONTENT_MODEL.md`. |
| Publishing | Access control decides who may edit. A `beforeOperation` guard requires every editor write, including version restores, to be a draft save. A `beforeChange` invariant ensures no write by a non-administrator can produce a published version. The homepage cannot be unpublished. |
| Drafts | Visitors only receive published documents. Asking for `?draft=true` never reveals a draft (verified in tests). |
| Uploads | JPEG, PNG, WebP and AVIF only (no SVG); 10 MB per file; alt text required; remote URL fetching (`pasteURL`) off; staff-only create, admin-only delete. |
| Indexing | Admin metadata `noindex, nofollow`, `X-Robots-Tag` on `/admin` and `/cms-api`, robots.txt rules. |
| Headers | `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, a restrictive `Permissions-Policy`, no `X-Powered-By`. |
| Abuse limits | `maxDepth: 4`, GraphQL off, Payload's 50 MB request cap and 10 MB file cap. |
| Telemetry | Payload telemetry disabled. |
| Secrets | `PAYLOAD_SECRET` (32+ characters, enforced at start-up), database URL and provider keys only in the environment. |
| Enquiry form | Unchanged: same-origin JSON, server validation, size limit, honeypot, timing check, Turnstile verification, Resend receipt required. |

Not yet in place (planned in Phase 2): a Content-Security-Policy, edge rate limiting for `/api/enquiry` and `/cms-api/users/login`, an email adapter for password resets (Payload currently logs emails to the console), and an R2 storage adapter.

## Environment variables

| Variable | Used by | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Payload | Runtime. |
| `PAYLOAD_SECRET` | Payload | Runtime and build. At least 32 random characters. |
| `NEXT_PUBLIC_SITE_URL` | Site metadata, enquiry origin check, Payload `serverURL`, CSRF and CORS | **Inlined at build time.** Build with the URL the deployment will serve. Falls back to `https://www.deltawave.tech`. |
| `NEXT_PUBLIC_INDEXABLE` | robots.txt and page metadata | `false` until a public launch is approved. Inlined at build time. |
| `ENQUIRY_EMAIL_API_KEY`, `ENQUIRY_FROM_EMAIL`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Enquiry endpoint | Unchanged from the prototype. |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | Local Docker database only | |

## Deployment consequences

The prototype was built for Cloudflare Workers through the OpenAI Sites integration. This application needs a **Node.js server** (`next build` then `next start`, or an equivalent container), a PostgreSQL database reachable from it, and object storage for media. Suitable targets include a VPS or container platform, or Vercel with managed PostgreSQL. No target has been chosen, configured or deployed. No DNS, hosting or repository change has been made.

A production release needs, in order: the database, `pnpm migrate`, a build with production environment values, then `next start`. Running migrations from the start command (Payload's `prodMigrations`) is possible on a long-lived server and is a Phase 2 decision.

## Rejected alternatives

| Alternative | Reason |
| --- | --- |
| Keep Vinext on Cloudflare Workers and add Payload | Vinext (1.0.0-beta.5) reimplements Next.js on Vite; Payload's admin depends on the real Next.js App Router (`withPayload`, server functions, `next/navigation` internals). Payload's PostgreSQL adapter needs TCP sockets and sharp needs native binaries, neither available in a standard Worker. Payload only documents Next.js runtimes. |
| Separate CMS app on a subdomain such as `cms.deltawave.tech` | Excluded by the brief. |
| Separate CMS app behind a same-origin reverse proxy | Two builds, two deployments and cookie and asset routing to maintain, with nothing gained over one app. |
| Hono, Better Auth or a custom CRUD backend | Payload already provides authentication, access control, REST and the admin UI. |
| Payload's default `/api` prefix | Shares a prefix with `/api/enquiry`; see above. |
| Payload 4 beta | Not stable. |
| GraphQL | Not needed; disabled to reduce attack surface. |
| Carrying over Tailwind CSS and the shadcn components | The prototype configured Tailwind but no stylesheet imported it, and none of its 55 shadcn components were used. They would add unused dependencies, and importing Tailwind's base styles would change the approved rendering. Add Tailwind utilities only when a component needs them, without Preflight. |
| `experimental.globalNotFound` | Experimental. Production builds already return a branded 404 through the frontend catch-all. |
| Converting site links to `next/link` | Changes the approved site from full-page to client-side navigation; deferred to Phase 2 as a deliberate decision (the lint rule is kept as a warning). |
