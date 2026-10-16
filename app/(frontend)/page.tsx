import { HomePage } from "@/components/site/pages";
import { getContactSectionData } from "@/lib/cms/contact";
import { getHomepage } from "@/lib/cms/homepage";
import { getSiteSettings } from "@/lib/cms/pages";
import { metadataFor } from "@/lib/metadata";

// Rendered on every request from the published Homepage global, so a publish
// in /admin appears on the next page load without a rebuild or cache purge.
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { settings } = await getSiteSettings();
  return metadataFor(
    "/",
    settings.seo.title || "Technology that moves business forward",
    settings.seo.description ||
      settings.tagline ||
      "Software engineering, custom business applications, cloud infrastructure and digital services from DeltaWave Technology in Bangladesh.",
    { siteName: settings.siteName, image: settings.seo.image },
  );
}

export default async function Home() {
  const [{ content }, contact] = await Promise.all([getHomepage(), getContactSectionData()]);
  return <HomePage content={content} contact={contact} />;
}
