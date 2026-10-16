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
pnpm dev            # http://localhost:3000
```

Then open `http://localhost:3000/admin`. On an empty database Payload asks for the first account, which always becomes an Administrator. Use `localhost` rather than `127.0.0.1`: cookie sign-in only works from the origin in `NEXT_PUBLIC_SITE_URL`.

In development Payload keeps the database schema in sync automatically (push mode). Do not run `pnpm migrate` against the development database.

## Everyday commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm typecheck` | TypeScript |
| `pnpm lint` | ESLint (the 14 warnings are a documented decision about plain links) |
| `pnpm test` | Unit tests: enquiry, content, brand, access control, routing |
| `pnpm test:render` then `pnpm test:html` | Server-render every page and inspect the HTML (needs Python 3) |
| `pnpm build` then `pnpm test:e2e` | Browser and API tests against the production build and a disposable `deltawave_test` database |
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
| `lib/` | Site content and configuration, enquiry handling, metadata |
| `migrations/` | Database migrations |
| `styles/` | Shared font faces and design tokens |
| `public/` | Original brand files, fonts and photography |
| `tests/` | Unit, render and HTML tests; `tests/e2e/` for Playwright |
| `docs/` | Audit, architecture, branding, content model, reports and plans |

## Configuration

`pnpm setup:env` creates `.env`; `.env.example` lists every variable. Never commit `.env`. `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_INDEXABLE` are inlined at build time, so build with the values of the environment you deploy to. Online enquiries stay disabled until the Resend and Turnstile variables are set (`docs/prototype/DELIVERY.md` explains them).

## Documents

- `docs/PHASE1_AUDIT.md`: what the prototype contained and the issues found
- `docs/ARCHITECTURE.md`: routes, runtime, database, security and rejected alternatives
- `docs/BRANDING_SPEC.md`: the logo and wordmark specification
- `docs/CMS_CONTENT_MODEL.md`: collections, globals, roles and workflow
- `docs/PHASE1_REPORT.md`: what was done and verified in Phase 1
- `docs/PHASE2_PLAN.md`: the next phase
- `docs/IMAGE_CREDITS.md`: photography and font licences
