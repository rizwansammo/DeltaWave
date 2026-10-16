// Approved photography in public/images (see docs/IMAGE_CREDITS.md). Each
// photo ships as a JPEG plus WebP files at 640 px, 1100 px and full width.

export type PhotoSource = {
  src: string;
  /** WebP candidates for <source srcset>; empty when there are none. */
  srcSet: string;
  width: number;
  height: number;
  alt: string;
};

export const images: Record<
  string,
  { file: string; alt: string; width: number; height: number; credit: string }
> = {
  architecture: {
    file: "architecture",
    alt: "White modern architecture viewed against a pale blue sky",
    width: 2200,
    height: 1467,
    credit: "Scott Webb, Unsplash. Unsplash License.",
  },
  detail: {
    file: "detail",
    alt: "Silver architectural facade with a precise repeating pattern",
    width: 1800,
    height: 2267,
    credit: "Simone Hutsch, Unsplash. Unsplash License.",
  },
  workplace: {
    file: "workplace",
    alt: "An editorial photograph of people collaborating around laptops",
    width: 1600,
    height: 1067,
    credit: "Annie Spratt, Unsplash. Unsplash License.",
  },
  servers: {
    file: "servers",
    alt: "Network cabling and server cabinets illustrating IT infrastructure",
    width: 1600,
    height: 898,
    credit: "Taylor Vick, Unsplash. Unsplash License.",
  },
  education: {
    file: "education",
    alt: "A student using a laptop, illustrating digital learning",
    width: 1500,
    height: 2250,
    credit: "Hasnain Ayaz, Unsplash. Unsplash License.",
  },
  logistics: {
    file: "logistics",
    alt: "Warehouse shelving illustrating stock and distribution operations",
    width: 1500,
    height: 998,
    credit: "CHUTTERSNAP, Unsplash. Unsplash License.",
  },
};

/** A photo from public/images, rendered exactly as in the prototype. */
export function staticPhoto(name: string): PhotoSource {
  const p = images[name] || images.architecture;
  return {
    src: `/images/${p.file}.jpg`,
    srcSet: `/images/${p.file}-640.webp 640w, /images/${p.file}-1100.webp 1100w, /images/${p.file}.webp ${p.width}w`,
    width: p.width,
    height: p.height,
    alt: p.alt,
  };
}
