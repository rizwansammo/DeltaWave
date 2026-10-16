# DeltaWave Technology website

## What is included

The implementation contains 43 content pages, a custom 404, shared navigation, desktop Services and Solutions mega menus, mobile navigation with independent category links, a searchable industry directory, portfolio filters, responsive layouts, a contact endpoint and locally hosted brand and photography assets.

Seven primary navigation destinations are Home, About, Services, Solutions, Portfolio, Academy and Contact. There are 18 service pages, 15 industry pages, two planned product concept pages and a privacy notice.

The interface uses a light foundation, rectangular components, restrained blue and green accents and Manrope for readable website text. ELNATH is used only in the corporate wordmark. All uploaded logo PNG files are retained unchanged in `public/brand`.

## Brand proportions

`components/site/brand.tsx` uses the original transparent PNG next to two text lines rendered with the supplied ELNATH font. No icon is redrawn or recolored. No glyph is horizontally stretched.

At the canonical desktop scale:

| Element                          | Value                    |
| -------------------------------- | ------------------------ |
| DELTAWAVE font size              | 24 px                    |
| TECHNOLOGY font size             | 23 px                    |
| DELTAWAVE tracking               | 2.42 px                  |
| TECHNOLOGY tracking              | −0.5 px                  |
| DELTAWAVE visible width          | Approximately 160.5 px   |
| TECHNOLOGY visible width         | Approximately 160.5 px   |
| Combined visible wordmark height | Approximately 38.98 px   |
| Visible icon height              | Approximately 39.5 px    |

The entire lockup scales uniformly on smaller screens. TECHNOLOGY is 1 px smaller in the base design, following the latest instruction. Native font kerning is explicitly enabled, with tracking balanced around the shaped glyph widths. The estimates above come from font geometry and high resolution shaping; final browser rendering still needs visual review. WOFF2 conversion preserves the supplied TTF glyphs.

## Enquiry form status

The form is implemented but outbound delivery is not enabled. No credentials were provided and no real test email was sent. The private preview shows a clear unavailable message and the direct business email and phone.

The endpoint requires a same origin JSON request, validates fields on the server, bounds request size, rejects the honeypot, checks submission timing and validates Cloudflare Turnstile on the server. Turnstile hostname and action must match. Resend receives a plain text message addressed only to the configured business inbox. User input cannot choose the recipient or sender. Success requires a provider receipt. It means provider acceptance, not guaranteed inbox delivery.

The additional attempt limiter is local to a runtime instance. Turnstile is the principal spam protection. Before a public launch, configure an edge rate limit for `/api/enquiry` if the hosting arrangement supports it. This is not a claim of a distributed rate limiter.

### Required settings

| Setting                          | Purpose                                                               |
| -------------------------------- | --------------------------------------------------------------------- |
| `ENQUIRY_EMAIL_API_KEY`          | Resend API credential, server only                                    |
| `ENQUIRY_FROM_EMAIL`             | Sender verified in the email provider                                 |
| `TURNSTILE_SECRET_KEY`           | Cloudflare Turnstile secret, server only                              |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public widget site key                                                |
| `NEXT_PUBLIC_SITE_URL`           | Exact deployed origin for metadata and origin checks                  |
| `NEXT_PUBLIC_INDEXABLE`          | `false` for private review; enable only for an approved public launch |

The destination is `rizwan@deltawave.tech` in `lib/site.ts`. Configure the exact deployed hostname in Turnstile. Set secrets in the hosting platform rather than source files. A sender verification process may need DNS changes, which have not been performed.

Official implementation references:

- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- https://resend.com/docs/api-reference/emails/send-email

## Verification completed

- Production Vinext build and TypeScript checking.
- 22 automated checks covering route relationships, content completeness and enquiry behavior.
- React server rendering of all 43 pages and the custom 404.
- Inspection of rendered HTML for internal destinations, image sources, one main heading per page, unique element IDs and form label targets.
- Unique titles and descriptions for the 42 secondary pages, with separate homepage metadata.
- Byte comparison of supplied logo PNGs, WOFF2 glyph comparison and brand geometry calculations.
- Source checks for sharp corners and reduced motion handling.

## Verification limits

Browser automation was unavailable in this session because the required Sites browser capability was not installed. No live browser screenshots, touch interaction tests, keyboard interaction tests, console checks, Lighthouse scores or measured mobile overflow results are claimed. Component HTML rendering and source inspection do not replace those checks.

Before public launch, visually review 1600, 1440, 1024, 768, 390 and 320 px widths. Check desktop hover and parent links, Escape and focus behavior, all mobile submenus, image crops, wordmark rendering after fonts load, directory filters and the enquiry form. Test a real email delivery after configuration, including a failure case. Verify the actual hosted sitemap and robots responses.

## Honest content states

The two portfolio entries are planned concepts: Coaching Management SaaS and E-commerce & Facebook Business SaaS. They are not presented as launched products, real client projects or completed demonstrations. Empty portfolio categories have an explanatory state. Academy is in planning, with no enrollment or available seats claimed.

Photographs are representative imagery and do not depict DeltaWave premises, staff or clients. Image sources and licenses are documented in `IMAGE_CREDITS.md`. No client counts, certifications, testimonials or company history have been invented.

## Remaining owner decisions

1. Review the private website presentation in a browser.
2. Supply an email provider configuration and Turnstile configuration if online enquiries should be enabled.
3. Approve any public launch and custom domain connection separately.
4. Provide approved projects, leadership details and Academy dates when available. The current site is intentionally honest without them.

The proposed headline and tagline are editable copy. No public publication, domain purchase or DNS change is included in this delivery.
