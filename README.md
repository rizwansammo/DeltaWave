# DeltaWave Technology

The DeltaWave Technology corporate website and its Payload CMS, in one Next.js application.

- Public site: `/` and 42 content pages (production domain `https://www.deltawave.tech`)
- CMS: `/admin` on the same origin, with Payload's REST API at `/cms-api`
- Enquiry endpoint: `/api/enquiry`

Stack: Next.js 16.4.1, React 19.2.9, Payload 3.90.2, PostgreSQL 18, TypeScript, pnpm. See `docs/ARCHITECTURE.md`.

## Requirements

- Node.js 22.13 or later (developed on 24.18.1)
- pnpm 11 (the repository pins 11.25.0 through `packageManager`; Corepack or pnpm itself will switch to it)
- Docker Desktop, for the local PostgreSQL container

## First run

```bash
pnpm install
pnpm setup:env      # creates .env with a random database password and Payload secret
pnpm db:up          # starts deltawave-postgres on 127.0.0.1:54330
pnpm seed           # loads the approved content into the CMS (safe to repeat)
pnpm dev            # http://localhost:3000
```

Then open `http://localhost:3000/admin`. On an empty database Payload asks for the first account, which always becomes an Administrator. Use `localhost` rather than `127.0.0.1`: cookie sign-in only works from the origin in `NEXT_PUBLIC_SITE_URL`.

The homepage, page content, service categories, services, industry solutions, portfolio and standalone pages are edited under **Website content** in the admin; business details, the header call to action and the footer under **Media & settings → Site settings**. Staff can preview a draft in the real design with the **Preview** button or Payload's Live Preview. Published changes appear on the next page load. Until the homepage has been published (by the seed or an administrator) the site shows the approved prototype homepage and logs a warning; the services, solutions and portfolio pages show only published records.

In development Payload keeps the database schema in sync automatically (push mode). Do not run `pnpm migrate` against the development database.

## Everyday commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm typecheck` | TypeScript |
| `pnpm lint` | ESLint (the 14 warnings are a documented decision about plain links) |
| `pnpm test` | Unit tests: enquiry, content, brand, access control, routing, homepage content |
| `pnpm seed` | `seed:content`, `seed:pages`, then `seed:homepage`: the approved content for an empty CMS. In production, run it once after `pnpm migrate` with `NODE_ENV=production` |
| `pnpm seed:content` | Import the approved service categories, services, industry solutions and portfolio entries with their relationships, in one transaction. Reuses existing records, never changes records people have edited (it lists them for review), and changes nothing once services exist |
| `pnpm seed:pages` | Publish the approved site settings, page content and privacy notice. Each piece is written only while it has never been saved in the CMS |
| `pnpm seed:homepage` | Publish the approved homepage, its photographs and featured records into the CMS. Changes nothing once the Homepage has been saved. In production, run it once after `pnpm migrate` with `NODE_ENV=production` |
| `pnpm test:render` then `pnpm test:html` | Server-render every page and inspect the HTML (needs Python 3) |
| `pnpm build` then `pnpm test:e2e` | Browser and API tests against the production build and a disposable `deltawave_test` database, recreated and seeded each run (test uploads go to `.qa/test-media`) |
| `pnpm generate:types` / `pnpm generate:importmap` | Regenerate Payload types and the admin import map after schema or admin component changes |
| `pnpm migrate:create <name>` | Create a migration after a schema change |
| `pnpm migrate` | Apply migrations (staging and production databases) |
| `pnpm db:stop` / `pnpm db:logs` | Stop the database container / follow its logs |

`pnpm test:e2e` uses port 3000, so stop `pnpm dev` first. To also compare every page with the approved prototype pixel by pixel, start the prototype (DeltaWave-UI) and run:

```bash
PROTOTYPE_URL=http://127.0.0.1:5173 pnpm test:e2e
```

Screenshots are written to `.qa/screenshots`; comparison images for failures go to `test-results/`.

## Project layout

| Path | Contents |
| --- | --- |
| `app/(frontend)/` | Public site routes, layout and stylesheet (from the prototype) |
| `app/(payload)/` | Payload admin, REST API route and the DeltaWave admin theme (`custom.scss`) |
| `app/api/enquiry/` | Enquiry endpoint |
| `components/site/` | Public site components (from the prototype) |
| `components/brand/` | The shared DeltaWave lockup and its CSS |
| `components/cms/` | Admin branding components |
| `cms/` | Payload collections, globals, access control and shared fields |
| `lib/` | Site content and configuration, enquiry handling, metadata; `lib/cms/` reads the homepage from Payload |
| `scripts/` | Environment setup, test database preparation and the homepage seed |
| `migrations/` | Database migrations |
| `styles/` | Shared font faces and design tokens |
| `public/` | Original brand files, fonts and photography |
| `tests/` | Unit, render and HTML tests; `tests/e2e/` for Playwright |
| `docs/` | Audit, architecture, branding, content model, reports and plans |

## Configuration

`pnpm setup:env` creates `.env`; `.env.example` lists every variable. Never commit `.env`. `NEXT_PUBLIC_SITE_URL` is inlined at build time; `SITE_INDEXABLE`, SMTP, Turnstile and R2 settings are read at runtime. Online enquiries stay closed until the Turnstile keys are set and an administrator switches them on in **Site settings → Email & enquiries**. Production runs from the GHCR image on the VPS; `docs/PHASE3_REPORT.md` covers deployment, backups and operations.

## Documents

- `docs/PHASE1_AUDIT.md`: what the prototype contained and the issues found
- `docs/ARCHITECTURE.md`: routes, runtime, database, security and rejected alternatives
- `docs/BRANDING_SPEC.md`: the logo and wordmark specification
- `docs/CMS_CONTENT_MODEL.md`: collections, globals, roles and workflow
- `docs/PHASE1_REPORT.md`: what was done and verified in Phase 1
- `docs/PHASE2A_REPORT.md`: the CMS-driven homepage (Phase 2A)
- `docs/PHASE2B_REPORT.md`: CMS-driven services, solutions, portfolio and menus (Phase 2B)
- `docs/PHASE2CD_REPORT.md`: the remaining corporate pages, site settings and draft preview (Phase 2C + 2D)
- `docs/PHASE3_REPORT.md`: production deployment, stored enquiries, email and operations (Phase 3)
- `docs/PHASE2_PLAN.md`: the rest of Phase 2
- `docs/IMAGE_CREDITS.md`: photography and font licences
