import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import {
  BlockquoteFeature,
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";
import { Enquiries } from "./cms/collections/Enquiries";
import { Media } from "./cms/collections/Media";
import { Pages } from "./cms/collections/Pages";
import { PortfolioProjects } from "./cms/collections/PortfolioProjects";
import { ServiceCategories } from "./cms/collections/ServiceCategories";
import { Services } from "./cms/collections/Services";
import { Solutions } from "./cms/collections/Solutions";
import { Users } from "./cms/collections/Users";
import { Homepage } from "./cms/globals/Homepage";
import { PageContent } from "./cms/globals/PageContent";
import { SiteSettings } from "./cms/globals/SiteSettings";
import { SmtpSettings } from "./cms/globals/SmtpSettings";
import { livePreviewBreakpoints, livePreviewEntities, previewPathFor, previewUrl } from "./cms/preview";
import { cmsEmailAdapter } from "./lib/mail";
import { site } from "./lib/site";
import { storagePlugins } from "./lib/storage";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// The CMS shares the public site's origin: /admin for the panel and /cms-api
// for Payload's REST API, which keeps /api/enquiry free for the existing form.
const serverURL = site.url;

const secret = process.env.PAYLOAD_SECRET;
if (!secret || secret.length < 32) {
  throw new Error("PAYLOAD_SECRET must be set to at least 32 random characters.");
}

export default buildConfig({
  serverURL,
  secret,
  routes: {
    admin: "/admin",
    api: "/cms-api",
  },
  admin: {
    user: Users.slug,
    theme: "light",
    avatar: "default",
    importMap: { baseDir: dirname },
    // Staff preview drafts in the real design. /api/preview checks the
    // signed-in account before enabling Next.js draft mode.
    livePreview: {
      ...livePreviewEntities,
      breakpoints: livePreviewBreakpoints,
      url: ({ collectionConfig, data, globalConfig }) => {
        const entity = collectionConfig?.slug ?? globalConfig?.slug ?? "";
        const path = previewPathFor(entity, data ?? {});
        return path ? previewUrl(path) : "";
      },
    },
    meta: {
      // Payload inserts the space before the suffix.
      titleSuffix: "| DeltaWave CMS",
      description: "DeltaWave Technology content administration.",
      robots: "noindex, nofollow",
      defaultOGImageType: "off",
      icons: [
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          url: "/brand/deltawave_corporate_white_optical_16px.png",
        },
        { rel: "icon", type: "image/png", sizes: "32x32", url: "/favicon.png?v=white-1" },
        {
          rel: "icon",
          type: "image/png",
          sizes: "48x48",
          url: "/brand/deltawave_corporate_white_optical_48px.png",
        },
        {
          rel: "apple-touch-icon",
          type: "image/png",
          url: "/brand/deltawave_corporate_blue_256px.png",
        },
      ],
    },
    components: {
      graphics: {
        Logo: "/components/cms/admin-logo#AdminLogo",
        Icon: "/components/cms/admin-icon#AdminIcon",
      },
      beforeNavLinks: [
        "/components/cms/nav-brand#NavBrand",
        "/components/cms/sidebar-overview#SidebarOverview",
      ],
      afterNavLinks: ["/components/cms/sidebar-utilities#SidebarUtilities"],
      beforeDashboard: ["/components/cms/dashboard-intro#DashboardIntro"],
      views: {
        createFirstUser: {
          Component: "/components/cms/create-first-user#BrandedCreateFirstUser",
        },
      },
    },
  },
  collections: [
    Pages,
    ServiceCategories,
    Services,
    Solutions,
    PortfolioProjects,
    Media,
    Enquiries,
    Users,
  ],
  // Password resets and enquiry notifications use the SMTP server that
  // administrators configure in the CMS, read on every send (lib/mail.ts).
  email: cmsEmailAdapter,
  // Cloudflare R2 when configured, otherwise the persistent media volume.
  plugins: storagePlugins(),
  globals: [Homepage, PageContent, SiteSettings, SmtpSettings],
  // A deliberately small rich text toolset keeps editorial pages consistent
  // with the design system.
  editor: lexicalEditor({
    features: () => [
      ParagraphFeature(),
      HeadingFeature({ enabledHeadingSizes: ["h2", "h3"] }),
      BoldFeature(),
      ItalicFeature(),
      LinkFeature(),
      UnorderedListFeature(),
      OrderedListFeature(),
      BlockquoteFeature(),
      FixedToolbarFeature(),
      InlineToolbarFeature(),
    ],
  }),
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL },
    migrationDir: path.resolve(dirname, "migrations"),
  }),
  sharp,
  // The site reads content through the Local API. GraphQL stays off to keep
  // the public attack surface small.
  graphQL: { disable: true },
  csrf: [serverURL],
  cors: [serverURL],
  maxDepth: 4,
  upload: {
    limits: { fileSize: 10 * 1024 * 1024 },
  },
  telemetry: false,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
