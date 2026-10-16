# DeltaWave branding specification

The authoritative brand implementation is the approved prototype, **`DeltaWave-UI/components/site/brand.tsx`** together with the `.brand*` rules in **`DeltaWave-UI/app/globals.css`**, using the owner's original files in **`DeltaWave-Logo`**. This project reproduces that implementation exactly and uses it everywhere the brand appears. Do not redraw, regenerate, stretch or re-letter-space any part of it.

## Source files

| Role | Location | Notes |
| --- | --- | --- |
| Lockup markup (single source) | `components/brand/brand-lockup.tsx` | `BrandIcon` and `BrandLockup`. Markup is identical to the prototype; a test renders both and compares them. |
| Lockup geometry (single source) | `components/brand/brand.css` | The prototype's four `.brand*` rules, unchanged. |
| Font faces | `styles/fonts.css` | ELNATH and Manrope `@font-face` rules, unchanged. |
| Design tokens | `styles/tokens.css` | `--ink #17212b`, `--muted #626c72`, `--blue #17375e`, `--green #356f55`, `--line #dce1df`, `--wash #f3f5f2`, `--sky #edf2f5`. |
| Public site | `components/site/brand.tsx` | Wraps the lockup in the home link `<a class="brand">`. Header and footer. |
| CMS sign-in and first account | `components/cms/admin-logo.tsx` | Payload `graphics.Logo`; also placed above the create-first-user form by `components/cms/create-first-user.tsx`. |
| CMS navigation | `components/cms/nav-brand.tsx` | Full lockup at canonical size at the top of the sidebar. |
| CMS header | `components/cms/admin-icon.tsx` | The icon alone, uniformly scaled to the 18 px header slot. |
| Favicons and touch icon | `app/(frontend)/layout.tsx`, `payload.config.ts` (`admin.meta.icons`) | White optical 16, 32 (`/favicon.png`) and 48 px PNGs for dark browser chrome; original blue 256 px Apple touch icon. |

**White favicon variant.** In addition to the unchanged original blue optical assets,
`public/brand/deltawave_corporate_white_optical_{16,32,48}px.png` are
colour-only variants, with precisely the same pixel dimensions and alpha
channels as the corresponding blue originals. Only RGB was set to white;
the outline, antialiasing and transparent area are unchanged. The white
32 px copy is also `public/favicon.png`. These variants are explicitly
approved for browser-tab visibility. The navy lockup artwork, 256 px Apple
touch icon and organization identity assets remain original.

**Stylesheet delivery.** The public site imports the three shared files from the top of `app/(frontend)/globals.css`, so it ships one stylesheet, as the prototype did. The admin pulls the same files into its theme with Sass `@use` in `app/(payload)/custom.scss`. Do not import these files from components: with the lockup CSS in its own stylesheet, Chromium was seen to re-shape the scaled wordmark narrower (about 8% at the 0.9 scale) after a full-page capture. Tests guard the one-sheet arrangement.

## Original assets

Every file below is byte-identical to `DeltaWave-Logo` (checked by `tests/brand.test.mjs` and `tests/inspect_html.py`). All PNGs are 8-bit RGBA, artwork colour `#17375e` (the `--blue` token).

| File (`public/brand/`) | Pixels | Visible artwork (alpha bounds) | Bytes | SHA-256 (first 16) | Used for |
| --- | --- | --- | --- | --- | --- |
| `deltawave_corporate_blue_128px.png` | 128×128 | 100×80 at (14,19) | 1,747 | `f0bb8d711ae520f7` | The lockup icon |
| `deltawave_corporate_blue_256px.png` | 256×256 | 198×158 at (29,39) | 2,623 | `96303a22f250d28f` | Apple touch icon |
| `deltawave_corporate_blue_512px.png` | 512×512 | 394×316 at (59,78) | 5,247 | `9ac7590d2f7b491c` | Organization JSON-LD logo |
| `deltawave_corporate_blue_optical_16px.png` | 16×16 | 16×13 at (0,1) | 879 | `24fb0f0091ff56b0` | Favicon 16 |
| `deltawave_corporate_blue_optical_32px.png` | 32×32 | 30×25 at (1,2) | 1,104 | `820e52590fafa7d5` | Favicon 32 (also `public/favicon.png`) |
| `deltawave_corporate_blue_optical_48px.png` | 48×48 | 44×36 at (2,4) | 1,314 | `334ad9830c4c36ae` | Favicon 48 |
| `deltawave_corporate_blue_64px.png` | 64×64 | 50×41 at (7,9) | 1,345 | `6c3c42127608041c` | Available |
| `deltawave_corporate_blue_1024px.png` | 1024×1024 | 788×631 | 22,702 | `cd5747e2f8dc3213` | Available |
| `deltawave_corporate_blue_2048px.png` | 2048×2048 | 1576×1261 | 55,112 | `2b26a8f169fa6153` | Available |
| `deltawave_corporate_blue_4096px.png` | 4096×4096 | 3152×2521 | 142,664 | `b2dcee63748fd3f1` | Available |
| `deltawave_corporate_blue_8192px.png` | 8192×8192 | 6302×5042 | 428,650 | `fc7978c1c463fb7d` | Available |

The prototype's copies of the 4096 and 8192 px files were 2048×2048 re-encodes; this project uses the true originals.

| Font (`public/fonts/`) | Bytes | SHA-256 (first 16) | Notes |
| --- | --- | --- | --- |
| `ELNATH.ttf` | 24,324 | `5fb97c61d440a8db` | Original. ELNATH 1.000, © 2021 Mohamed Husman. 82 glyphs, 1000 units per em, kerning in GPOS. No licence text in the file. |
| `ELNATH.otf` | 10,972 | `3c54d4782ba39fb2` | Original CFF version. Not loaded by the site. |
| `elnath.woff2` | 7,632 | `3d2fa48fa7d78cb3` | From the prototype. Compared with the TTF using fontTools: identical glyph outlines, glyph order, character map, advance widths, GPOS kerning, and `hhea`, `OS/2`, `maxp`, `post` and `name` tables. Only the `DSIG` signature was dropped and `head` differs in checksum, timestamp and the "losslessly converted" flag. |
| `manrope-400…800.woff2` | | | Interface text, SIL Open Font License (`Manrope-LICENSE.txt`). |

ELNATH is used **only** in the wordmark. `font-display: block` avoids a fallback-font flash; the site preloads `elnath.woff2`.

## Lockup geometry

Markup (from the prototype, unchanged):

```html
<span class="brand-icon" aria-hidden="true">
  <img src="/brand/deltawave_corporate_blue_128px.png" width="64" height="64" alt="">
</span>
<svg class="brand-wordmark" viewBox="0 0 162 39.5" width="162" height="39.5" aria-hidden="true">
  <text x="-1.104" y="17.328" font-size="24" letter-spacing="2.42">DELTAWAVE</text>
  <text x="-1.104" y="38.934" font-size="23" letter-spacing="-.5">TECHNOLOGY</text>
</svg>
```

Rules (from the prototype, unchanged):

| Selector | Declarations |
| --- | --- |
| `.brand` | `display: flex; align-items: center; gap: 12px; flex-shrink: 0; width: 224px; height: 40px; color: var(--blue)` |
| `.brand-icon` | `display: block; position: relative; overflow: hidden; width: 49.25px; height: 39.5px; flex: 0 0 49.25px` |
| `.brand-icon img` | `position: absolute; width: 64px; height: 64px; max-width: none; left: -7.375px; top: -9.75px` |
| `.brand-wordmark` | `font-family: ELNATH, sans-serif; font-kerning: normal; fill: var(--blue); overflow: visible; flex: 0 0 162px` |

The icon is the 128 px PNG drawn at 64×64 and cropped by a 49.25×39.5 window starting at (7.375, 9.75), which trims only the transparent margin and the outermost anti-aliased pixel row and column.

### Measured in Chromium at canonical size (1440 and 1600 px viewports)

| Measure | Value |
| --- | --- |
| Lockup box | 224 × 40 px |
| Icon window | 49.25 × 39.5 px, 0.25 px below the lockup's top |
| Gap | 12 px; wordmark starts 61.25 px from the lockup's left edge |
| Wordmark box | 162 × 39.5 px |
| DELTAWAVE | 24 px, tracking 2.42 px, advance 165.156 user units (includes trailing tracking) |
| TECHNOLOGY | 23 px, tracking −0.5 px, advance 162.281 user units |
| Wordmark ink (pixels actually drawn) | 161 × 39 px (prototype documentation: about 160.5 × 38.98) |

The new site and the prototype produce identical boxes and text metrics on 12 pages at all six widths (`tests/e2e/prototype-parity.spec.ts`).

### Responsive scaling (uniform transforms from the prototype's layout CSS)

| Viewport | Header lockup | Footer lockup |
| --- | --- | --- |
| above 1250 px | 1.0 (224 × 40) | 1.0 |
| 1250 px and below | `scale(0.9)`, box width 202 px (visual 181.8 × 36), ink 145 × 35 | 0.9 |
| 850 px and below | 0.9 | `scale(0.78)` (visual 157.56 × 31.2) |
| 650 px and below | `scale(0.83)` (visual 167.66 × 33.2), ink 134 × 32 | `scale(0.85)` (visual 171.7 × 34) |

Only uniform `scale()` transforms are used, so the icon-to-wordmark ratios never change. The end-to-end tests assert this ratio at every width.

## CMS usage

| Placement | Size | Mechanism |
| --- | --- | --- |
| Sign-in screen | 224 × 40, canonical | `admin.components.graphics.Logo` |
| First-account screen | 224 × 40, canonical | `admin.components.views.createFirstUser` wraps Payload's own view |
| Sidebar | 224 × 40, canonical | `admin.components.beforeNavLinks` |
| Header breadcrumb | icon only, `scale(18/39.5)` → 22.44 × 18 (16 px tall at 768 px and below) | `admin.components.graphics.Icon` |
| Browser tab | DeltaWave PNG favicons; titles end in "\| DeltaWave CMS" | `admin.meta` |

Payload's generated Open Graph image (which would show Payload's own artwork) is turned off (`defaultOGImageType: "off"`).

## CMS visual rules

- Manrope for all interface text (`--font-body`).
- Square corners everywhere: Payload's `--style-radius-*` set to 0 and the site's global `border-radius: 0 !important` rule. Tests check that no visible element has a rounded corner on eight admin views and the create-first-user screen.
- White theme only (`admin.theme: "light"`). Neutral surfaces use the site palette; Payload's accent scale is the DeltaWave green; primary buttons are the corporate blue with the site's hover colour `#244d79`.
- Focus outline 2 px `--green`; reduced-motion users get no animation.

## Rules

1. Use only the original PNG files and the supplied ELNATH font. Never redraw the icon in CSS or SVG paths.
2. Keep both wordmark lines, their sizes (24 / 23 px), tracking (2.42 / −0.5 px), positions and native kerning.
3. Scale the whole lockup uniformly, or use the icon alone at a uniform scale. Never stretch, condense or change a single part.
4. Keep the lockup CSS in the shared files and deliver it inside each root layout's stylesheet (see "Stylesheet delivery").
5. Do not use the wordmark font anywhere else.
