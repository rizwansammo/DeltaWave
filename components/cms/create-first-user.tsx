import type { AdminViewServerProps } from "payload";
import { CreateFirstUserView } from "@payloadcms/next/views";
import { AdminLogo } from "./admin-logo";

/**
 * Payload's own create-first-user view with the DeltaWave lockup above it.
 * Payload renders no logo on this screen, so the built-in view is wrapped
 * rather than reimplemented.
 */
export function BrandedCreateFirstUser(props: AdminViewServerProps) {
  return (
    <>
      <div className="dw-auth-brand">
        <AdminLogo />
      </div>
      <CreateFirstUserView {...props} />
    </>
  );
}
