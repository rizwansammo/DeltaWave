import type { ServerProps } from "payload";
import { BrandLockup } from "@/components/brand/brand-lockup";

/** DeltaWave lockup at the top of the admin navigation, linking to the dashboard. */
export function NavBrand({ payload }: ServerProps) {
  return (
    <a
      className="brand dw-nav-brand"
      href={payload.config.routes.admin}
      aria-label="DeltaWave CMS dashboard"
    >
      <BrandLockup />
    </a>
  );
}
