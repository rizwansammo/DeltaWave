import type { Media, PageContent, SiteSetting } from "@/payload-types";
import { staticPhoto, type PhotoSource } from "@/lib/images";
import { site } from "@/lib/site";
import { mediaPhoto, text, toLines, toLink, type LinkView } from "./homepage-view";
import { approvedPageContent, approvedSettings } from "./pages-approved";

// The About, Academy and Contact pages, the three directory introductions and
// the shared site settings, as the components render them. Empty strings and
// lists mean "render nothing": a published empty field is never replaced by
// approved copy.

export type HeroView = { label: string; headingLines: string[]; description: string };
export type CtaView = { titleLines: string[]; description: string; service: string };
export type SectionView = { enabled: boolean };
export type PageSeo = { title: string; description: string };

export type PageContentView = {
  about: {
    hero: HeroView;
    image: PhotoSource | null;
    imageCaption: string;
    intro: { eyebrow: string; headingLines: string[]; lead: string; paragraphs: string[] };
    vision: { label: string; headingLines: string[]; body: string };
    mission: { label: string; headingLines: string[]; body: string };
    principles: SectionView & {
      eyebrow: string;
      title: string;
      items: { title: string; description: string }[];
    };
    direction: SectionView & {
      eyebrow: string;
      headingLines: string[];
      body: string;
      link: LinkView | null;
    };
    cta: CtaView;
    seo: PageSeo;
  };
  academy: {
    hero: {
      eyebrow: string;
      headingLines: string[];
      headingAccent: string;
      description: string;
      statusLabel: string;
      image: PhotoSource | null;
    };
    intention: SectionView & { eyebrow: string; headingLines: string[]; paragraphs: string[] };
    topics: SectionView & {
      eyebrow: string;
      title: string;
      groups: { title: string; items: string[] }[];
    };
    next: SectionView & {
      eyebrow: string;
      headingLines: string[];
      body: string;
      link: LinkView | null;
    };
    seo: PageSeo;
  };
  contact: {
    hero: { eyebrow: string; headingLines: string[]; description: string };
    section: { eyebrow: string; headingLines: string[]; detailsIntroLines: string[]; note: string };
    next: SectionView & { eyebrow: string; headingLines: string[]; body: string };
    seo: PageSeo;
  };
  services: { hero: HeroView; heroButton: string; cta: CtaView; seo: PageSeo };
  solutions: {
    hero: HeroView;
    opening: { label: string; body: string; link: LinkView | null };
    cta: CtaView;
    seo: PageSeo;
  };
  portfolio: {
    hero: HeroView;
    note: { statusLabel: string; body: string };
    cta: CtaView;
    seo: PageSeo;
  };
};

export type SettingsView = {
  siteName: string;
  tagline: string;
  email: string;
  phone: string;
  phoneDisplay: string;
  location: string;
  publicWebsite: string;
  postalAddress: {
    street: string;
    locality: string;
    region: string;
    postalCode: string;
    country: string;
  };
  social: { platform: string; url: string }[];
  seo: { title: string; description: string; image: PhotoSource | null };
  headerCta: LinkView | null;
  footer: {
    statementLines: string[];
    locationLabel: string;
    captionLines: string[];
    closingLink: LinkView | null;
  };
};

type Text = string | null | undefined;
type Group = { enabled?: boolean | null } | null | undefined;
type HeroInput = { label?: Text; heading?: Text; description?: Text } | null | undefined;
type CtaInput = { title?: Text; description?: Text; service?: Text } | null | undefined;
type SeoInput = { title?: Text; description?: Text } | null | undefined;

/** A section is shown unless it was explicitly switched off. */
const shown = (group: Group) => group?.enabled !== false;
const lines = (value: Text) => toLines(value);
const items = <T,>(value: T[] | null | undefined) => value ?? [];

const hero = (value: HeroInput): HeroView => ({
  label: text(value?.label),
  headingLines: lines(value?.heading),
  description: text(value?.description),
});

const seoOf = (value: { title?: Text; description?: Text } | null | undefined): PageSeo => ({
  title: text(value?.title),
  description: text(value?.description),
});

const cta = (value: CtaInput): CtaView => ({
  titleLines: lines(value?.title),
  description: text(value?.description),
  service: text(value?.service),
});

// Field values as stored, with images already resolved. Both the CMS path and
// the approved fallback pass through here, so they cannot drift apart.
type Images = { about: PhotoSource | null; academy: PhotoSource | null };

function buildPageContent(doc: PageContentDoc, photos: Images): PageContentView {
  const a = doc.about ?? {};
  const ac = doc.academy ?? {};
  const c = doc.contact ?? {};
  const s = doc.services ?? {};
  const so = doc.solutions ?? {};
  const p = doc.portfolio ?? {};
  return {
    about: {
      hero: hero(a.hero),
      image: photos.about,
      imageCaption: text(a.imageCaption),
      intro: {
        eyebrow: text(a.intro?.eyebrow),
        headingLines: lines(a.intro?.heading),
        lead: text(a.intro?.lead),
        paragraphs: items(a.intro?.paragraphs).map((row) => text(row.text)).filter(Boolean),
      },
      vision: {
        label: text(a.vision?.label),
        headingLines: lines(a.vision?.heading),
        body: text(a.vision?.body),
      },
      mission: {
        label: text(a.mission?.label),
        headingLines: lines(a.mission?.heading),
        body: text(a.mission?.body),
      },
      principles: {
        enabled: shown(a.principles),
        eyebrow: text(a.principles?.eyebrow),
        title: text(a.principles?.title),
        items: items(a.principles?.items)
          .map((row) => ({ title: text(row.title), description: text(row.description) }))
          .filter((row) => row.title || row.description),
      },
      direction: {
        enabled: shown(a.direction),
        eyebrow: text(a.direction?.eyebrow),
        headingLines: lines(a.direction?.heading),
        body: text(a.direction?.body),
        link: toLink(a.direction?.link),
      },
      cta: cta(a.cta),
      seo: seoOf(a.seo),
    },
    academy: {
      hero: {
        eyebrow: text(ac.hero?.eyebrow),
        headingLines: lines(ac.hero?.heading),
        headingAccent: text(ac.hero?.headingAccent),
        description: text(ac.hero?.description),
        statusLabel: text(ac.hero?.statusLabel),
        image: photos.academy,
      },
      intention: {
        enabled: shown(ac.intention),
        eyebrow: text(ac.intention?.eyebrow),
        headingLines: lines(ac.intention?.heading),
        paragraphs: items(ac.intention?.paragraphs).map((row) => text(row.text)).filter(Boolean),
      },
      topics: {
        enabled: shown(ac.topics),
        eyebrow: text(ac.topics?.eyebrow),
        title: text(ac.topics?.title),
        groups: items(ac.topics?.groups)
          .map((group) => ({
            title: text(group.title),
            items: items(group.items).map((row) => text(row.item)).filter(Boolean),
          }))
          .filter((group) => group.title || group.items.length > 0),
      },
      next: {
        enabled: shown(ac.next),
        eyebrow: text(ac.next?.eyebrow),
        headingLines: lines(ac.next?.heading),
        body: text(ac.next?.body),
        link: toLink(ac.next?.link),
      },
      seo: seoOf(ac.seo),
    },
    contact: {
      hero: {
        eyebrow: text(c.hero?.eyebrow),
        headingLines: lines(c.hero?.heading),
        description: text(c.hero?.description),
      },
      section: {
        eyebrow: text(c.section?.eyebrow),
        headingLines: lines(c.section?.heading),
        detailsIntroLines: lines(c.section?.detailsIntro),
        note: text(c.section?.note),
      },
      next: {
        enabled: shown(c.next),
        eyebrow: text(c.next?.eyebrow),
        headingLines: lines(c.next?.heading),
        body: text(c.next?.body),
      },
      seo: seoOf(c.seo),
    },
    services: {
      hero: hero(s.hero),
      heroButton: text(s.heroButton),
      cta: cta(s.cta),
      seo: seoOf(s.seo),
    },
    solutions: {
      hero: hero(so.hero),
      opening: {
        label: text(so.opening?.label),
        body: text(so.opening?.body),
        link: toLink(so.opening?.link),
      },
      cta: cta(so.cta),
      seo: seoOf(so.seo),
    },
    portfolio: {
      hero: hero(p.hero),
      note: { statusLabel: text(p.note?.statusLabel), body: text(p.note?.body) },
      cta: cta(p.cta),
      seo: seoOf(p.seo),
    },
  };
}

// The stored shape, loose enough for both the CMS document and the approved
// copy (which carries image keys instead of media relations).
type Row = { text?: Text };
type PageContentDoc = {
  about?: {
    hero?: HeroInput;
    imageCaption?: Text;
    intro?: { eyebrow?: Text; heading?: Text; lead?: Text; paragraphs?: Row[] | null };
    vision?: { label?: Text; heading?: Text; body?: Text };
    mission?: { label?: Text; heading?: Text; body?: Text };
    principles?: {
      enabled?: boolean | null;
      eyebrow?: Text;
      title?: Text;
      items?: { title?: Text; description?: Text }[] | null;
    };
    direction?: {
      enabled?: boolean | null;
      eyebrow?: Text;
      heading?: Text;
      body?: Text;
      link?: { label?: Text; href?: Text } | null;
    };
    cta?: CtaInput;
    seo?: SeoInput;
  } | null;
  academy?: {
    hero?: {
      eyebrow?: Text;
      heading?: Text;
      headingAccent?: Text;
      description?: Text;
      statusLabel?: Text;
    };
    intention?: { enabled?: boolean | null; eyebrow?: Text; heading?: Text; paragraphs?: Row[] | null };
    topics?: {
      enabled?: boolean | null;
      eyebrow?: Text;
      title?: Text;
      groups?: { title?: Text; items?: { item?: Text }[] | null }[] | null;
    };
    next?: {
      enabled?: boolean | null;
      eyebrow?: Text;
      heading?: Text;
      body?: Text;
      link?: { label?: Text; href?: Text } | null;
    };
    seo?: SeoInput;
  } | null;
  contact?: {
    hero?: { eyebrow?: Text; heading?: Text; description?: Text };
    section?: { eyebrow?: Text; heading?: Text; detailsIntro?: Text; note?: Text };
    next?: { enabled?: boolean | null; eyebrow?: Text; heading?: Text; body?: Text };
    seo?: SeoInput;
  } | null;
  services?: { hero?: HeroInput; heroButton?: Text; cta?: CtaInput; seo?: SeoInput } | null;
  solutions?: {
    hero?: HeroInput;
    opening?: { label?: Text; body?: Text; link?: { label?: Text; href?: Text } | null };
    cta?: CtaInput;
    seo?: SeoInput;
  } | null;
  portfolio?: {
    hero?: HeroInput;
    note?: { statusLabel?: Text; body?: Text };
    cta?: CtaInput;
    seo?: SeoInput;
  } | null;
};

/** The published Page content global, read anonymously. */
export function toPageContentView(doc: PageContent): PageContentView {
  return buildPageContent(doc as PageContentDoc, {
    about: mediaPhoto(doc.about?.image as number | Media | null | undefined),
    academy: mediaPhoto(doc.academy?.hero?.image as number | Media | null | undefined),
  });
}

/** The approved pages, used only while nothing has been published. */
export function approvedPageContentView(): PageContentView {
  const approved = approvedPageContent;
  const doc = {
    ...approved,
    about: {
      ...approved.about,
      intro: {
        ...approved.about.intro,
        paragraphs: approved.about.intro.paragraphs.map((value) => ({ text: value })),
      },
    },
    academy: {
      ...approved.academy,
      intention: {
        ...approved.academy.intention,
        paragraphs: approved.academy.intention.paragraphs.map((value) => ({ text: value })),
      },
      topics: {
        ...approved.academy.topics,
        groups: approved.academy.topics.groups.map((group) => ({
          ...group,
          items: group.items.map((item) => ({ item })),
        })),
      },
    },
  } as PageContentDoc;
  return buildPageContent(doc, {
    about: staticPhoto(approved.about.image),
    academy: staticPhoto(approved.academy.hero.image),
  });
}

type SettingsDoc = {
  identity?: { siteName?: Text; tagline?: Text } | null;
  contact?: {
    email?: Text;
    phone?: Text;
    phoneDisplay?: Text;
    location?: Text;
    publicWebsite?: Text;
    postalAddress?: {
      street?: Text;
      locality?: Text;
      region?: Text;
      postalCode?: Text;
      country?: Text;
    } | null;
  } | null;
  social?: { platform?: Text; url?: Text }[] | null;
  seoDefaults?: { title?: Text; description?: Text } | null;
  header?: { ctaLabel?: Text; ctaHref?: Text } | null;
  footer?: {
    statement?: Text;
    locationLabel?: Text;
    caption?: Text;
    closingLink?: { label?: Text; href?: Text } | null;
  } | null;
};

function buildSettings(doc: SettingsDoc, seoImage: PhotoSource | null): SettingsView {
  return {
    siteName: text(doc.identity?.siteName),
    tagline: text(doc.identity?.tagline),
    email: text(doc.contact?.email),
    phone: text(doc.contact?.phone),
    phoneDisplay: text(doc.contact?.phoneDisplay),
    location: text(doc.contact?.location),
    publicWebsite: text(doc.contact?.publicWebsite),
    postalAddress: {
      street: text(doc.contact?.postalAddress?.street),
      locality: text(doc.contact?.postalAddress?.locality),
      region: text(doc.contact?.postalAddress?.region),
      postalCode: text(doc.contact?.postalAddress?.postalCode),
      country: text(doc.contact?.postalAddress?.country),
    },
    social: items(doc.social)
      .map((row) => ({ platform: text(row.platform), url: text(row.url) }))
      .filter((row) => row.platform && row.url && /^https:\/\//i.test(row.url)),
    seo: {
      title: text(doc.seoDefaults?.title),
      description: text(doc.seoDefaults?.description),
      image: seoImage,
    },
    headerCta: toLink({ label: doc.header?.ctaLabel, href: doc.header?.ctaHref }),
    footer: {
      statementLines: lines(doc.footer?.statement),
      locationLabel: text(doc.footer?.locationLabel),
      captionLines: lines(doc.footer?.caption),
      closingLink: toLink(doc.footer?.closingLink),
    },
  };
}

export function toSettingsView(doc: SiteSetting): SettingsView {
  return buildSettings(
    doc as SettingsDoc,
    mediaPhoto(doc.seoDefaults?.image as number | Media | null | undefined),
  );
}

export function approvedSettingsView(): SettingsView {
  return buildSettings(approvedSettings as SettingsDoc, null);
}

/** The telephone, email and address shown on the contact page and in the footer. */
export const businessContact = (settings: SettingsView) => ({
  siteName: settings.siteName || site.name,
  email: settings.email,
  phone: settings.phone,
  phoneDisplay: settings.phoneDisplay || settings.phone,
  location: settings.location,
  publicWebsite: settings.publicWebsite,
});
