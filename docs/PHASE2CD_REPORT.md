# Phase 2C + 2D report: the remaining corporate pages, site settings and draft preview

Phase 2C puts the last hardcoded editorial content into Payload. Phase 2D adds a secure draft preview and Payload's own Live Preview. The approved design is unchanged: all 44 rendered documents are byte-identical to the pre-2C markup.

## Phase 2C — completed

- **About** (`/about`): hero, photograph and caption, "Who we are" (lead and paragraphs), vision, mission, the three numbered principles, "Our direction" with its link, and the closing call to action. The principles and direction sections can be hidden.
- **Academy** (`/academy`): hero with its green accent line, the honest status label, "The intention", the three learning areas with their topic lists, and the closing section with its button. Each section below the hero can be hidden. The field help states that courses, fees, instructors and dates may only be named once confirmed; nothing in the model implies the Academy is open.
- **Contact** (`/contact`): hero, the enquiry section heading, the text beside the business details, the closing note and "What happens next". The form itself, its validation, Turnstile handling, error messages and failure behaviour are untouched; it still refuses to claim success when the email provider is not configured.
- **Privacy** (`/privacy`): now a record in the existing **Pages** collection, edited with Payload's Lexical editor. Any other published page gets its own address the same way; unpublished or deleted ones are real 404s.
- **Directory introductions**: the hero, opening note, status note and closing call to action of `/services`, `/solutions` and `/portfolio`. The records and listings themselves are unchanged from Phase 2B.
- **Search wording**: every page has its own *Search & sharing* title and description, seeded with the values the site already published.

## Phase 2D — completed

- **Secure draft preview.** `/api/preview?path=…` checks the CMS session with `payload.auth` and refuses anyone who is not staff (401). Only then does it turn on Next.js draft mode and redirect. Every page re-checks the account on each request (`lib/cms/preview.ts`): draft content is served **only** when draft mode is on *and* the request carries a staff session, so a leaked preview cookie on its own shows published content. Draft reads run as that account through normal access control (`overrideAccess: false`), never through a bypass.
- **Safe destinations.** The preview link only accepts a path on this website; absolute URLs, `//host`, `/admin` and `/api` are refused with 400, so it cannot be used as an open redirect.
- **Not indexed, not cached.** Any response carrying the draft-mode cookie gets `X-Robots-Tag: noindex, nofollow` and `Cache-Control: private, no-store` (one rule in `next.config.ts`).
- **Visible and reversible.** A fixed bar marks the page as a draft preview and links to `/api/preview/exit`, which turns draft mode off and returns to the published page.
- **Live Preview.** Payload's native `admin.livePreview` is configured for the homepage, page content, site settings, pages, services, solutions, portfolio entries and service categories, with **Desktop 1440×900** and **Mobile 390×844** widths. The page refreshes itself when the document is saved (`components/site/live-preview-refresh.tsx`, ~25 lines, no new dependency), so the preview is the real server-rendered page rather than an approximation. Changes are previewable after **Save draft** — no publishing needed.
- **Preview buttons** appear on all of the above in the admin.

## Site settings now drive the website

| Setting | Where it is used |
| --- | --- |
| Site name | Page titles, sharing cards, footer copyright, contact details heading, organization data |
| Tagline | Default search description |
| Email, phone, display phone | Footer, contact page, enquiry delivery inbox, organization data |
| Business location | Footer, contact page |
| Website as displayed | Contact page link |
| Structured address | Organization data (search listing) |
| Social links | `sameAs` in organization data (https only, complete rows only) |
| Header call to action | The header button (hidden if either half is empty) |
| Footer statement, location label, caption, closing link | The footer |
| Search defaults | Title and description fallbacks, default sharing image |

The public origin still comes from `NEXT_PUBLIC_SITE_URL`; an editor cannot change where the site lives.

**Enquiry form options** are the published service category titles plus *Academy interest* and *Other*. The browser list and the server validation use the same list, so they cannot drift; if the database is unreachable the approved titles are used and the error is logged.

## Content models

Reused, unchanged in structure: `Pages`, `ServiceCategories`, `Services`, `Solutions`, `PortfolioProjects`, `Media`, `Homepage`.

| Model | Change |
| --- | --- |
| **Page content** (new global, `page-content`) | One global with a tab per page: About, Academy, Contact, Services directory, Solutions directory, Portfolio directory. Keeps the admin navigation short. |
| **Site settings** (existing global) | Added a structured address group, a footer location label, and help text on every field. |
| **Pages** (existing collection) | Unchanged; now the source of `/privacy` and of any further standalone page. |

Shared field shapes live in `cms/editorial.ts` (eyebrow, multi-line heading, paragraph list, image, link, hero, call to action, visibility toggle, search wording). Migration `20261016_184142_phase2cd_pages_and_settings` is additive; it drops nothing on the way up.

## Seeding

`pnpm seed` runs three steps, none of them on application start:

1. `pnpm seed:content` — service categories, services, solutions, portfolio entries (Phase 2B).
2. `pnpm seed:pages` — site settings, page content and the privacy notice (**new**).
3. `pnpm seed:homepage` — the homepage (Phase 2A).

Each piece is written only while it has never been saved in the CMS; after that it belongs to its editors and is reported as "already saved". Nothing is overwritten, nothing is duplicated, no user or collection is reset. The privacy notice is converted from the approved source to Lexical by `lib/cms/lexical.ts`, which the markup test also uses — so what is seeded is exactly what the page renders.

## How to edit

- **Corporate pages:** Website content → **Page content**, then the tab for the page. Press Enter inside a heading for a line break. "Show this section" hides a section and keeps its content.
- **Privacy and other standalone pages:** Website content → **Pages**.
- **Business details, header and footer:** Media & settings → **Site settings**.
- **Images:** every image field opens the media library, where you can upload (JPEG, PNG, WebP or AVIF, up to 10 MB), pick an existing image, set the focal point and edit alternative text and credit. Alternative text is required. If an image is deleted, the section simply renders without it.
- **Preview a draft:** Save draft, then **Preview** (or open Live Preview and use the Desktop/Mobile widths). The draft is visible only to signed-in staff; a bar at the foot of the page says so and exits.
- **Publish:** an administrator uses **Publish changes**. The public page updates on the next load, with no rebuild.

## Tests actually executed

| Check | Result |
| --- | --- |
| `pnpm typecheck` | Passes |
| `pnpm lint` | 0 errors, the same 14 documented warnings |
| `pnpm test` | 74 of 74 pass (7 new in `tests/pages.test.mjs`) |
| `pnpm test:render` | 43 pages and the 404 render; **all 44 documents byte-identical** to the approved markup, privacy notice included |
| `pnpm build` | Passes |
| Browser suite: `cms`, `homepage`, `public-site`, `site-content`, `site-pages` | **62 of 62 pass** in 2.9 minutes (11 new) |
| Visual comparison with the prototype at 1440 px and 390 px | 11 of 12 pages pixel-identical at both widths; `/privacy` differs by 1 pixel at 1440 and 6 at 390 (0.01% — see limitations) |
| Seed run twice, and against an already-seeded database | Nothing changed, no duplicates, existing content kept |

New browser tests (`tests/e2e/site-pages.spec.ts`): the three corporate pages render published content; the privacy notice renders safely from rich text; **stored rich text cannot inject markup or an unsafe link**; site settings drive the header, footer, contact details and organization data; page content drafts stay private until published; a standalone page can be unpublished and is then a 404 and leaves the sitemap; **preview is refused without a CMS session and cannot redirect off-site**; **staff see drafts but a leaked preview cookie shows nothing**; an editor can preview but still cannot publish; the admin offers the preview button and live preview.

New unit tests (`tests/pages.test.mjs`): preview path validation, mapping without defaults, hidden sections keeping their content, the Academy's honest status, settings mapping, the privacy notice's round trip through Lexical, and the rich-text whitelist.

**Not executed:** the full six-width, 43-page pixel matrix (out of scope for this phase); browsers other than Chromium; hover states; any production or staging deployment.

## Known limitations

- **`/privacy` differs from the prototype by 1 pixel at 1440 px and 6 at 390 px** (0.01% of pixels, inside letterforms). The markup is byte-identical, so this is glyph antialiasing where the text node boundaries moved from JSX to rich text. The parity assertion was left at zero tolerance rather than weakened; it is the only page affected.
- The enquiry form's own labels ("Project enquiry", field names) and the footer's "Explore" heading stay in code: they are interface, not editorial copy.
- Live Preview refreshes when the document is saved (including **Save draft**), not on every keystroke. Field-level live rendering would need Payload's client-side live preview package.
- Every public page reads the database on each request. That is simple and immediate at this size; cache tags with publish hooks are the next step if traffic needs them.
- While the database is unreachable the site settings fall back to the approved values (logged) so the header, footer and error page still render; every other page shows the error page rather than stale copy.
- **Wording for the owner's review:** the privacy notice names Cloudflare Turnstile and Resend as processors and refers to "this private preview" being managed by the hosting platform. Both depend on Phase 3 decisions and should be reviewed before launch. No legal wording was rewritten in this phase.

## Phase 3 prerequisites

The roadmap division now reads:

- **Phase 2 (local, complete):** content management, editorial control, publishing workflow, secure drafts and previews, media management.
- **Phase 3 (needs external accounts and credentials):** Cloudflare R2 media storage, production hosting and database, email delivery (password resets and enquiries), DNS, Content-Security-Policy and shared rate limiting, backups and restore drills, deployment.

**R2 boundary.** Media still uses local disk (`MEDIA_DIR`, default `media/`). Moving to R2 means installing `@payloadcms/storage-s3`, setting the bucket, endpoint and keys reserved in `.env.example`, and re-uploading existing files. It was not imitated here because it cannot be verified without real credentials. Nothing else in the media model needs to change.
