import { configured, handleEnquiry, type EnquiryConfig } from "@/lib/enquiry";
import { getServiceOptions } from "@/lib/cms/contact";
import { emailReady, getEnquiryRouting, notifyEnquiry, storeEnquiry } from "@/lib/cms/enquiries";
import { getSiteSettings } from "@/lib/cms/pages";
import { site } from "@/lib/site";
export const dynamic = "force-dynamic";

// Read at runtime (not NEXT_PUBLIC_*, which is fixed at build time), so one
// image serves any environment.
function environment(): Pick<EnquiryConfig, "turnstileSecret" | "siteKey" | "expectedUrl" | "production"> {
  return {
    turnstileSecret: process.env.TURNSTILE_SECRET_KEY,
    siteKey: process.env.TURNSTILE_SITE_KEY || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    expectedUrl: site.url,
    production: process.env.NODE_ENV === "production",
  };
}

/** The published routing, or null while the CMS cannot be read (fails closed). */
const routing = () => getEnquiryRouting().catch(() => null);

export async function GET() {
  const [route, mailReady] = await Promise.all([routing(), emailReady()]);
  const c = { ...environment(), accepting: route?.accepting ?? false, mailReady, store: storeEnquiry };
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
  // The accepted services follow the published categories, so the form and
  // the server agree on what may be submitted.
  const [{ settings }, allowedServices, route, mailReady] = await Promise.all([
    getSiteSettings(),
    getServiceOptions(),
    routing(),
    emailReady(),
  ]);
  return handleEnquiry(request, {
    ...environment(),
    allowedServices,
    accepting: route?.accepting ?? false,
    mailReady,
    contactEmail: settings.email || site.email,
    store: storeEnquiry,
    notify: (id, enquiry) => notifyEnquiry(id, enquiry, route ?? undefined),
  });
}
