// The approved homepage content, copied verbatim from the prototype's HomePage
// component (DeltaWave-UI components/site/pages.tsx). It is used twice:
//   - scripts/seed-homepage.ts publishes it as the initial Homepage global;
//   - lib/cms/homepage.ts renders it only while no homepage has ever been
//     published or when the database cannot be reached.
// Images are keys of lib/images.ts. Featured items are slugs of lib/content.ts.
// Line breaks ("\n") are line breaks on the page.

export const approvedHomepage = {
  hero: {
    eyebrow: "Software. Systems. Possibility.",
    heading: "Technology that\nmoves business",
    headingAccent: "forward.",
    description:
      "We bring software engineering, business technology and thoughtful design together to help you build what comes next.",
    primaryLink: { label: "Build with us", href: "/contact" },
    secondaryLink: { label: "Explore our services", href: "/services" },
    scrollLabel: "A considered approach to technology",
    image: "architecture",
    imageCaption: "Engineering digital progress.",
  },
  introduction: {
    enabled: true,
    eyebrow: "Meet DeltaWave",
    location: "Based in Bangladesh.\nBuilt with a wider perspective.",
    heading: "Good technology starts\nwith understanding",
    headingMuted: "your business.",
    body: "DeltaWave Technology is a developing technology enterprise focused on useful, maintainable software and dependable IT. We start with the way your organization works, then shape the right solution around it.",
    link: { label: "Get to know us", href: "/about" },
  },
  services: {
    enabled: true,
    eyebrow: "What we do",
    heading: "From the first idea to the everyday operation.",
    sideText: "Four connected capabilities.\nOne practical approach.",
    link: { label: "All services", href: "/services" },
    featureImage: "workplace",
    featureCaption: "Ideas become useful when people can work with them.",
  },
  industries: {
    enabled: true,
    eyebrow: "Solutions we can build",
    heading: "Built for the way your industry works.",
    sideText:
      "Specific challenges deserve specific solutions. Explore applications shaped around your operations.",
    link: { label: "Explore all industries", href: "/solutions" },
    featured: [
      "ecommerce-facebook",
      "education-coaching",
      "retail-pos-restaurant",
      "healthcare-diagnostics",
      "logistics-delivery",
      "business-process-automation",
    ],
  },
  engineering: {
    enabled: true,
    eyebrow: "The foundation matters",
    heading: "Built to work.\nDesigned to last.",
    body: "Architecture, access, deployment and recovery deserve the same attention as the interface. We consider how a system will be operated long after its first release.",
    link: { label: "Explore our technical approach", href: "/services/cloud-managed-it" },
    image: "servers",
    capabilities: [
      "Software & SaaS architecture",
      "Cloud infrastructure & DevOps",
      "Systems integration & automation",
    ],
  },
  portfolio: {
    enabled: true,
    eyebrow: "Product directions",
    heading: "Ideas with a practical purpose.",
    sideText:
      "A look at the products we are exploring.\nThese concepts are not commercially available.",
    link: { label: "View our portfolio", href: "/portfolio" },
    projects: ["coaching-management", "commerce-management"],
  },
  approach: {
    enabled: true,
    eyebrow: "How we think",
    heading: "Clarity at every step.",
    body: "Good delivery is a series of informed decisions. We keep the work understandable, reviewable and connected to your goals.",
    steps: [
      {
        title: "Understand the work",
        description:
          "Map the business process, listen to the people involved and identify what needs to change.",
      },
      {
        title: "Define what matters",
        description:
          "Agree a realistic scope, the right architecture and a useful first release.",
      },
      {
        title: "Build, review, refine",
        description:
          "Work in visible stages with clear acceptance criteria and room for informed feedback.",
      },
      {
        title: "Prepare for everyday use",
        description:
          "Plan the handover, documentation, maintenance and support the system will need.",
      },
    ],
  },
  academy: {
    enabled: true,
    eyebrow: "DeltaWave Academy",
    heading: "Practical skills.\nNew possibilities.",
    body: "A planned initiative in computer training and digital skills. Designed to connect learning with the tools people use in work and business.",
    statusLabel: "In planning · Enrollment is not open",
    link: { label: "Discover the Academy", href: "/academy" },
    image: "education",
  },
  contact: {
    enabled: true,
    eyebrow: "Let’s start with your idea",
    heading: "A better way forward\nstarts with a conversation.",
  },
};
