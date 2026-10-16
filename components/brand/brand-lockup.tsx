// The DeltaWave corporate lockup: the original icon PNG beside the two-line
// ELNATH wordmark. Markup and geometry are copied unchanged from the approved
// prototype (DeltaWave-UI components/site/brand.tsx) and are shared by the
// public site and the CMS admin. See docs/BRANDING_SPEC.md before editing.
//
// Styles come from ./brand.css, included by each root layout's stylesheet
// (app/(frontend)/globals.css and app/(payload)/layout.tsx) rather than
// imported here, so the public site keeps a single stylesheet.

/** The original icon, cropped exactly as in the lockup. */
export function BrandIcon() {
  return (
    <span className="brand-icon" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- the original PNG is served byte for byte at a fixed crop; next/image would re-encode it */}
      <img
        src="/brand/deltawave_corporate_blue_128px.png"
        width="64"
        height="64"
        alt=""
      />
    </span>
  );
}

/** Icon and wordmark. Render inside an element with the `brand` class. */
export function BrandLockup() {
  return (
    <>
      <BrandIcon />
      <svg
        className="brand-wordmark"
        viewBox="0 0 162 39.5"
        width="162"
        height="39.5"
        aria-hidden="true"
      >
        <text x="-1.104" y="17.328" fontSize="24" letterSpacing="2.42">
          DELTAWAVE
        </text>
        <text x="-1.104" y="38.934" fontSize="23" letterSpacing="-.5">
          TECHNOLOGY
        </text>
      </svg>
    </>
  );
}
