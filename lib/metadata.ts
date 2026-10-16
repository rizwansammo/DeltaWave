import type { Metadata } from "next";
import { site } from "./site";
export function metadataFor(
  path: string,
  title: string,
  description: string,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: site.url + (path === "/" ? "" : path) },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: title + " | " + site.name,
      description,
      url: site.url + path,
      images: [
        {
          url: site.url + "/images/architecture.jpg",
          width: 1600,
          height: 1067,
          alt: "DeltaWave Technology",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [site.url + "/images/architecture.jpg"],
    },
  };
}
