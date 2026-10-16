import { notFound } from "next/navigation";
import { services, solutions, projects, allPaths } from "@/lib/content";
import { metadataFor } from "@/lib/metadata";
import {
  AboutPage,
  ServicesPage,
  SolutionsPage,
  PortfolioPage,
  AcademyPage,
  ContactPage,
  PrivacyPage,
  ServicePage,
  SolutionPage,
  ProjectPage,
} from "@/components/site/pages";
const main: Record<
  string,
  { component: React.ComponentType; title: string; description: string }
> = {
  about: {
    component: AboutPage,
    title: "About us",
    description:
      "Meet DeltaWave Technology, a developing technology enterprise focused on thoughtful engineering and practical business systems.",
  },
  services: {
    component: ServicesPage,
    title: "Our services",
    description:
      "Explore software engineering, industry applications, cloud and managed IT, branding, UI/UX and digital growth services.",
  },
  solutions: {
    component: SolutionsPage,
    title: "Custom industry solutions",
    description:
      "Explore tailored applications for commerce, education, healthcare, logistics, finance and other business operations.",
  },
  portfolio: {
    component: PortfolioPage,
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
export function generateStaticParams() {
  return allPaths
    .filter((p) => p !== "/")
    .map((p) => ({ slug: p.slice(1).split("/") }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const path = "/" + slug.join("/");
  if (slug.length === 1 && main[slug[0]]) {
    const p = main[slug[0]];
    return metadataFor(path, p.title, p.description);
  }
  const d =
    slug.length === 2
      ? slug[0] === "services"
        ? services.find((s) => s.slug === slug[1])
        : slug[0] === "solutions"
          ? solutions.find((s) => s.slug === slug[1])
          : slug[0] === "portfolio"
            ? projects.find((s) => s.slug === slug[1])
            : undefined
      : undefined;
  if (d) return metadataFor(path, d.title, d.intro);
  return { title: "Page not found", robots: { index: false, follow: false } };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  if (slug.length === 1 && main[slug[0]]) {
    const Component = main[slug[0]].component;
    return <Component />;
  }
  if (slug.length === 2) {
    if (slug[0] === "services") {
      const s = services.find((x) => x.slug === slug[1]);
      if (s) return <ServicePage service={s} />;
    }
    if (slug[0] === "solutions") {
      const s = solutions.find((x) => x.slug === slug[1]);
      if (s) return <SolutionPage solution={s} />;
    }
    if (slug[0] === "portfolio" && projects.some((p) => p.slug === slug[1]))
      return <ProjectPage slug={slug[1]} />;
  }
  notFound();
}
