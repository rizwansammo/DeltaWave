import { draftMode } from "next/headers";
import { safePath } from "@/lib/preview-path";

// Leaves draft preview and returns to the published page.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  (await draftMode()).disable();
  const asked = new URL(request.url).searchParams.get("path");
  const referer = request.headers.get("referer");
  const back =
    safePath(asked) ??
    safePath(referer ? new URL(referer, request.url).pathname : null) ??
    "/";
  return new Response(null, {
    status: 307,
    headers: { Location: back, "Cache-Control": "no-store" },
  });
}
