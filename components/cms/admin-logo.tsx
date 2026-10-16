import { BrandLockup } from "@/components/brand/brand-lockup";

/** Full DeltaWave lockup for the CMS sign-in views (Payload graphics.Logo). */
export function AdminLogo() {
  return (
    <span className="brand dw-admin-logo" role="img" aria-label="DeltaWave Technology">
      <BrandLockup />
    </span>
  );
}
