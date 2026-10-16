# Phase 1 report

Phase 1 ran on 2026-10-15 and 2026-10-16 on Windows 11 with Node.js 24.18.1, pnpm 11.25.0 (selected automatically from `packageManager`), Git 2.55 and Docker 29.7.2. Nothing was committed, pushed, deployed or published, and no DNS, hosting or external service was changed. No email was sent.

## Outcome

| Area | Status | Evidence |
| --- | --- | --- |
| Prototype audit | Done | `docs/PHASE1_AUDIT.md` |
| Reference folders untouched | Verified | SHA-256 manifests before and after are identical: `DeltaWave-Logo` (13 files), `DeltaWave-UI` (190 files); prototype Git HEAD `877751c` and status unchanged |
| Architecture | Implemented and verified | One Next.js 16.4.1 app; `/admin` and `/cms-api` coexist with `/api/enquiry` and all public routes (`docs/ARCHITECTURE.md`) |
| Public site preserved | Verified | 43 pages render; 12 representative pages are **pixel-identical** to the running prototype at 1600, 1440, 1024, 768, 390 and 320 px, and so are the open mega menus and the mobile menu |
| Payload CMS | Implemented and verified | Payload 3.90.2: 7 collections, 2 globals, roles, drafts and versions, audit fields |
| PostgreSQL | Verified locally | Own container `deltawave-postgres` (PostgreSQL 18.6); push mode in development; the initial migration builds all 46 tables on an empty database |
| Authentication | Verified | First-account creation, sign-in, wrong-password error, sign-out, session end, lockout after 5 failures, HttpOnly SameSite=Lax cookie, cross-origin cookie use refused |
| Branding | Verified | Lockup markup identical to the prototype; original files byte-identical; same geometry and pixels as the prototype at all six widths; CMS uses the same component |
| CMS theme | Verified | Manrope, square corners (no rounded visible element on 9 admin screens), white theme, blue and green accents, DeltaWave favicons and titles |
| Type checking, lint, tests, build | Passing | See "Checks" |
| Documentation | Done | Audit, architecture, branding, content model, this report, Phase 2 plan, README |

## Tasks

**A. Environment.** Working directory `Desktop/DeltaWave` (empty Git repository with an `origin` remote). Both reference folders present. Docker was installed but not running; Docker Desktop was started. A HonriseSol container and a Windows PostgreSQL 17 service were already present; neither was used or changed. Playwright 1.62.1 matches the Chromium build already cached on the machine, so no browser download was needed.

**B. Audit.** See `docs/PHASE1_AUDIT.md`, including eleven issues found in the prototype.

**C. Architecture validation.** Vinext and Cloudflare Workers cannot host Payload (see the rejected alternatives in `docs/ARCHITECTURE.md`). The standard Next.js runtime was validated with a production build, a production server, the admin, the REST API, authentication, the database and every public route.

**D. Project setup.** The prototype's site code was moved in unchanged except for the edits listed below. Its unused template scaffolding was left out. pnpm, scripts, `.gitignore`, `.env.example` and a secret generator were added. The repository was not committed (owner's instruction).

**E. Payload.** `payload.config.ts` and `cms/`: admin at `/admin`, REST at `/cms-api`, GraphQL off, PostgreSQL adapter, `users` with roles, `media` with upload restrictions, website content collections, the Homepage and Site settings globals, CSRF and CORS limited to the site origin, telemetry off.

**F. Database.** `docker-compose.yml` with a localhost-only port and named volume; credentials only in the untracked `.env`. Migration `migrations/20261015_172114_initial.ts` created and applied to the test database. Generating it exposed a real schema bug, fixed before release (see below).

**G. Frontend.** All routes, navigation, mega menus, the mobile menu, page content, photography, the footer, the contact form, metadata, sitemap and robots carried over. The parity suite proves the rendering matches.

**H. Shared branding.** `components/brand/` and `styles/` are the single source for the site and the CMS (`docs/BRANDING_SPEC.md`).

**I. Branded admin.** Lockup on the sign-in and first-account screens and in the sidebar, the icon in the header, DeltaWave theme, page titles and favicons, a short dashboard introduction that states the content is not yet connected to the live pages.

**J. Validation.** See below.

## Changes to prototype code

| File | Change | Why |
| --- | --- | --- |
| `app/*` → `app/(frontend)/*` | Moved into a route group | Lets the CMS have its own root layout |
| `app/(frontend)/globals.css` | Font faces, tokens and the four `.brand*` rules moved to shared files and imported at the top | One source for the site and the CMS; the site still ships one stylesheet |
| `app/(frontend)/layout.tsx` | Imports `globals.css` only | Same cascade as the prototype |
| `app/(frontend)/loading.tsx` | Removed | It made every static content page show "Loading your page…" for roughly 40 ms to 1.1 s before the content (measured on the prototype as well), and made the development server answer 200 for unknown pages. With plain links it is never needed. |
| `components/site/brand.tsx` | Renders the shared `BrandLockup` | Same markup, now shared with the CMS |
| `components/site/navigation.tsx` | Menus reset during render instead of in an effect; a bare ternary became `if`/`else` | Lint errors, no behaviour change |
| `components/site/contact.tsx` | `?service=` read with `useSyncExternalStore`; form start time set when the form mounts | Lint errors, same behaviour and identical first render |
| `components/site/pages.tsx` | Unused map index removed | Lint warning |
| `lib/site.ts` | Fallback URL is `https://www.deltawave.tech` | The old fallback was the Sites preview |
| `app/robots.ts` | `/admin` and `/cms-api` disallowed once indexing is enabled | Keep private routes out of search |
| `tests/*` | Paths updated, CSS imports stubbed for the Node renderer, the logo check fixed | The old logo check silently never ran |

## Problems found and fixed during Phase 1

1. **Enum collision.** A portfolio field named `status` produced the same PostgreSQL enum name as the drafts `_status` field, so its values were silently dropped from the migration. Renamed to `projectStatus`; migration regenerated.
2. **Editor publishing relied on undocumented behaviour.** An editor's draft save that asked to publish was turned into a draft by Payload rather than refused. Added a `beforeChange` invariant on every versioned collection and global so no non-administrator write can produce a published version, with unit and end-to-end tests.
3. **Wordmark rendering with split stylesheets.** With the lockup CSS in a separate stylesheet, Chromium re-shaped the 0.9-scaled wordmark about 8% narrower after a full-page capture (found by the parity suite at 1024 and 768 px). Isolated to the stylesheet split (not minification, JavaScript, zoom, resizing or scrolling). The site again ships one stylesheet and a test guards it.
4. **Loading flash on static pages.** See `loading.tsx` above.
5. **Unknown pages answered 200 in development.** Production always answered 404; the cause was `loading.tsx`.
6. **Select text and web-font timing.** On the contact page at 320 px the select's placeholder sat 1 px higher than on the prototype. Layout, computed styles and markup were identical; after a re-layout both rendered the same pixels. Chromium keeps a select's text position from before Manrope (`font-display: swap`) loaded, so this is load timing, not design. The parity test re-lays out selects on both sides; a metric-matched fallback font is planned (audit issue 11).
7. **Test harness issues** (no product impact): a socket reused by Playwright after the server rejected an 11 MB upload, React's hoisted image preload hint in rendered fragments, and a Git Bash path problem with `curl -F`.

## Checks

| Check | Command | Result |
| --- | --- | --- |
| Install | `pnpm install` | Passes; only `esbuild`, `sharp` and `unrs-resolver` may run install scripts |
| Types | `pnpm typecheck` | Passes |
| Lint | `pnpm lint` | 0 errors, 14 warnings (plain `<a>` navigation, a documented Phase 2 decision) |
| Unit tests | `pnpm test` | 44 of 44 pass (the prototype's 22 plus 22 new) |
| Server rendering | `pnpm test:render` | 43 pages and the 404 render |
| HTML inspection | `pnpm test:html` | 44 documents pass; 11 brand PNGs and 2 ELNATH files match the originals |
| Production build | `pnpm build` | Passes; 43 pages prerendered, admin and APIs dynamic |
| End to end | `PROTOTYPE_URL=… pnpm test:e2e` | 40 of 40 pass in 4.8 minutes: 17 CMS (interface and API security), 16 public site, 7 parity (12 pages at each of six widths, plus open menus) |
| Migration on an empty database | `scripts/prepare-test-db.mjs` | 46 tables created |
| Reference folders | SHA-256 manifests | Identical before and after |

The end-to-end suite covers: all 43 routes and real 404s; robots and sitemap; the enquiry contract (403 for foreign origins, 503 while unconfigured, no external calls); lockup proportions, square corners and no horizontal overflow at six widths; mega menus with Escape and focus return; the mobile menu; the industry filter and search; portfolio empty states; contact service preselection; the CMS screens, branding, corners, fonts and mobile layout; and the API security checks listed under "Outcome".

## Not done or not verifiable in Phase 1

- **Browsers.** Automated checks ran in Chromium only. Firefox and Safari were not tested.
- **Hover states.** Pixel comparisons cover pages at rest and menus opened by click or keyboard. Hover effects (link underlines, button and card hover colours, hover-to-open mega menus) were not compared. The CSS for them is unchanged from the prototype.
- **Prototype reference.** Parity was measured against the prototype's Vinext development server, not its production Worker build, which is no longer the deployment target.
- **Email.** Payload has no email adapter yet, so password-reset emails are only logged. The enquiry form stays disabled without Resend and Turnstile credentials. No email was sent.
- **Production.** No host, managed database, R2 bucket or deployment exists yet.
- **Hardening.** Content-Security-Policy, shared rate limiting and the enquiry client-IP header are planned in Phase 2.
- **Owner decisions.** ELNATH licence, privacy wording for the new hosting, plain links versus `next/link`, enquiry storage.
- **CMS content.** The CMS is empty; the public site still reads `lib/content.ts`. Seeding and switching the pages over is Phase 2.

The development database `deltawave` is empty. Opening `/admin` there asks you to create the first account. The test database `deltawave_test` holds throwaway test accounts and is recreated on every `pnpm test:e2e` run.

`next dev` writes an `AGENTS.md` file when it detects an AI coding tool. One was created during this work and removed. Set `agentRules: false` in `next.config.ts` to stop it.
