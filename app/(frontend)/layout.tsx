// One stylesheet: globals.css imports the shared fonts, tokens and lockup first.
import "./globals.css";
import type { Metadata } from "next";
import { Navigation } from "@/components/site/navigation";
import { Footer } from "@/components/site/shared";
import { site } from "@/lib/site";
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "DeltaWave Technology",
    template: "%s | DeltaWave Technology",
  },
  description:
    "Thoughtful software engineering and practical business technology.",
  icons: {
    icon: [
      {
        url: "/brand/deltawave_corporate_white_optical_16px.png",
        sizes: "16x16",
        type: "image/png",
      },
      { url: "/favicon.png?v=white-1", sizes: "32x32", type: "image/png" },
      {
        url: "/brand/deltawave_corporate_white_optical_48px.png",
        sizes: "48x48",
        type: "image/png",
      },
    ],
    apple: "/brand/deltawave_corporate_blue_256px.png",
  },
  robots: { index: site.indexable, follow: site.indexable },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    email: site.email,
    telephone: site.phone,
    logo: site.url + "/brand/deltawave_corporate_blue_512px.png",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Ward 7, Tobgi Union",
      addressLocality: "Borhanuddin, Bhola",
      addressCountry: "BD",
    },
  };
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/fonts/elnath.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/manrope-400.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Navigation />
        <main id="main-content">{children}</main>
        <Footer />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
