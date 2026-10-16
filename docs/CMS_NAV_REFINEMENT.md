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
