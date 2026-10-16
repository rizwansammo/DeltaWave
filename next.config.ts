import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const noIndex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

// Content Security Policy for production. Scripts and styles come from this
// site only, plus Cloudflare Turnstile for the enquiry form. Next.js and the
// Payload admin need inline scripts and styles ('unsafe-inline'); no eval, no
// plugins, no framing by other sites, and forms only post back to this site.
// R2_PUBLIC_URL is allowed for images when media is served from a public
// bucket. Development keeps Next.js's own defaults (it needs eval).
function contentSecurityPolicy() {
  const turnstile = "https://challenges.cloudflare.com";
  const media = process.env.R2_PUBLIC_URL ? " " + new URL(process.env.R2_PUBLIC_URL).origin : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${turnstile}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${media}`,
    "font-src 'self' data:",
    `connect-src 'self' ${turnstile}`,
    `frame-src 'self' ${turnstile}`,
    "frame-ancestors 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}
const production = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    localPatterns: [{ pathname: "/cms-api/media/file/**" }],
  },
  turbopack: {
    root: dirname,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          ...(production ? [{ key: "Content-Security-Policy", value: contentSecurityPolicy() }] : []),
        ],
      },
      // A draft preview is never indexed or stored in a shared cache.
      {
        source: "/:path*",
        has: [{ type: "cookie", key: "__prerender_bypass" }],
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
        ],
      },
      // Private CMS routes are never indexed, independent of robots.txt.
      { source: "/admin", headers: noIndex },
      { source: "/admin/:path*", headers: noIndex },
      { source: "/cms-api/:path*", headers: noIndex },
    ];
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
