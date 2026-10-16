import { configured, handleEnquiry, type EnquiryConfig } from "@/lib/enquiry";
import { getServiceOptions } from "@/lib/cms/contact";
import { getSiteSettings } from "@/lib/cms/pages";
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
  // The accepted services and the delivery inbox follow the published CMS
  // values, so the form and the server agree on what may be submitted.
  const [{ settings }, allowedServices] = await Promise.all([
    getSiteSettings(),
    getServiceOptions(),
  ]);
  return handleEnquiry(request, {
    ...config(),
    to: settings.email || site.email,
    allowedServices,
  });
}
