import { HomePage } from "@/components/site/pages";
import { getHomepage } from "@/lib/cms/homepage";
import { metadataFor } from "@/lib/metadata";

// Rendered on every request from the published Homepage global, so a publish
// in /admin appears on the next page load without a rebuild or cache purge.
export const dynamic = "force-dynamic";

export const metadata = metadataFor(
  "/",
  "Technology that moves business forward",
  "Software engineering, custom business applications, cloud infrastructure and digital services from DeltaWave Technology in Bangladesh.",
);

export default async function Home() {
  const { content } = await getHomepage();
  return <HomePage content={content} />;
}
