import config from "@payload-config";
import { draftMode } from "next/headers";
import { getPayload } from "payload";
import { isStaff } from "@/cms/access";
import { safePath } from "@/lib/preview-path";

// Turns on Next.js draft mode for a signed-in member of staff, then sends
// them to the page. The admin's Preview button and the Live Preview iframe
// both come here. Anonymous visitors are refused, so an unpublished page can
// never be reached by guessing this address.
export const dynamic = "force-dynamic";

const refuse = (message: string, status: number) =>
  new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });

export async function GET(request: Request) {
  const path = safePath(new URL(request.url).searchParams.get("path"));
  if (!path) return refuse("Preview needs a page address on this website.", 400);

  let user = null;
  try {
    const payload = await getPayload({ config });
    ({ user } = await payload.auth({ headers: request.headers }));
  } catch {
    return refuse("Preview is unavailable.", 503);
  }
  if (!isStaff(user))
    return refuse("Sign in to the CMS to preview drafts.", 401);

  (await draftMode()).enable();
  return new Response(null, {
    status: 307,
    headers: { Location: path, "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
  });
}
