# Phase 1 audit of the prototype

Audited on 2026-10-15 from the local folders `Desktop/DeltaWave-UI` (Git commit `877751c`, clean working tree) and `Desktop/DeltaWave-Logo`. Both were treated as read only; SHA-256 manifests taken before and after the work show them unchanged (see `docs/PHASE1_REPORT.md`).

## What the prototype is

A Next.js-style App Router site run through **Vinext 1.0.0-beta.5** (a Vite 8 reimplementation of Next.js) and deployed as a **Cloudflare Worker** through the OpenAI Sites integration (`.openai/hosting.json`, `build/sites-vite-plugin.ts`, connector preview workers, `app/chatgpt-auth.ts`). It ran correctly in that environment: the scratchpad copy started with `vinext dev` and served every page.

## Routes (verified)

43 content pages, a custom 404, `/api/enquiry`, `/sitemap.xml` and `/robots.txt`:

| Group | Count | Source |
| --- | --- | --- |
| Main pages: `/`, `/about`, `/services`, `/solutions`, `/portfolio`, `/academy`, `/contact`, `/privacy` | 8 | `app/page.tsx`, `app/[...slug]/page.tsx` |
| Services `/services/*` | 18 | `lib/content.ts` `services` (4 are category overview pages) |
| Industry solutions `/solutions/*` | 15 | `lib/content.ts` `solutions` |
| Portfolio `/portfolio/*` | 2 | `lib/content.ts` `projects` (both planned concepts) |

`allPaths` in `lib/content.ts` drives `generateStaticParams`, the sitemap and the tests. All 43 render in the new application with HTTP 200, and unknown paths return a branded 404.

## Code that matters

| Area | Files | Notes |
| --- | --- | --- |
| Layout and metadata | `app/layout.tsx`, `lib/metadata.ts` | Organisation JSON-LD, canonical URLs, Open Graph, PNG icons, robots from `NEXT_PUBLIC_INDEXABLE` |
| Navigation | `components/site/navigation.tsx` | Client component: desktop mega menus (hover with 160 ms close delay, click, ArrowDown, Escape returns focus, outside click), mobile menu with independent submenus, closes when crossing 1120 px |
| Page compositions | `components/site/pages.tsx` | All page copy for Home, About, Services, Solutions, Portfolio, Academy, Contact and Privacy is written in JSX |
| Shared pieces | `components/site/shared.tsx` | Button and text links, eyebrow, responsive `<picture>` photos (WebP 640/1100/full with JPEG fallback), section heads, breadcrumbs, project CTA, footer |
| Directories | `components/site/directories.tsx` | Industry filter and search, portfolio filters with honest empty states |
| Contact | `components/site/contact.tsx`, `lib/enquiry.ts`, `app/api/enquiry/route.ts` | See below |
| Content | `lib/content.ts`, `lib/site.ts` | 4 categories, 18 services, 15 solutions, 2 projects; contact details and the seven-item navigation |
| Styles | `app/globals.css` (3,635 lines) | Plain CSS with design tokens, a global `border-radius: 0 !important`, breakpoints at 1600, 1250, 1119, 850, 650 and 370 px, and reduced-motion rules |

**Runtime dependencies actually used by the site:** `next`, `react`, `react-dom` and `lucide-react`. Nothing else.

## Enquiry backend

Same-origin JSON only; field validation on the server; 16 KB streamed body limit; honeypot; minimum and maximum form age; Cloudflare Turnstile verified on the server with hostname and action checks; Resend delivery to a fixed inbox with a plain-text body; success only with a provider receipt; an in-memory limit of 5 attempts per 15 minutes per IP (per instance, not distributed). Without credentials it fails closed with 503 and the form says online enquiries are being prepared. It is carried over unchanged and all 18 of its tests pass.

## Tests in the prototype

- `tests/enquiry.test.mjs` (18) and `tests/content.test.mjs` (4) on the Node test runner.
- `tests/render.mjs`: server-renders all 43 pages and the 404 to `.qa/`.
- `tests/inspect_html.py`: one `h1` per page, valid internal links and image sources, label targets, unique IDs and metadata, plus CSS checks.
- No browser testing had been done (`docs/DELIVERY.md` says so).

## Scaffolding not carried over

Not used by any page: 55 shadcn components in `components/ui`, `hooks/use-mobile.ts`, `lib/utils.ts`, the connector libraries, `components/connector-error.tsx`, `app/chatgpt-auth.ts`, the empty D1/Drizzle setup (`db/`, `drizzle/`, `drizzle.config.ts`, `examples/d1`), `vendor/shadcn-tailwind`, the Sites build plugins and scripts, `vite.config.ts`, `cloudflare-env.d.ts` and `components.json`. Tailwind CSS 4 was configured in PostCSS but no stylesheet imported it. `public/favicon.svg`, `file.svg`, `globe.svg` and `window.svg` are generic template icons, not DeltaWave artwork, and were not referenced by the layout.

## Issues found

| # | Finding | Resolution |
| --- | --- | --- |
| 1 | `public/brand/deltawave_corporate_blue_4096px.png` and `..._8192px.png` in the prototype are **2048×2048 re-encodes with metadata removed**. `docs/DELIVERY.md` says all logo PNGs were kept unchanged. | The new project copies all 11 PNGs directly from `DeltaWave-Logo`; a test now checks every byte. Neither file is referenced by a page. |
| 2 | The logo byte check in `tests/inspect_html.py` pointed at a path from the original authoring sandbox, so it silently skipped while still reporting "Uploaded logo bytes unchanged". | Now compares against `DeltaWave-Logo` and says plainly when the comparison could not run. |
| 3 | The prototype's own lint run reports 20 problems (17 errors): 14 internal `<a>` links, two setState-in-effect calls, one impure call during render, an unused expression, an unused variable and one `<img>`. | Five fixed without behaviour change (see the report). The 14 anchor findings stay as visible warnings: switching to `next/link` changes navigation behaviour and is a Phase 2 decision. The brand `<img>` keeps a justified exception. |
| 4 | `lib/site.ts` fell back to the Sites private preview URL when `NEXT_PUBLIC_SITE_URL` was unset. | Falls back to `https://www.deltawave.tech`, the canonical domain. |
| 5 | The privacy notice says access "to this private preview is managed by the hosting platform". | Unchanged. Needs owner review before launch, because the hosting will change. |
| 6 | The enquiry rate limit is per instance. | Unchanged; edge or shared rate limiting is planned (Phase 2). |
| 7 | ELNATH's name table contains no licence text (© 2021 Mohamed Husman). The font files are served publicly from `/fonts/`. | Owner to confirm web-embedding rights. |
| 8 | On the Next.js dev server only, unknown paths answered 200 with the not-found page, because `loading.tsx` started streaming first. Production builds answered 404, matching the prototype. | Resolved by removing `loading.tsx` (issue 10). |
| 9 | The enquiry rate limit and Turnstile `remoteip` read Cloudflare's `cf-connecting-ip` header. On a Node host that is not behind Cloudflare the header is missing, so every visitor shares one `unknown` bucket: five enquiries in 15 minutes would block everyone. | Unchanged while the host is undecided (the form is not enabled yet). Phase 2 derives the client IP from the chosen host's trusted proxy header before enquiries are switched on. |
| 10 | Every static content page first painted "Loading your page…" (`loading.tsx` wrapping an async page) for roughly 40 ms to 1.1 s before the content appeared. Measured on the prototype and on the first build of this project. | `loading.tsx` removed; the content is now in the initial HTML (heading visible 57 to 116 ms after navigation in the same measurement). |
| 11 | Manrope uses `font-display: swap`. If a native `<select>` is laid out before Manrope arrives, Chromium keeps the fallback font's vertical text position until the next re-layout: its placeholder text sits 1 px off. Timing-dependent; seen on the contact page at 320 px. | Not a design difference; documented. A metric-matched fallback font, which removes the shift, is planned for Phase 2. |

## Reused as is

All public pages and components, `lib/content.ts`, `lib/enquiry.ts`, `lib/metadata.ts`, the enquiry route, `robots.ts`, `sitemap.ts`, the photography, the Manrope files and licence, the WOFF2 web font, and the prototype tests. Changes to the prototype code are limited to those listed in `docs/PHASE1_REPORT.md`.
