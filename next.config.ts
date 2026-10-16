import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const noIndex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

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
