# Phase 2A report: the CMS-driven homepage

Phase 2A connects the public homepage to the Payload Homepage global. It does not change the approved design.

## Outcome

- **The homepage renders from the published CMS content on every request.** A publish in `/admin` is visible on the next page load, with no rebuild and no cache to purge.
- **The approved design is preserved exactly.** With the seeded content, the CMS-rendered homepage has the same markup as the prototype: every section, class and line of copy. Only the image addresses differ, now pointing to the media library. The page also matches the prototype pixel for pixel at all six tested widths, including 1440, 390 and 320 px.
- **All nine sections are editable.** The sections are hero, introduction, services, industries, engineering, portfolio, approach, academy and contact. Editors control copy, links, images, featured items and section visibility. The service list follows the published service categories. Featured industry solutions and portfolio entries are live CMS records.
- **Visitors only ever see published content.** Drafts and unpublished or deleted related records never reach the page. A field published empty renders nothing, never an approved default.
- **The homepage has four explicit states:** published, draft, uninitialized and unavailable. The approved content is used only before the first publication and during a database outage, and each use is logged.
- **The seed is safe to repeat and never overwrites editors' work.** `pnpm seed:homepage` publishes the approved homepage with its photographs and featured records. Once the homepage has been saved in the CMS it changes nothing.
- **The editor workflow now works in the admin.** Phase 1 left editors with read-only forms in the admin. Editors now prepare drafts there, administrators review and publish, and the server still refuses any editor publish (details below).

## Features

**Data layer (`lib/cms/`).**

- `homepage.ts` connects with `getPayload` and delegates to `homepage-state.ts`.
- `homepage-state.ts` makes two Local API reads with `overrideAccess: false` and `draft: false`, exactly as an anonymous visitor: the Homepage global (depth 2, with only the needed fields of media, solutions and portfolio entries) and the published service categories.
- `homepage-view.ts` turns the document into the plain view that the unchanged `HomePage` component renders. Line breaks typed by an editor become line breaks. A link needs both a label and a destination. Unreadable relations are left out.
- `errors.ts` recognises an unreachable database: connection error codes, PostgreSQL connection and shutdown codes, and wrapped causes.

**States.**

| State | When | Visitors see | Logged |
| --- | --- | --- | --- |
| `published` | A published version exists; newer drafts are ignored | The published content | No |
| `draft` | Drafts were saved but nothing was ever published | The approved content | Warning |
| `uninitialized` | The homepage was never saved | The approved content | Warning, suggesting `pnpm seed:homepage` |
| `unavailable` | The database cannot be reached | The approved content | Error |

Any other failure (access, validation, a programming error) is thrown, not hidden behind the fallback.

**"Never initialized" means never published.** The brief allows the approved content only when the CMS has never been initialized. A homepage that has drafts but was never published has never been initialized for visitors, so it shows the approved content. Unpublishing a homepage that was once published is refused, so published content is never replaced by the defaults.

**The homepage cannot be unpublished.** A live save with the draft status (the admin's **Unpublish**) and restoring a draft version as the live one are both refused with: "The homepage cannot be unpublished. Hide individual sections, or publish a new version instead."

**Section visibility.** Every section except the hero has **Show this section**. Hidden sections keep their content. Hiding the introduction also hides the hero's scroll link to it.

**Related records.**

- Featured industries (up to six) and portfolio entries (up to two) appear in the chosen order, numbered continuously.
- An unpublished or deleted record is left out.
- A deleted image disappears from its section without leaving a broken image.

**Seed (`scripts/seed-homepage.ts`, `pnpm seed:homepage`).**

- **What it creates.** The five homepage photographs (with alt text and credits), the four service categories, the six featured solutions, the two portfolio entries and the published Homepage global.
- **Idempotent.** Records are matched by slug (photographs by file name) and only created when missing, so an interrupted run can be repeated without duplicates.
- **Non-destructive.** Existing records are never modified. Once the Homepage global has any version, the seed does nothing at all.
- **Approved image files.** Each photograph is uploaded from its full-size WebP master, and the approved prototype files are installed in place of Payload's re-encoded original and matching sizes. The seeded site therefore serves the approved images byte for byte.

**Admin.**

- Editor help text for every Homepage field.
- **Publish changes** is shown to administrators only (`AdminPublishButton` on globals; access control on collections).
- The dashboard note now says the homepage is live from the CMS.

**Media.**

- The `large` size (1800 px) is never enlarged. A narrower photo gets a full-size WebP there instead, so high-density screens get the whole image, as in the prototype.
- `MEDIA_DIR` keeps test uploads in `.qa/test-media`, away from `media/`.

## Verified workflow (live demonstration)

The flow ran in a real browser against the production build (`next start`) and the seeded test database, as part of `tests/e2e/homepage.spec.ts`. Screenshots are in `.qa/screenshots/`.

1. An **editor** opens Website settings → Homepage. The fields are editable and only **Save Draft** is offered. The editor changes the hero eyebrow and saves: "Draft saved successfully", status "Changed" (`homepage-flow-1-editor-draft.png`).
2. A **visitor** loads `/` and still sees "Software. Systems. Possibility." (`homepage-flow-2-visitor-before.png`). Asking the API for drafts as a visitor returns the published text too.
3. An **administrator** opens the homepage and sees the editor's draft. If the editor still has the homepage open, Payload offers **Take over** first. The administrator publishes: "Updated successfully", status "Published" (`homepage-flow-3a-admin-published.png`).
4. The visitor reloads `/` and sees the new eyebrow, with no rebuild (`homepage-flow-3-visitor-after.png`).

**Run directly against the development database:**

- **Never seeded:** `/` served the approved content and logged "The homepage has never been saved in the CMS…".
- **After `pnpm seed:homepage`:** the same running server served the CMS content on the next request.
- **Second seed run:** "The homepage is already saved in the CMS (1 version). Nothing was changed."

**Database outage, against the production build:**

1. With the database up, `/` returned 200 with the CMS content.
2. With `deltawave-postgres` stopped, `/` returned 200 with the approved content. Each request logged "Homepage content unavailable: the database cannot be reached", classified from `ECONNREFUSED` in the query error's cause.
3. After the container restarted, the same server returned the CMS content again, with no restart needed.

## Checks

| Check | Command | Result |
| --- | --- | --- |
| Types | `pnpm typecheck` | Passes |
| Lint | `pnpm lint` | 0 errors, the same 14 documented warnings as Phase 1 |
| Unit tests | `pnpm test` | 60 of 60 pass (Phase 1's 44 plus 16) |
| Server rendering | `pnpm test:render` | 43 pages and the 404 render |
| HTML inspection | `pnpm test:html` | 44 documents pass; brand PNGs and ELNATH files match the originals |
| Production build | `pnpm build` | Passes; `/` is dynamic, the other 42 pages are prerendered |
| End to end, with parity | `PROTOTYPE_URL=… pnpm test:e2e` | 51 of 51 pass in 4.6 minutes: 17 CMS, 11 homepage, 16 public site, 7 parity (12 pages at 1600, 1440, 1024, 768, 390 and 320 px, plus open menus; no pixel may differ) |
| Schema | `payload migrate:create --skip-empty` | No migration needed |
| Seed, twice | Test and development databases | Second run: nothing changed, identical counts |
| Seed recovery | Test database, with records already present | Existing records and an admin's edits kept; no duplicates |
| Database outage | Container stopped, then restarted | Fallback with an error log; recovers without a restart |
| Reference folders | SHA-256 manifests of DeltaWave-UI and DeltaWave-Logo | Identical to Phase 1; `components/brand/` untouched |

**New unit tests** (`tests/homepage.test.mjs`, `tests/access.test.mjs`):

- Approved content gives exactly the prototype markup, with a fixture rendered from the prototype component before the refactor.
- Mapping uses no defaults.
- Hidden content is kept.
- Unreadable relations are left out.
- Media URLs and WebP candidates are correct.
- Hidden sections and the scroll link are removed.
- Published empty fields render nothing.
- The four states, including that public reads use `overrideAccess: false` and `draft: false`.
- Non-database errors are thrown.
- Unpublishing is refused, by a save and by a restore.
- Editor writes are always draft saves, including restores.

**New end-to-end tests** (`tests/e2e/homepage.spec.ts`):

- All nine sections render the approved composition from the CMS.
- Images are served from the media library as the approved files.
- Every link resolves.
- The editor → administrator → visitor workflow works in the admin UI.
- Visibility toggles hide and restore sections.
- Published empty fields stay empty.
- Unpublished and deleted solutions and portfolio entries are left out.
- A deleted hero image leaves no broken image.
- The homepage cannot be unpublished or restored to a draft.
- An editor cannot publish or change the live homepage.
- Re-running the seed after an administrator's edit changes nothing.

`tests/e2e/cms.spec.ts` now restores the seeded homepage after its own homepage test.

## Problems found and fixed

1. **Editors could not edit anything in the admin (Phase 1 defect).** Payload's admin evaluates write access to decide which fields and buttons to show, and does so without the request's `?draft=true` flag. Phase 1's access rule required that flag for editors, so every versioned document, including the Homepage, was read-only for them. Phase 1 had only tested editors through the REST API.

   The draft-only rule now lives in a `beforeOperation` hook (`cms/versioned.ts`). It runs before every create, update and version restore with the operation's real draft flag. Version restores on globals skip `beforeChange` hooks, so this closes that path too. Access control now only decides who may edit. All Phase 1 security tests pass unchanged.
2. **Production builds bundle Payload more than once.** After the admin UI had been opened, an error thrown by our hook came from a different copy of Payload's `APIError` class than the REST error formatter's. With minified (empty) class names, the formatter replaced the message with "An unknown error occurred." The hook's error now has an explicit name and data.
3. **Payload re-encodes WebP uploads.** It treats WebP as possibly animated, so the stored original lost its colour profile and about 45% of its file size. The seed installs the approved file in its place. Editors' own WebP uploads are still re-encoded (see remaining issues).
4. **The prototype's architecture JPEG is only 1600 px wide**, while its WebP master is 2200 px and is what the prototype offers to high-density screens. The seed therefore uploads the WebP masters, and a WebP original is offered as the widest candidate.

## Files changed

**New**

- `lib/cms/homepage-state.ts`, `homepage-view.ts`, `homepage-approved.ts`, `errors.ts`; `lib/images.ts`
- `scripts/seed-homepage.ts`
- `components/site/project-entry.tsx`, `components/cms/admin-publish-button.tsx`
- `tests/homepage.test.mjs`, `tests/fixtures/homepage.approved.html`
- `tests/e2e/homepage.spec.ts`, `tests/e2e/cms-helpers.ts`, `tests/e2e/global-setup.ts`
- `docs/PHASE2A_REPORT.md`

**Changed**

- Pages and components:
  - `app/(frontend)/page.tsx`: dynamic, reads the CMS.
  - `components/site/pages.tsx`: `HomePage` renders the view with the same markup.
  - `shared.tsx`, `contact.tsx`, `directories.tsx`: shared pieces made data-driven, with identical output.
  - `components/cms/dashboard-intro.tsx`: dashboard note.
- CMS:
  - `cms/globals/Homepage.ts`: descriptions, unpublish guard, admin Publish button.
  - `cms/globals/SiteSettings.ts`: admin Publish button.
  - `cms/versioned.ts`, `cms/access.ts`: editor rules.
  - `cms/collections/Media.ts`: `MEDIA_DIR`, never-enlarged large size.
  - `app/(payload)/admin/importMap.js`: regenerated, plus one component.
- Tooling and tests: `package.json` (scripts), `playwright.config.ts`, `scripts/prepare-test-db.mjs`, `scripts/test-database.mjs`, `tests/render.mjs`, `tests/access.test.mjs`, `tests/e2e/cms.spec.ts`.
- Docs: `README.md`, `.env.example`, `docs/ARCHITECTURE.md`, `docs/CMS_CONTENT_MODEL.md`, `docs/PHASE2_PLAN.md`.

No dependency, migration or brand file changed.

## Remaining issues and limits

- **Editors' WebP uploads are re-encoded by Payload**, which removes the colour profile and lowers quality. Prefer JPEG or PNG masters for now. Keeping metadata (`withMetadata`) would also keep EXIF, such as location, and needs a privacy decision.
- **Every homepage image request goes through Payload** (`/cms-api/media/file/*`). That is acceptable locally; move to R2 or a CDN before launch (Phase 2 plan, step 7).
- **The homepage reads the database on every request.** That is simple and immediate. Cache tags can be added later if traffic needs them.
- **Payload's document lock:** if an editor still has the homepage open, an administrator is first asked to **Take over**. This is expected, but worth explaining to editors.
- **Editors see "Untitled" for other accounts** in the "Updated by" field, because they may only read their own account (Phase 1 rule).
- **Not verified:** Firefox and Safari; hover states; the prototype's production Worker build (parity used its development server, as in Phase 1).
- **Out of scope, as briefed:** R2, hosting, DNS, the other 42 pages, live preview, section reordering, dependency upgrades.

## Database state after Phase 2A

- **Development (`deltawave`):** seeded with 5 photographs in `media/`, 4 categories, 6 solutions, 2 portfolio entries and the published homepage. There are still no accounts; the first visit to `/admin` asks you to create one. Two orphaned Phase 1 test icons were removed from `media/` (no record referenced them).
- **Test (`deltawave_test`):** recreated and seeded on every `pnpm test:e2e` run, holding throwaway accounts.

## How to test it yourself

1. `pnpm db:up` (start Docker Desktop first), then `pnpm dev`, and open `http://localhost:3000`. The homepage now comes from the CMS. The development database is already seeded; on a fresh database run `pnpm seed:homepage` first.
2. Open `http://localhost:3000/admin` and create your administrator account.
3. Open **Website settings → Homepage**, change the hero eyebrow, and click **Save Draft**. In a private window, `/` still shows the published text.
4. Click **Publish changes** and reload the private window: the new text appears.
5. In the **Academy** tab, untick **Show this section** and publish: the section disappears. Tick it again and publish: it returns with its content.
6. Optionally, create an editor under **Accounts** and sign in as them in another browser. They can save drafts but are not offered Publish.
7. Run `pnpm seed:homepage` again: it reports that nothing was changed, and your edits remain.
8. Full checks: `pnpm typecheck`, `pnpm lint`, `pnpm test`, then `pnpm build` and `pnpm test:e2e` (stop `pnpm dev` first, because it uses port 3000). For pixel parity, start the prototype and add `PROTOTYPE_URL=http://127.0.0.1:5173`.
