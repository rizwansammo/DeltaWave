import { configured, handleEnquiry, type EnquiryConfig } from "@/lib/enquiry";
import { site } from "@/lib/site";
export const dynamic = "force-dynamic";
function config(): EnquiryConfig {
  return {
    apiKey: process.env.ENQUIRY_EMAIL_API_KEY,
    from: process.env.ENQUIRY_FROM_EMAIL,
    to: site.email,
    turnstileSecret: process.env.TURNSTILE_SECRET_KEY,
    siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    expectedUrl: site.url,
    production: process.env.NODE_ENV === "production",
  };
}
export function GET() {
  const c = config();
  return Response.json(
    { enabled: configured(c), siteKey: configured(c) ? c.siteKey : undefined },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
export async function POST(request: Request) {
  return handleEnquiry(request, config());
}
