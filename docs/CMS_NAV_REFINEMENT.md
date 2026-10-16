# DeltaWave CMS navy sidebar — UI refinement after Phase 2A

This task changes **only the Payload admin navigation presentation**. The user-approved
reference is a deep-navy sidebar beside a light dashboard. It is a DeltaWave-branded
interpretation, not a copy of the Honrise Solutions CMS.

## What changed

- Deep Navy (#132B46) sidebar, pale labels, green active indicator, hover states
  and clear uppercase navigation group headings.
- The original `BrandLockup` is **reused** at full 224 × 40 geometry. Its existing
  PNG is displayed in white with a CSS filter on the dark surface and ELNATH
  wordmark text is shown in white. The files, SVG text positions and kerning
  have **not been changed**.
- Overview at top; Homepage is first inside Website content; service categories,
  services, industry solutions, portfolio and pages stay in Payload's native
  permission-filtered navigation.
- Media and Site settings appear together in Media & settings.
- Accounts remains in Administration. Bottom links: View website and My account.
  Payload's existing sign-out, collapsible groups, focus handling and mobile drawer
  remain active.

## Implementation boundary

**No custom Nav replacement.** Payload v3.90.2's built-in Nav remains in charge
of authorization, native navigation and responsive behavior. The small additions
are `SidebarOverview` and `SidebarUtilities` through
`admin.components.beforeNavLinks` / `afterNavLinks`, plus scoped styles in
`app/(payload)/custom.scss`. The generated admin import map was updated for the
two new components. Labels were grouped using `admin.group`, which affects only
admin navigation — not schemas, routes, public rendering or database content.

The original `components/brand/*`, the ELNATH font files, Public Site styles,
Homepage CMS integration and permissions are unchanged. There is no database
migration and no dependency update.

## Local check after pulling

1. Run `pnpm dev`, open `http://localhost:3000/admin` and log in.
2. Confirm the deep-navy sidebar, white DeltaWave lockup, green selected row
   and light main workspace.
3. Open Overview, Homepage, Services, Media library, Site settings and My account.
   Confirm the correct page loads and the native section groups collapse/expand.
4. Use View website and the existing Logout control.
5. At 390 px, open and close Payload's mobile navigation, then open Homepage.
6. If generated admin component imports look stale, run `pnpm generate:importmap`
   and restart the development server.
7. Run `pnpm typecheck`, `pnpm lint` and the existing targeted Playwright
   CMS tests. The dashboard test now checks branded navigation and its links.

## For Claude Code continuing Phase 2B

**Do not rebuild or redesign the DeltaWave admin sidebar.** This standalone
post-2A UI refinement is complete in GitHub. Keep `admin.components`,
`app/(payload)/custom.scss` and the admin grouping intact when adding collections.
New collections should join the appropriate existing `admin.group`. Phase 2B
is for public CMS content integration only.

Validation note: changes were authored through GitHub, not against the user's
running Windows development server. Local build/browser confirmation after pull
is still required; do not mark those checks as executed until run.

## Follow-up: flush-top branding and border-mounted collapse control

The empty space above the lockup was Payload's built-in nav padding reserved
for the desktop NavToggler. The fix reduces that padding to 18 px and positions
the **same native collapse control** across the right edge of the sidebar.
Its arrow SVG, Payload state, keyboard activation and open/closed preference
are not reimplemented. In the closed state it stays inside the left edge of
the content area, so the control can reopen the sidebar. At 768 px and below,
the desktop control is hidden and Payload's existing mobile header toggle
remains responsible for showing and dismissing the nav.

Scoped CSS in `app/(payload)/custom.scss` only. This change does not modify
the lockup's source assets, Wordmark geometry, content layout or database.

## Follow-up: white browser tab favicons

The owner requested white, high-contrast favicons for **both** the public site
and the Payload CMS because navy disappeared against dark browser chrome.

- Added exact alpha-mask-preserving white variants of the owner's approved
  16, 32 and 48 px *optical* favicon artwork in `public/brand/`.
- The original blue optical variants are unchanged and remain available.
- `public/favicon.png` is the white 32 px variant. Both the frontend metadata
  and CMS `admin.meta.icons` point to the white favicons.
- The 256 px Apple Touch Icon remains blue intentionally: it is a separate
  launcher icon designed for a light background, not a dark browser tab.
- `tests/brand.test.mjs` checks that every white favicon has exactly the
  original alpha silhouette and opaque artwork is white.
- The 32 px URL has a version suffix to invalidate the old blue favicon cache.

### After pulling

Open a fresh browser tab on both `/` and `/admin` to see the white icon
against dark browser UI. Use a forced refresh / private window if a cached
fav icon remains navy. On desktop collapse the nav and reopen it, then check
the 390 px mobile menu. The GitHub edit itself did not execute the owner's
browser tests; run the focused checks locally.
