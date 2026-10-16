// One stylesheet: globals.css imports the shared fonts, tokens and lockup first.
import "./globals.css";
import type { Metadata } from "next";
import { Navigation } from "@/components/site/navigation";
import { Footer } from "@/components/site/shared";
import { LivePreviewRefresh } from "@/components/site/live-preview-refresh";
import { PreviewBar } from "@/components/site/preview-bar";
import { getNavigationMenu } from "@/lib/cms/catalog";
import { getSiteSettings } from "@/lib/cms/pages";
import { getViewer } from "@/lib/cms/preview";
import { site } from "@/lib/site";

// Every public page is rendered on request: the header menus, /services,
// /solutions, /portfolio and the homepage read published CMS content, so a
// publish in /admin appears on the next page load without a rebuild.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteSettings();
  const name = settings.siteName || site.name;
  return {
  metadataBase: new URL(site.url),
  title: {
    default: name,
    template: `%s | ${name}`,
  },
  description: settings.seo.description || settings.tagline,
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
}
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ settings }, menu, viewer] = await Promise.all([
    getSiteSettings(),
    getNavigationMenu(),
    getViewer(),
  ]);
  const address = settings.postalAddress;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.siteName || site.name,
    url: site.url,
    ...(settings.email ? { email: settings.email } : {}),
    ...(settings.phone ? { telephone: settings.phone } : {}),
    logo: site.url + "/brand/deltawave_corporate_blue_512px.png",
    ...(settings.social.length > 0 ? { sameAs: settings.social.map((s) => s.url) } : {}),
    ...(address.street || address.locality
      ? {
          address: {
            "@type": "PostalAddress",
            ...(address.street ? { streetAddress: address.street } : {}),
            ...(address.locality ? { addressLocality: address.locality } : {}),
            ...(address.region ? { addressRegion: address.region } : {}),
            ...(address.postalCode ? { postalCode: address.postalCode } : {}),
            ...(address.country ? { addressCountry: address.country } : {}),
          },
        }
      : {}),
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
        <Navigation menu={menu} settings={settings} />
        <main id="main-content">{children}</main>
        <Footer settings={settings} />
        {viewer.draft && (
          <>
            <PreviewBar />
            <LivePreviewRefresh origin={site.url} />
          </>
        )}
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
