# CMS content model

Payload 3 is the only content engine. The schema lives in `cms/` and is registered in `payload.config.ts`. Generated types are in `payload-types.ts` (`pnpm generate:types`).

Phase 1 delivered the model, access rules and publishing workflow. Since Phase 2A **the homepage renders from the Homepage global**, the published service categories and the solutions and portfolio entries it features (see `docs/ARCHITECTURE.md`, "Homepage content"). The other pages still read `lib/content.ts` until their own Phase 2 step.

## Principles

1. **Structured fields, not a page builder.** The homepage and detail pages are designed compositions. Editors control copy, media, featured items and section visibility; layout, order, colour and spacing stay in code.
2. **Every website document is versioned with drafts.** Visitors only ever receive published content.
3. **Editors prepare, administrators publish.**
4. **Honest content is enforced where possible**, for example portfolio status values and client permission for real projects.

## Collections

All website collections share `cms/versioned.ts`: drafts on, up to 50 versions per document, the access matrix below, and the publishing invariant hook. All of them have a sidebar `slug` (lowercase and hyphens, unique, indexed, generated from the title when empty), an optional **Search & sharing** group (`seo.title` up to 70 characters, `seo.description` up to 170, `seo.image`, `seo.noIndex`), and read-only `createdBy` and `updatedBy` stamped by hooks.

| Collection | Slug | Purpose | Key fields |
| --- | --- | --- | --- |
| Pages | `pages` | Standalone editorial pages such as the privacy notice | `title`, `hero.eyebrow`, `hero.heading` (line breaks kept), `hero.description`, `body` (rich text: paragraphs, H2/H3, bold, italic, links, lists, quotes) |
| Service categories | `service-categories` | The four capability groups | `title`, `number` (two digits, sort order), `short`, `description`, `image`, `overview` (the service page that introduces the category), `services` (ordered) |
| Services | `services` | `/services/*` detail pages | `title`, `short`, `category` (required), `intro`, `problem`, `audience`, `deliverables[]` (1 to 10), `approach`, `technology`, `relatedSolutions` (up to 6) |
| Industry solutions | `solutions` | `/solutions/*` detail pages | `title`, `label`, `group` (Commerce & operations, People & organizations, Services & communities), `intro`, `challenge`, `modules[]` (1 to 8), `workflow[]` (**exactly 4**, the layout's four columns), `consideration`, `supportingServices` (up to 4) |
| Portfolio | `portfolio-projects` | `/portfolio/*` entries | `name`, `title`, `type` (the five public filters), `projectStatus` (Planned concept, In development, Live, Completed), `clientPermission` (required for Real projects and Case studies), `image`, `intro`, `challenge`, `features[]`, `direction`, `relatedSolution` |
| Media library | `media` | Images | Upload (JPEG, PNG, WebP, AVIF, 10 MB), required `alt`, `caption`, `credit` (source and licence). Generated sizes: thumbnail 400×300, small 640, medium 1100 and large 1800 (WebP). Large is never enlarged: a narrower photo gets a full-size WebP there. Focal point enabled. |
| Accounts | `users` | People who sign in | `email`, `name`, `roles` (Administrator, Editor). Lockout after 5 failures for 15 minutes, 8-hour sessions, 12-character minimum password. |

`projectStatus` is deliberately not called `status`: Payload derives the PostgreSQL enum name from the field name, and `status` would have collided with the drafts `_status` enum. The first generated migration showed this collision, and it was fixed before Phase 1 closed.

Reserved page slugs: `admin`, `cms-api`, `api`, `services`, `solutions`, `portfolio`.

## Globals

### Site settings (`site-settings`)

| Tab | Fields |
| --- | --- |
| Identity | `siteName` (required), `tagline` |
| Contact | `email` (required), `phone` (international format, for example `+8801821777620`), `phoneDisplay`, `location`, `publicWebsite` |
| Social links | `social[]` (platform and `https://` URL, up to 8; official profiles only) |
| Search defaults | `title`, `description`, `image` |
| Header & footer | `header.ctaLabel`, `header.ctaHref`, `footer.statement`, `footer.caption`, `footer.closingLink` |

### Homepage (`homepage`)

A fixed composition with **stable section identifiers**, in this order: `hero`, `introduction`, `services`, `industries`, `engineering`, `portfolio`, `approach`, `academy`, `contact`.

| Section | Visibility | Editable | Protected by the design system |
| --- | --- | --- | --- |
| `hero` | Always shown | Eyebrow, heading (up to 3 lines), green accent line, description (required), primary and secondary links, scroll label, image, caption | Two-column layout, entrance animation, button styles |
| `introduction` | Toggle | Eyebrow, location, heading (3 lines) and grey final line, body, link | Grid and type scale |
| `services` | Toggle | Eyebrow, heading, side text, link, feature image and caption | The list itself comes from published service categories in number order |
| `industries` | Toggle | Eyebrow, heading, side text, link, up to 6 featured solutions | Three-column grid |
| `engineering` | Toggle | Eyebrow, heading, body, link, image, up to 4 capability lines | Blue band |
| `portfolio` | Toggle | Eyebrow, heading, side text, link, up to 2 entries (published only) | Staggered two-column layout |
| `approach` | Toggle | Eyebrow, heading, body, 2 to 6 steps (title and description) | Numbering |
| `academy` | Toggle | Eyebrow, heading, body, honest status label, link, image | Wash band |
| `contact` | Toggle | Eyebrow, heading | The enquiry form and contact details (from Site settings) |

Headings are textareas; each line break becomes a line break on the page. Lines are limited to 48 characters. A visible section must have a heading before it can be published; hidden sections and drafts are not validated.

How the published homepage is rendered:

- **Exactly what was published.** A field left empty renders nothing. Links need both a label and a destination. A hidden section keeps its content for when it is shown again; hiding the introduction also hides the hero's scroll link to it.
- **Featured items are live records.** Featured industries and portfolio entries appear in the chosen order. An unpublished or deleted record is left out and the remaining cards are numbered continuously. The services list shows every published service category in number order.
- **Images** come from the media library with their alternative text and generated WebP sizes. A deleted image simply disappears from its section.
- **The homepage cannot be unpublished.** Once published it always has a live version; the admin explains this if **Unpublish** is used. Hide sections instead, or publish a new version.
- **Before the first publication** (or while the database is unreachable) visitors see the approved prototype content. `pnpm seed:homepage` publishes that same content into the CMS, after which it is fully editable.

## Access matrix

| Operation | Visitor | Editor | Administrator |
| --- | --- | --- | --- |
| Read published content and media | Yes | Yes | Yes |
| Read drafts and version history | No | Yes | Yes |
| Create or update content | No | Draft saves only (`?draft=true`) | Yes |
| Publish or unpublish | No | No | Yes (the homepage cannot be unpublished) |
| Delete content or media | No | No | Yes |
| Upload or edit media | No | Yes | Yes |
| Open the admin panel | No | Yes | Yes |
| Read accounts | No | Own account | All |
| Create accounts, change roles, unlock | No | No | Yes |

How editors are kept from publishing:

1. **Access control** decides who may edit. Administrators may do anything. Editors may write anything that does not ask for `_status: "published"`, so the admin shows them the fields and **Save Draft** but not **Publish changes**. Payload evaluates this for the admin screens without the request's draft flag, so it cannot be the only rule. On globals the admin checks edit and publish permission with the same data, so `AdminPublishButton` hides Publish from editors there.
2. **A `beforeOperation` hook** on every versioned collection and global runs before every create, update and version restore with the operation's real draft flag. A signed-in non-administrator must be making a draft save (`?draft=true` or `draft: true`) that does not ask to publish; anything else is refused with 403. This covers version restores, which on globals skip `beforeChange` hooks.
3. **A `beforeChange` hook** rejects any non-administrator write whose result would be published, whatever shape the request takes. Payload 3.90 turns a draft save that asks to publish into a draft, and the hook keeps the rule even if that behaviour changes.

Until Phase 2A, rule 1 also required the draft flag. Payload's admin evaluates permissions without that flag, so editors saw every versioned document read-only. Phase 2A moved the draft requirement to rule 2. The REST behaviour is unchanged: the Phase 1 security tests pass as before, and new tests cover the admin UI and restores.

The homepage additionally **cannot be unpublished** by anyone. A live save with the draft status (the admin's Unpublish) and restoring a draft version as the live one are both refused with an explanation. Hide sections instead.

The first account created on an empty database is always an Administrator: the form defaults to it and a hook enforces it.

## Editorial workflow

1. An editor creates or edits a document and uses **Save Draft**. Payload stores a new version; the live document is unchanged.
2. An administrator reviews it, compares versions if needed, and uses **Publish changes**.
3. Every version records `updatedBy`. Documents also record `createdBy`. Staff can open the version history to compare versions. Restoring a version goes through the same publishing rules; restore has not been tested yet (Phase 2).

If an editor still has a document open, an administrator who opens it is offered **Take over** (Payload's document lock). After taking over, the administrator sees the editor's draft and can publish it.

Planned for Phase 2: preview of drafts on the real page design, live preview, scheduled publishing, and on-demand revalidation of static pages after publishing. The homepage needs no revalidation, because it is rendered on every request.

## Mapping from the prototype content

| Prototype source | CMS destination |
| --- | --- |
| `lib/content.ts` `categories` | `service-categories` (`links` → `services`; the matching service slug → `overview`; `image` → Media) |
| `lib/content.ts` `services` | `services` (`related` → `relatedSolutions`) |
| `lib/content.ts` `solutions` | `solutions` (`services` → `supportingServices`) |
| `lib/content.ts` `projects` | `portfolio-projects` (`status` → `projectStatus`, `solution` → `relatedSolution`, `type` "Product concepts") |
| `lib/site.ts` `site` | Site settings → Contact and Identity |
| `components/site/pages.tsx` `HomePage` | Homepage global. Done in Phase 2A: the copy is in `lib/cms/homepage-approved.ts` and `pnpm seed:homepage` publishes it with the four categories, six featured solutions, two portfolio entries and five photographs |
| `components/site/pages.tsx` `PrivacyPage` | `pages` (slug `privacy`, body as rich text) |
| About, Services, Solutions, Portfolio, Academy and Contact page copy | To be modelled in Phase 2, most likely as structured globals like the homepage |
| Photography in `public/images` | Media library, with the credits from `docs/IMAGE_CREDITS.md` in `credit`. The seed uploads each photograph's full-size WebP and installs the approved 640, 1100 and full-width WebP files in place of the matching generated sizes, so the site serves the approved images byte for byte |

## Not implemented, by decision

- **Enquiries collection.** The current privacy notice states that the website keeps no enquiry database. Storing submissions needs that notice and a retention period updated first. The enquiry endpoint is unchanged.
- **Unrestricted page builder.** Excluded by design (see Principles).
- **Section reordering.** The homepage alternates white, wash and blue bands in a designed rhythm. Reordering needs a design review and could then be limited to compatible sections.
- **Localisation.** The content is English only; Payload localisation can be added later without restructuring.
