import { BrandIcon } from "@/components/brand/brand-lockup";

/**
 * The original DeltaWave icon for the admin header (Payload graphics.Icon),
 * uniformly scaled to the header height by app/(payload)/custom.scss.
 */
export function AdminIcon() {
  return (
    <span className="dw-admin-icon">
      <BrandIcon />
    </span>
  );
}
