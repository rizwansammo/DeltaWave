import type { Metadata } from "next";
import type { PhotoSource } from "./images";
import { site } from "./site";

const defaultImage = { url: "/images/architecture.jpg", width: 1600, height: 1067, alt: "DeltaWave Technology" };

/**
 * Page metadata. `image` is a CMS sharing image (otherwise the default
 * photograph); `noIndex` keeps a page out of search engines.
 */
export function metadataFor(
  path: string,
  title: string,
  description: string,
  { image, noIndex = false }: { image?: PhotoSource | null; noIndex?: boolean } = {},
): Metadata {
  const share = image
    ? { url: image.src, width: image.width, height: image.height, alt: image.alt }
    : defaultImage;
  const url = (src: string) => (/^https?:\/\//.test(src) ? src : site.url + src);
  return {
    title,
    description,
    alternates: { canonical: site.url + (path === "/" ? "" : path) },
    // Links stay followable only where the site itself may be indexed.
    ...(noIndex ? { robots: { index: false, follow: site.indexable } } : {}),
    openGraph: {
      type: "website",
      siteName: site.name,
      title: title + " | " + site.name,
      description,
      url: site.url + path,
      images: [{ ...share, url: url(share.url) }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [url(share.url)],
    },
  };
}
