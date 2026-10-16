import type { SiteSetting } from "@/payload-types";
import { site } from "@/lib/site";

// The approved copy of the About, Academy and Contact pages, the three
// directory introductions and the site settings, taken verbatim from the
// prototype components. It is used three times:
//   - scripts/seed-pages.ts publishes it as the initial content;
//   - lib/cms/pages.ts renders it only while nothing has been saved or the
//     database cannot be reached;
//   - the markup tests prove the CMS path renders the approved design.
// Images are keys of lib/images.ts. "\n" is a line break on the page.

export const approvedPageContent = {
  about: {
    hero: {
      label: "About DeltaWave",
      heading: "A thoughtful approach to moving forward.",
      description:
        "We are building a technology enterprise around a simple idea: software should make real work clearer, more connected and easier to manage.",
    },
    image: "workplace",
    imageCaption: "Representative workplace photography",
    intro: {
      eyebrow: "Who we are",
      heading: "Rooted in Bangladesh.\nFocused on useful progress.",
      lead: "DeltaWave Technology brings together software engineering, business applications, IT operations and digital design.",
      paragraphs: [
        "As a developing enterprise, our direction is deliberate: understand the business need, build a sensible solution and make it maintainable. Our current business contact location is in Borhanuddin, Bhola, Bangladesh.",
        "We aim to work with businesses, institutions and organizations that need technology suited to their day to day operations, in Bangladesh and potentially beyond.",
      ],
    },
    vision: {
      label: "Our vision",
      heading: "Technology that opens up better ways of working.",
      body: "To develop a lasting technology enterprise that helps organizations put practical digital systems to use.",
    },
    mission: {
      label: "Our mission",
      heading: "Understand carefully.\nBuild responsibly.",
      body: "To connect business understanding, thoughtful engineering and clear communication in every project we undertake.",
    },
    principles: {
      enabled: true,
      eyebrow: "Our approach",
      title: "The decisions behind the work.",
      items: [
        {
          title: "Business context first",
          description:
            "We look at the people, data and constraints around a problem before selecting a technology.",
        },
        {
          title: "Maintainability by design",
          description:
            "Documentation, access boundaries and an understandable architecture belong in the original scope.",
        },
        {
          title: "Clear commitments",
          description:
            "Scope, responsibilities and acceptance criteria help both sides make informed decisions.",
        },
      ],
    },
    direction: {
      enabled: true,
      eyebrow: "Our direction",
      heading: "A connected technology practice.",
      body: "Our planned direction combines custom software, industry applications, managed infrastructure and creative services. Product exploration begins with coaching management and commerce operations. DeltaWave Academy is a separate planned initiative for practical computer and digital skills.",
      link: { label: "Explore our product directions", href: "/portfolio" },
    },
    cta: {
      title: "Let’s turn a good question into a clear plan.",
      description:
        "Tell us what your business needs to do. We can start with the problem, then define the right scope.",
    },
    seo: {
      title: "About us",
      description:
        "Meet DeltaWave Technology, a developing technology enterprise focused on thoughtful engineering and practical business systems.",
    },
  },
  academy: {
    hero: {
      eyebrow: "DeltaWave Academy",
      heading: "Learn the skills.\nOpen up",
      headingAccent: "possibilities.",
      description:
        "A planned initiative in computer training and digital skills, shaped around practical work and everyday confidence.",
      statusLabel: "In planning · Enrollment is not open",
      image: "education",
    },
    intention: {
      enabled: true,
      eyebrow: "The intention",
      heading: "Learning that connects\nto the real world.",
      paragraphs: [
        "The Academy is planned for phased implementation. Its direction includes foundational computer skills, workplace tools and pathways into digital work.",
        "Course schedules, delivery formats, fees and instructors will be shared only after they are confirmed. There are no open courses or reserved seats at this stage.",
      ],
    },
    topics: {
      enabled: true,
      eyebrow: "Proposed learning areas",
      title: "Build a foundation. Then find your direction.",
      groups: [
        {
          title: "Everyday digital confidence",
          items: [
            "Computer fundamentals",
            "Microsoft Office",
            "Productivity applications",
            "Business software training",
          ],
        },
        {
          title: "Building for the web",
          items: ["Programming fundamentals", "Web development", "Professional IT skills"],
        },
        {
          title: "Creative & business skills",
          items: ["Graphic design", "Digital marketing", "E-commerce operations"],
        },
      ],
    },
    next: {
      enabled: true,
      eyebrow: "A phased initiative",
      heading: "Help us understand\nwhat you want to learn.",
      body: "You can share your interests or suggest a training need for your organization. An enquiry is not enrollment or a place reservation.",
      link: {
        label: "Share your learning interests",
        href: "/contact?service=Academy%20interest",
      },
    },
    seo: {
      title: "DeltaWave Academy",
      description:
        "Our planned computer training and digital skills initiative. Explore proposed learning areas and share your interests.",
    },
  },
  contact: {
    hero: {
      eyebrow: "Contact DeltaWave",
      heading: "What would you like\nto make possible?",
      description:
        "A new idea, a better process or a system that needs attention. We are ready to understand the starting point.",
    },
    section: {
      eyebrow: "Let’s start with your idea",
      heading: "A better way forward\nstarts with a conversation.",
      detailsIntro:
        "Tell us about your business, the challenge\nyou are facing, or the idea you want to explore.",
      note: "A project brief is helpful. A good question is enough to begin.",
    },
    next: {
      enabled: true,
      eyebrow: "What happens next",
      heading: "A conversation before a commitment.",
      body: "We review the context you share, clarify the requirements and discuss an appropriate next step. Please avoid including passwords, payment details or sensitive personal records in an initial enquiry.",
    },
    seo: {
      title: "Contact us",
      description:
        "Discuss your software, IT or digital project with DeltaWave Technology. Contact us in Borhanuddin, Bhola, Bangladesh.",
    },
  },
  services: {
    hero: {
      label: "Our services",
      heading: "Engineering the idea.\nSupporting the everyday.",
      description:
        "Choose a focused service or connect several capabilities around one business goal. The scope starts with what your organization needs to do.",
    },
    heroButton: "Discuss your requirements",
    cta: {
      title: "Not sure where to start?",
      description:
        "Describe the challenge in your own words. We can help identify the right starting point.",
    },
    seo: {
      title: "Our services",
      description:
        "Explore software engineering, industry applications, cloud and managed IT, branding, UI/UX and digital growth services.",
    },
  },
  solutions: {
    hero: {
      label: "Custom solutions for your industry",
      heading: "Your industry.\nYour way of working.",
      description:
        "Explore the kinds of tailored applications we can build. Each solution begins with your workflows, users and operational requirements.",
    },
    opening: {
      label: "Industry applications",
      body: "These are custom development capabilities. They are scoped for each organization and are not a catalog of ready to purchase products.",
      link: { label: "Our industry approach", href: "/services/business-industry-solutions" },
    },
    cta: {
      title: "Your industry is only the starting point.",
      description:
        "Every organization works a little differently. Tell us about the process you would like to improve.",
      service: "Business & industry solutions",
    },
    seo: {
      title: "Custom industry solutions",
      description:
        "Explore tailored applications for commerce, education, healthcare, logistics, finance and other business operations.",
    },
  },
  portfolio: {
    hero: {
      label: "Portfolio & product direction",
      heading: "Useful ideas.\nConsidered possibilities.",
      description:
        "A transparent view of the work we are exploring. We will add approved projects, demonstrations and case studies as they become ready to share.",
    },
    note: {
      statusLabel: "Early product direction",
      body: "The entries below are planned product concepts. Development, launch dates and commercial availability have not been confirmed.",
    },
    cta: {
      title: "Have a problem worth exploring?",
      description:
        "Tell us what your business needs to do. We can start with the problem, then define the right scope.",
    },
    seo: {
      title: "Portfolio & product direction",
      description:
        "Explore the planned coaching management and commerce product concepts from DeltaWave Technology, with clear development status.",
    },
  },
};

export const approvedSettings = {
  identity: {
    siteName: site.name,
    tagline: "Thoughtful software engineering and practical business technology.",
  },
  contact: {
    email: site.email,
    phone: site.phone,
    phoneDisplay: site.phoneDisplay,
    location: site.location,
    publicWebsite: site.publicWebsite,
    postalAddress: {
      street: "Ward 7, Tobgi Union",
      locality: "Borhanuddin, Bhola",
      region: "",
      postalCode: "",
      country: "BD",
    },
  },
  social: [] as NonNullable<SiteSetting["social"]>,
  seoDefaults: {
    title: "",
    description: "",
  },
  header: { ctaLabel: "Let’s talk", ctaHref: "/contact" },
  footer: {
    statement: "Thoughtful engineering.\nPractical business technology.",
    locationLabel: "Based in Bangladesh",
    caption: "Building with a local understanding\nand a wider perspective.",
    closingLink: { label: "Let’s build something useful", href: "/contact" },
  },
};

/** The approved privacy notice, seeded into the Pages collection. */
export const approvedPrivacyPage = {
  slug: "privacy",
  title: "Privacy & enquiries",
  hero: {
    eyebrow: "Privacy & enquiries",
    heading: "A clear purpose for the details you share.",
    description:
      "This notice explains how contact information is used when you enquire about DeltaWave Technology services.",
  },
  body: [
    { h2: "Information you provide" },
    {
      p: [
        "The enquiry form asks for your name, email address, phone number, optional organization, service interest and a project description. Please do not include passwords, payment card information or sensitive records.",
      ],
    },
    { h2: "Why we use it" },
    {
      p: [
        "We use the details to understand your request, communicate with you and assess a possible engagement. Submitting an enquiry does not subscribe you to marketing.",
      ],
    },
    { h2: "Delivery and security" },
    {
      p: [
        "When online submissions are enabled, the form uses Cloudflare Turnstile for spam protection and Resend for email delivery to the business contact inbox. These providers process the information needed to perform those services. The website does not maintain a separate enquiry database.",
      ],
    },
    { h2: "When online delivery is unavailable" },
    {
      p: [
        "The form clearly indicates when it is not configured. You can contact us directly by email or phone. A successful form message is shown only after the email provider confirms acceptance, which does not guarantee inbox delivery.",
      ],
    },
    { h2: "Retention and your requests" },
    {
      p: [
        "Enquiry correspondence is retained in the business inbox while it is needed to respond and manage a possible engagement. For access, correction or deletion requests, contact ",
        { text: site.email, href: "mailto:" + site.email },
        ". Any legal or contractual retention requirements will be considered when handling a request.",
      ],
    },
    { h2: "Cookies and analytics" },
    {
      p: [
        "This website does not add advertising or analytics cookies. If enabled, the spam protection provider may use technical signals for verification. Access to this private preview is managed by the hosting platform, whose own privacy terms apply.",
      ],
    },
    { h2: "Business contact" },
    {
      p: [
        "DeltaWave Technology",
        { br: true },
        site.location,
        { br: true },
        { text: site.email, href: "mailto:" + site.email },
      ],
    },
  ] as PrivacyBlock[],
};

export type PrivacyInline = string | { text: string; href: string } | { br: true };
export type PrivacyBlock = { h2: string } | { p: PrivacyInline[] };

/**
 * Phase 3 revision of the privacy notice for stored enquiries, saved as a
 * DRAFT for the owner's review (scripts/privacy-draft.ts). Not legal advice
 * and not published automatically: the retention period in square brackets
 * must be decided by DeltaWave before publishing.
 */
export const privacyRevisionForEnquiries: PrivacyBlock[] = [
  { h2: "Information you provide" },
  {
    p: [
      "The enquiry form asks for your name, email address, phone number, optional organization, service interest and a project description. Please do not include passwords, payment card information or sensitive records.",
    ],
  },
  { h2: "Why we use it" },
  {
    p: [
      "We use the details to understand your request, communicate with you and assess a possible engagement. Submitting an enquiry does not subscribe you to marketing.",
    ],
  },
  { h2: "How enquiries are stored" },
  {
    p: [
      "Each enquiry you send is saved in the content management system of this website, hosted on our own server. Only DeltaWave administrators can open saved enquiries; website editors and visitors cannot. We record the status of our follow-up and internal notes alongside your enquiry.",
    ],
  },
  { h2: "Delivery and security" },
  {
    p: [
      "The form uses Cloudflare Turnstile for spam protection. After an enquiry is saved, a notification is sent by email to the business inbox through our email service. These providers process the information needed to perform those services. If the notification cannot be sent, your enquiry stays saved and is reviewed in the system; the form only confirms what actually happened.",
    ],
  },
  { h2: "Retention and your requests" },
  {
    p: [
      "Enquiries are kept while they are needed to respond and to manage a possible engagement, and for no longer than [retention period to be confirmed by DeltaWave, for example 24 months after our last contact]. For access, correction or deletion requests, contact ",
      { text: site.email, href: "mailto:" + site.email },
      ". Any legal or contractual retention requirements will be considered when handling a request.",
    ],
  },
  { h2: "Cookies and analytics" },
  {
    p: [
      "This website does not add advertising or analytics cookies. The spam protection provider may use technical signals for verification. Signed-in staff use a session cookie for the content management system.",
    ],
  },
  { h2: "Business contact" },
  {
    p: [
      "DeltaWave Technology",
      { br: true },
      site.location,
      { br: true },
      { text: site.email, href: "mailto:" + site.email },
    ],
  },
];
