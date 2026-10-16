import { notFound } from "next/navigation";
import { metadataFor } from "@/lib/metadata";
import { getCatalog } from "@/lib/cms/catalog";
import { catalogDetailSeo, isCatalogPath, renderCatalogRoute } from "@/components/site/catalog";
import {
  AboutPage,
  AcademyPage,
  ContactPage,
  PrivacyPage,
} from "@/components/site/pages";

// Rendered on demand (see the frontend layout): /services, /solutions,
// /portfolio and their detail pages come from the published CMS records, so
// a record published in /admin is reachable at once. Unknown, unpublished
// and deleted records are real 404s.

const main: Record<string, { title: string; description: string; component?: React.ComponentType }> = {
  about: {
    component: AboutPage,
    title: "About us",
    description:
      "Meet DeltaWave Technology, a developing technology enterprise focused on thoughtful engineering and practical business systems.",
  },
  services: {
    title: "Our services",
    description:
      "Explore software engineering, industry applications, cloud and managed IT, branding, UI/UX and digital growth services.",
  },
  solutions: {
    title: "Custom industry solutions",
    description:
      "Explore tailored applications for commerce, education, healthcare, logistics, finance and other business operations.",
  },
  portfolio: {
    title: "Portfolio & product direction",
    description:
      "Explore the planned coaching management and commerce product concepts from DeltaWave Technology, with clear development status.",
  },
  academy: {
    component: AcademyPage,
    title: "DeltaWave Academy",
    description:
      "Our planned computer training and digital skills initiative. Explore proposed learning areas and share your interests.",
  },
  contact: {
    component: ContactPage,
    title: "Contact us",
    description:
      "Discuss your software, IT or digital project with DeltaWave Technology. Contact us in Borhanuddin, Bhola, Bangladesh.",
  },
  privacy: {
    component: PrivacyPage,
    title: "Privacy & enquiries",
    description:
      "How DeltaWave Technology uses contact details and project information when you make an enquiry.",
  },
};

const notFoundMetadata = { title: "Page not found", robots: { index: false, follow: false } };

type Props = { params: Promise<{ slug: string[] }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const path = "/" + slug.join("/");
  if (slug.length === 1 && main[slug[0]]) return metadataFor(path, main[slug[0]].title, main[slug[0]].description);
  if (slug.length === 2 && isCatalogPath(slug)) {
    const seo = catalogDetailSeo(slug, await getCatalog());
    if (seo) return metadataFor(path, seo.title, seo.description, { image: seo.image, noIndex: seo.noIndex });
  }
  return notFoundMetadata;
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const Component = slug.length === 1 ? main[slug[0]]?.component : undefined;
  if (Component) return <Component />;
  if (isCatalogPath(slug)) {
    const page = renderCatalogRoute(slug, await getCatalog());
    if (page) return page;
  }
  notFound();
}
