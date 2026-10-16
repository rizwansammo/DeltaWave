export type Service = {
  slug: string;
  title: string;
  short: string;
  category: string;
  intro: string;
  problem: string;
  audience: string;
  deliverables: string[];
  approach: string;
  technology: string;
  related: string[];
};
export const categories = [
  {
    slug: "software-engineering",
    number: "01",
    title: "Software engineering & SaaS",
    short: "Purposeful software. Built around your business.",
    description:
      "From a focused internal application to a platform serving many organizations, turn business requirements into maintainable software.",
    image: "workplace",
    links: [
      "custom-software-development",
      "saas-development",
      "web-application-development",
      "mobile-desktop-applications",
      "erp-crm-automation",
      "api-system-integration",
    ],
  },
  {
    slug: "business-industry-solutions",
    number: "02",
    title: "Business & industry solutions",
    short: "Your operations, understood.",
    description:
      "Applications shaped around the people, processes and practical constraints of your industry.",
    image: "logistics",
    links: [],
  },
  {
    slug: "cloud-managed-it",
    number: "03",
    title: "Cloud infrastructure & managed IT",
    short: "A dependable foundation for daily work.",
    description:
      "Practical infrastructure, deployment and support for the systems your business relies on.",
    image: "servers",
    links: [
      "cloud-server-administration",
      "microsoft-365-google-workspace",
      "managed-it-support",
      "devops-monitoring-backup",
    ],
  },
  {
    slug: "creative-digital-growth",
    number: "04",
    title: "Creative & digital growth",
    short: "Clear design. A considered digital presence.",
    description:
      "Bring brand, product experience and digital communication together with a clear business purpose.",
    image: "architecture",
    links: [
      "branding-graphic-design",
      "ui-ux-design",
      "video-production-editing",
      "seo-digital-marketing",
    ],
  },
];
export const services: Service[] = [
  {
    slug: "software-engineering",
    title: "Software engineering & SaaS development",
    short: "Build the software your next stage needs.",
    category: "software-engineering",
    intro:
      "Useful software begins with a clear understanding of how a business works. We plan custom applications, SaaS products and connected systems around the tasks that matter to your team.",
    problem:
      "Spreadsheets, disconnected tools and workarounds can become difficult to maintain as operations grow. A considered software foundation brings data and responsibilities into a system people can use.",
    audience:
      "Businesses planning an internal platform, founders shaping a SaaS product, and organizations modernizing existing software.",
    deliverables: [
      "Requirements discovery and technical architecture",
      "Custom web, mobile and desktop applications",
      "SaaS platforms and multi-tenant architecture",
      "ERP, CRM and workflow automation",
      "Database applications, migration and reporting",
      "Maintenance, modernization and technical documentation",
    ],
    approach:
      "We identify the smallest useful release, agree acceptance criteria and work in reviewable stages. Testing, access controls and a clear handover belong in the delivery plan from the beginning.",
    technology:
      "Architecture is selected for the product, team and hosting requirements. React, TypeScript, Python, relational databases and cloud services are options rather than a fixed prescription.",
    related: [
      "business-process-automation",
      "education-coaching",
      "ecommerce-facebook",
    ],
  },
  {
    slug: "custom-software-development",
    title: "Custom software development",
    short: "Software that fits the way you work.",
    category: "software-engineering",
    intro:
      "Design a business application around your actual process, from an internal approval tool to a connected management platform. The scope starts with your users and the decisions they need to make.",
    problem:
      "Off the shelf systems can leave important gaps. Repeated data entry, unclear ownership and manual reporting are signals that a focused custom application may help.",
    audience:
      "Operations teams with a defined workflow, organizations replacing a fragile internal tool, and businesses with specialist requirements.",
    deliverables: [
      "Process mapping and a prioritized requirements brief",
      "User roles, permissions and approval workflows",
      "Database design and reporting views",
      "Accessible interfaces and tested business rules",
      "Import tools, handover notes and maintenance plan",
    ],
    approach:
      "First, document the current process and exceptions. Then validate a small prototype with the people who will use it. Deliver the highest value workflow before expanding the application.",
    technology:
      "Web frameworks and relational databases can support most business workflows. Hosting, data retention and integration requirements are agreed before implementation.",
    related: [
      "professional-services",
      "ngo-nonprofit",
      "business-process-automation",
    ],
  },
  {
    slug: "saas-development",
    title: "SaaS & product development",
    short: "A product foundation built for its next release.",
    category: "software-engineering",
    intro:
      "Shape a product idea into a cloud application with clear boundaries, a focused first release and a plan for ongoing operation. Product decisions and engineering decisions are considered together.",
    problem:
      "A SaaS application needs more than a set of screens. Customer onboarding, data isolation, subscription rules and operational support all affect whether the product can be maintained.",
    audience:
      "Founders exploring a software product, businesses creating a customer platform, and teams improving an existing SaaS foundation.",
    deliverables: [
      "Product scope and release roadmap",
      "Tenant isolation and organization access design",
      "Account onboarding and subscription workflows",
      "Administration, usage reporting and audit records",
      "Automated tests and release documentation",
    ],
    approach:
      "We validate the core user journey before building secondary features. Tenant access boundaries, recovery procedures and deployment practices are reviewed before a wider launch.",
    technology:
      "Multi-tenant architecture, relational databases, APIs, background jobs and cloud hosting are selected according to the product and expected usage.",
    related: ["education-coaching", "ecommerce-facebook", "events-membership"],
  },
  {
    slug: "web-application-development",
    title: "Web application development",
    short: "Business tools that work wherever work happens.",
    category: "software-engineering",
    intro:
      "Create responsive portals, business applications and corporate websites that make information easier to find and tasks easier to complete.",
    problem:
      "A dated interface or fragmented online process can make straightforward work unnecessarily difficult. The right web experience removes steps while preserving the controls a business needs.",
    audience:
      "Organizations needing customer portals, operational applications or a credible corporate website.",
    deliverables: [
      "Responsive interface and information architecture",
      "Customer or staff portals with appropriate access",
      "Content and administration workflows",
      "API connections and reporting dashboards",
      "Accessibility, performance and search foundations",
    ],
    approach:
      "We map the key journeys, test the information hierarchy and build a usable first release. Performance and accessibility are reviewed alongside features, not added after the design is finished.",
    technology:
      "React, TypeScript, modern server rendering and content systems can be used where they fit the project. Static content stays lightweight.",
    related: ["real-estate-property", "professional-services", "ngo-nonprofit"],
  },
  {
    slug: "mobile-desktop-applications",
    title: "Mobile & desktop applications",
    short: "The right application for the working environment.",
    category: "software-engineering",
    intro:
      "Plan applications for field teams, customer devices and office workstations, with interaction patterns suited to their screens and connectivity.",
    problem:
      "Some work happens away from a desk or depends on device features. A browser alone may not be the right interface for scanning, offline data entry or specialized workstation tasks.",
    audience:
      "Field operations, service businesses and teams that need reliable device based workflows.",
    deliverables: [
      "Platform and device requirements assessment",
      "Touch friendly or workstation focused interfaces",
      "Offline workflows and synchronization where required",
      "Device capability and API integration",
      "Release packaging, update plan and user guidance",
    ],
    approach:
      "We confirm the target devices and distribution method early. A proof of the most constrained workflow, such as offline synchronization, helps establish a realistic implementation scope.",
    technology:
      "Native or cross platform technology is chosen after evaluating device integration, support burden and long term maintenance.",
    related: [
      "logistics-delivery",
      "agriculture-fisheries",
      "retail-pos-restaurant",
    ],
  },
  {
    slug: "erp-crm-automation",
    title: "ERP, CRM & business automation",
    short: "Connect the work between your teams.",
    category: "software-engineering",
    intro:
      "Bring sales, operations and management information into connected workflows. Build focused business modules instead of forcing every process into one oversized implementation.",
    problem:
      "When customer records, stock movements and approvals live in separate files, teams can work from different versions of the same information.",
    audience:
      "Growing businesses coordinating sales, purchasing, service delivery or internal approvals.",
    deliverables: [
      "Business process and responsibility mapping",
      "Customer, vendor and operational records",
      "Approval routing and workflow automation",
      "Management reports and role based dashboards",
      "Data migration and reconciliation plans",
    ],
    approach:
      "We agree a common data model and ownership rules first. Modules are introduced in stages, with a defined import process and checks against the existing records.",
    technology:
      "Relational databases, event driven workflows and documented APIs support modular implementation. Existing platforms can be integrated where replacing them would add little value.",
    related: [
      "human-resources-payroll",
      "accounting-finance",
      "wholesale-distribution",
    ],
  },
  {
    slug: "api-system-integration",
    title: "API & system integration",
    short: "Make your existing systems work together.",
    category: "software-engineering",
    intro:
      "Connect applications and automate the movement of information through clear, documented interfaces. Integration work should make failures visible and recovery manageable.",
    problem:
      "Manual transfers between systems introduce duplicate work and mismatched records. Unreliable integrations can be just as disruptive when they fail without warning.",
    audience:
      "Businesses connecting payment, delivery, commerce, reporting or internal management systems.",
    deliverables: [
      "Integration discovery and data mapping",
      "Documented APIs and webhook handling",
      "Authentication and permission design",
      "Retries, duplicate protection and failure reporting",
      "Migration tooling and operational runbooks",
    ],
    approach:
      "We verify provider capabilities and access before committing to a workflow. Test environments, representative data and reconciliation checks are used before production connections are activated.",
    technology:
      "REST APIs, webhooks, queues and scheduled jobs are selected according to each provider. Credentials remain on the server and are managed separately from application code.",
    related: [
      "ecommerce-facebook",
      "logistics-delivery",
      "business-process-automation",
    ],
  },
  {
    slug: "business-industry-solutions",
    title: "Business & industry solutions",
    short: "Start with the operation. Shape the software around it.",
    category: "business-industry-solutions",
    intro:
      "An education platform, a delivery operation and a clinic have different working realities. Our industry approach begins with the people using the system and the information they depend on.",
    problem:
      "Generic software can miss local processes, approval rules and reporting needs. A useful industry application must account for everyday exceptions as well as the ideal workflow.",
    audience:
      "Businesses and organizations exploring a tailored system for a specific operational need.",
    deliverables: [
      "Industry workflow discovery",
      "Scope, user roles and data model",
      "Module priorities and integration assessment",
      "A reviewable prototype and delivery roadmap",
      "Training and adoption considerations",
    ],
    approach:
      "We interview the people doing the work, map the full transaction and identify where records change hands. A pilot workflow helps validate the design before the system expands.",
    technology:
      "Capabilities can include business management, commerce, education, retail, restaurant, healthcare, distribution and logistics applications. Each solution is scoped individually.",
    related: [
      "retail-pos-restaurant",
      "healthcare-diagnostics",
      "education-coaching",
    ],
  },
  {
    slug: "cloud-managed-it",
    title: "Cloud infrastructure & managed IT",
    short: "Keep the foundation as considered as the software.",
    category: "cloud-managed-it",
    intro:
      "Bring structure to the infrastructure, accounts and operational practices behind your applications. Plan a support arrangement around the systems your business actually uses.",
    problem:
      "Unclear ownership, inconsistent configuration and untested backups make everyday operations harder to manage. Infrastructure needs visibility and an agreed plan for change.",
    audience:
      "Businesses running hosted applications, remote teams and organizations needing a defined IT operations scope.",
    deliverables: [
      "Infrastructure inventory and operational review",
      "Cloud hosting, Linux and Windows administration",
      "Network and endpoint management planning",
      "Microsoft 365 and Google Workspace administration",
      "Identity, secure configuration and access reviews",
      "Monitoring, backup and recovery procedures",
    ],
    approach:
      "We begin with a discovery review and agree ownership, access, service scope and escalation. Changes are documented and introduced with verification and recovery steps.",
    technology:
      "Cloud platforms, virtualization, containers and administration tools are selected around existing infrastructure. Support hours and service commitments are agreed separately.",
    related: ["professional-services", "education-coaching", "ngo-nonprofit"],
  },
  {
    slug: "cloud-server-administration",
    title: "Cloud & server administration",
    short: "A clear operating plan for your servers.",
    category: "cloud-managed-it",
    intro:
      "Set up and administer cloud resources, Linux servers and Windows environments with documented configurations and responsibilities.",
    problem:
      "A server can appear healthy while patching, storage, certificates or access management are being overlooked. Regular administration gives these responsibilities a defined place.",
    audience:
      "Businesses hosting websites and applications, and teams that need help operating an existing server environment.",
    deliverables: [
      "Server and cloud resource inventory",
      "Hosting and application deployment configuration",
      "Operating system and service administration",
      "Secure access and configuration review",
      "Capacity observations and maintenance documentation",
    ],
    approach:
      "Discovery comes before changes. We record the current state, confirm backup and recovery options, and implement agreed changes in a suitable maintenance window.",
    technology:
      "Linux, Windows Server, web servers, containers and cloud networking may be included. Provider costs and service availability are established during scoping.",
    related: [
      "ecommerce-facebook",
      "professional-services",
      "hospitality-tourism",
    ],
  },
  {
    slug: "microsoft-365-google-workspace",
    title: "Microsoft 365 & Google Workspace",
    short: "Give your team a well managed workspace.",
    category: "cloud-managed-it",
    intro:
      "Manage the accounts, email, collaboration settings and access policies that support your working day.",
    problem:
      "Ad hoc user onboarding and inconsistent permissions can leave shared information difficult to manage. A documented workspace makes account changes and support more predictable.",
    audience:
      "Small and growing organizations using Microsoft 365 or Google Workspace.",
    deliverables: [
      "Tenant configuration and account administration",
      "User onboarding and offboarding procedures",
      "Group, shared resource and permission management",
      "Identity and authentication settings review",
      "Migration planning and end user guidance",
    ],
    approach:
      "We review the current tenant and agree who can approve changes. Migration scope, mail flow and access dependencies are checked before any transition.",
    technology:
      "Microsoft 365, Entra ID and Google Workspace administration depend on the organization’s subscriptions. Licensing and required features are confirmed before implementation.",
    related: [
      "professional-services",
      "ngo-nonprofit",
      "human-resources-payroll",
    ],
  },
  {
    slug: "managed-it-support",
    title: "Managed IT support",
    short: "Practical help, with clear ownership.",
    category: "cloud-managed-it",
    intro:
      "Create a defined support process for user accounts, devices, applications and everyday technical issues.",
    problem:
      "When support depends on scattered messages, requests lose context and recurring issues remain unresolved. A shared process helps set priorities and keep useful records.",
    audience:
      "Businesses needing remote technical support and organizations looking to formalize internal IT responsibilities.",
    deliverables: [
      "Support scope, intake and escalation process",
      "Endpoint and user account administration",
      "Remote troubleshooting and incident records",
      "Network administration within an agreed scope",
      "Knowledge base and recurring issue review",
    ],
    approach:
      "We agree supported systems, access methods, response arrangements and escalation contacts. The arrangement can then be reviewed against the issues the business actually experiences.",
    technology:
      "Ticketing, remote assistance and endpoint management tools are selected according to access and privacy requirements. No around the clock commitment is implied without an agreement.",
    related: [
      "retail-pos-restaurant",
      "education-coaching",
      "professional-services",
    ],
  },
  {
    slug: "devops-monitoring-backup",
    title: "DevOps, monitoring & backup",
    short: "Make releases and recovery repeatable.",
    category: "cloud-managed-it",
    intro:
      "Create reliable delivery and operations routines so that deployments, alerts and recovery steps do not depend on memory.",
    problem:
      "Manual releases and untested backups can hide dependencies until something goes wrong. Automation is most useful when it includes verification and a clear way back.",
    audience:
      "Software teams and businesses operating applications with regular updates or important business data.",
    deliverables: [
      "CI/CD pipelines and deployment automation",
      "Infrastructure automation and configuration records",
      "Health checks and actionable monitoring",
      "Backup schedules and retention design",
      "Restore exercises and rollback runbooks",
    ],
    approach:
      "We assess the current release and recovery paths, then automate a small verified workflow. Alerts are connected to an owner, and backup success is distinguished from a tested restoration.",
    technology:
      "Git based pipelines, Docker, monitoring systems and backup tooling are chosen for the environment. Recovery objectives must be agreed and tested for each system.",
    related: [
      "business-process-automation",
      "ecommerce-facebook",
      "accounting-finance",
    ],
  },
  {
    slug: "creative-digital-growth",
    title: "Creative & digital growth services",
    short: "Bring clarity to how your business is seen.",
    category: "creative-digital-growth",
    intro:
      "Connect visual identity, digital experience and communication around a clear audience and business objective.",
    problem:
      "Disconnected creative work can leave a business looking different in every channel. A shared direction makes websites, campaigns and content more recognizable and easier to maintain.",
    audience:
      "Businesses establishing an identity, improving a product experience or planning a considered digital presence.",
    deliverables: [
      "Corporate branding and graphic design",
      "Product UI/UX and website interface design",
      "Video editing, production and motion graphics",
      "SEO and website optimization",
      "Content strategy and social media planning",
      "Search marketing, advertising and campaign management",
    ],
    approach:
      "We define the audience, objective and source material before production. Deliverables are reviewed in context, with practical guidance for consistent use.",
    technology:
      "Design and production tools are selected for the required formats. Growth work starts with measurable objectives rather than promises of rankings or sales.",
    related: [
      "ecommerce-facebook",
      "real-estate-property",
      "hospitality-tourism",
    ],
  },
  {
    slug: "branding-graphic-design",
    title: "Branding & graphic design",
    short: "An identity with consistency built in.",
    category: "creative-digital-growth",
    intro:
      "Develop a considered visual identity and the practical materials your business needs to use it consistently.",
    problem:
      "A logo alone does not establish a coherent brand. Typography, colors, document layouts and everyday applications all influence how a company presents itself.",
    audience:
      "New businesses shaping their identity and established organizations aligning their visual communication.",
    deliverables: [
      "Brand direction and identity exploration",
      "Logo system and approved variants",
      "Typography, color and usage guidance",
      "Corporate stationery and presentation materials",
      "Print ready and digital asset exports",
    ],
    approach:
      "We agree the business context and visual direction first. The selected identity is tested at real usage sizes, then delivered with organized files and clear usage rules.",
    technology:
      "Vector artwork and appropriate production formats preserve quality across print and digital applications. Existing approved brand assets are treated as authoritative.",
    related: ["professional-services", "ngo-nonprofit", "ecommerce-facebook"],
  },
  {
    slug: "ui-ux-design",
    title: "UI/UX & website interface design",
    short: "Make the next step easy to understand.",
    category: "creative-digital-growth",
    intro:
      "Design interfaces around the decisions people need to make, the tasks they need to finish and the context in which they work.",
    problem:
      "Crowded screens and unclear navigation make software feel harder than it needs to be. Interface design connects user needs with the practical constraints of implementation.",
    audience:
      "Product teams, businesses planning a portal and organizations improving an existing website or application.",
    deliverables: [
      "User journeys and information architecture",
      "Wireframes and interactive prototypes",
      "Responsive interface design",
      "Accessible components and design tokens",
      "Developer handover and implementation review",
    ],
    approach:
      "We clarify the core tasks, explore structure before decoration and review realistic content in the design. Key flows are refined before the component system expands.",
    technology:
      "Design files, prototypes and documented component states help development teams implement consistently. Research scope and participant recruitment are agreed per project.",
    related: [
      "education-coaching",
      "healthcare-diagnostics",
      "professional-services",
    ],
  },
  {
    slug: "video-production-editing",
    title: "Video production & editing",
    short: "Tell the story with purpose.",
    category: "creative-digital-growth",
    intro:
      "Plan and produce visual content that explains a product, introduces a business or supports a focused campaign.",
    problem:
      "Unstructured footage and unclear messages can make a video expensive to revise and difficult to use. A defined audience and production brief keep the work focused.",
    audience:
      "Businesses needing product explainers, corporate content, campaign assets or edited recordings.",
    deliverables: [
      "Creative brief, script and storyboard",
      "Production planning and footage requirements",
      "Editing, sound treatment and captioning",
      "Motion graphics and branded titles",
      "Platform specific exports and source handover",
    ],
    approach:
      "The message, length, channels and approval stages are agreed before editing. Production logistics, filming and licensed source material are scoped separately where required.",
    technology:
      "Editing and motion tools depend on the final formats. Music, footage and font usage rights must be confirmed for the intended distribution.",
    related: ["hospitality-tourism", "ecommerce-facebook", "events-membership"],
  },
  {
    slug: "seo-digital-marketing",
    title: "SEO & digital marketing",
    short: "A useful presence, with a clear objective.",
    category: "creative-digital-growth",
    intro:
      "Improve how people find and understand your business through search, content and carefully scoped digital campaigns.",
    problem:
      "Publishing more content does not necessarily improve discovery. Technical issues, unclear messaging and poorly defined audiences can undermine digital activity.",
    audience:
      "Businesses improving an existing website or preparing a focused search, social or advertising initiative.",
    deliverables: [
      "Technical and content SEO review",
      "Website optimization and content priorities",
      "Search and social campaign planning",
      "Social media management and creative content",
      "Measurement setup and performance reporting",
    ],
    approach:
      "We establish the current position, agree objectives and prioritize the changes with a clear rationale. Campaign budgets, account ownership and reporting scope are confirmed before spending.",
    technology:
      "Search tools, analytics and advertising platforms are used with the organization’s approval. Rankings, reach and sales cannot be guaranteed.",
    related: [
      "ecommerce-facebook",
      "real-estate-property",
      "professional-services",
    ],
  },
];

export type Solution = {
  slug: string;
  title: string;
  label: string;
  group: string;
  intro: string;
  challenge: string;
  modules: string[];
  workflow: string[];
  consideration: string;
  services: string[];
};
export const solutions: Solution[] = [
  {
    slug: "ecommerce-facebook",
    title: "E-commerce & Facebook business",
    label: "Commerce",
    group: "Commerce & operations",
    intro:
      "Bring online orders, customer conversations and delivery information into a more organized commerce operation.",
    challenge:
      "Orders arriving through several channels can be difficult to reconcile with available stock, payments and courier updates.",
    modules: [
      "Online storefront and product catalog",
      "Facebook order capture workflows",
      "Inventory and customer management",
      "Courier and payment gateway integration",
      "Sales and order reporting",
    ],
    workflow: [
      "Capture an order",
      "Confirm stock and payment",
      "Arrange fulfillment",
      "Reconcile delivery and sales",
    ],
    consideration:
      "Facebook and payment integrations depend on available provider APIs, account permissions and approval. A custom system can be scoped around the channels you actually use.",
    services: ["saas-development", "api-system-integration"],
  },
  {
    slug: "education-coaching",
    title: "Education & coaching management",
    label: "Education",
    group: "People & organizations",
    intro:
      "Connect admissions, class administration and learning records in a platform designed for your institution.",
    challenge:
      "Student information, attendance and fee records often move between paper registers and spreadsheets, making routine follow up harder.",
    modules: [
      "Admissions and student profiles",
      "Class schedules and attendance",
      "Fees and payment records",
      "Examinations and academic reporting",
      "Student portals and learning resources",
    ],
    workflow: [
      "Enroll a student",
      "Assign classes",
      "Record progress and fees",
      "Share relevant reports",
    ],
    consideration:
      "School, coaching and LMS needs differ. Access for staff, students and guardians, alongside retention of student records, must be agreed before implementation.",
    services: ["saas-development", "web-application-development"],
  },
  {
    slug: "retail-pos-restaurant",
    title: "Retail, POS & restaurant management",
    label: "Retail & hospitality",
    group: "Commerce & operations",
    intro:
      "Design a connected view of billing, stock and daily operations across a shop, restaurant or multiple locations.",
    challenge:
      "Sales, returns and stock movements become hard to track when each counter or branch maintains its own records.",
    modules: [
      "Point of sale and billing",
      "Stock, purchases and adjustments",
      "Restaurant tables and kitchen orders",
      "Branch access and consolidated reports",
      "Sales, returns and daily reconciliation",
    ],
    workflow: [
      "Create the sale or order",
      "Update fulfillment",
      "Record payment",
      "Reconcile the day",
    ],
    consideration:
      "Hardware, receipt printers, offline operation and local billing requirements influence the solution. Device compatibility should be tested before rollout.",
    services: ["mobile-desktop-applications", "erp-crm-automation"],
  },
  {
    slug: "healthcare-diagnostics",
    title: "Healthcare & diagnostics",
    label: "Healthcare",
    group: "People & organizations",
    intro:
      "Support the administrative work around appointments, patient records and diagnostic services.",
    challenge:
      "Reception, clinicians and laboratory teams need access to relevant information without exposing sensitive records beyond their role.",
    modules: [
      "Appointment and reception management",
      "Patient administration and record access",
      "Diagnostic order and result workflows",
      "Billing and service tracking",
      "Administrative reporting and audit history",
    ],
    workflow: [
      "Register an appointment",
      "Coordinate the service",
      "Review authorized records",
      "Complete administration",
    ],
    consideration:
      "Clinical decisions remain with qualified professionals. Privacy, consent, security and applicable requirements need specialist review. No compliance certification is implied.",
    services: ["custom-software-development", "ui-ux-design"],
  },
  {
    slug: "human-resources-payroll",
    title: "Human resources & payroll",
    label: "People operations",
    group: "People & organizations",
    intro:
      "Give staff and administrators a consistent place for employee records, leave and payroll preparation.",
    challenge:
      "Attendance changes, leave approvals and payroll inputs can be difficult to reconcile when they are held in separate files.",
    modules: [
      "Employee profiles and access permissions",
      "Attendance and leave workflows",
      "Payroll calculation and review",
      "Recruitment and onboarding records",
      "Employee self service",
    ],
    workflow: [
      "Maintain employee records",
      "Review attendance and leave",
      "Prepare payroll",
      "Approve and record changes",
    ],
    consideration:
      "Payroll rules, deductions and statutory obligations must be supplied or verified by the organization’s qualified advisors. Approval history is part of the design.",
    services: ["erp-crm-automation", "custom-software-development"],
  },
  {
    slug: "accounting-finance",
    title: "Accounting & finance operations",
    label: "Finance operations",
    group: "Commerce & operations",
    intro:
      "Build practical tools for invoices, expenses and customer balances so that routine financial information is easier to review.",
    challenge:
      "Missing supporting records and delayed reconciliation can leave teams uncertain about outstanding amounts or operational spending.",
    modules: [
      "Invoice and customer due tracking",
      "Expense records and supporting documents",
      "Payment and receipt reconciliation",
      "Approval workflows",
      "Business financial dashboards",
    ],
    workflow: [
      "Record the transaction",
      "Attach supporting records",
      "Review and reconcile",
      "Report the position",
    ],
    consideration:
      "This scope supports business operations. Accounting treatment, tax rules and regulated financial activity require guidance from the organization’s qualified advisors.",
    services: ["erp-crm-automation", "api-system-integration"],
  },
  {
    slug: "wholesale-distribution",
    title: "Wholesale & distribution",
    label: "Distribution",
    group: "Commerce & operations",
    intro:
      "Connect purchasing, dealer orders and stock movement across your distribution operation.",
    challenge:
      "Different stock records across warehouses and sales teams make availability, replenishment and outstanding dealer orders difficult to manage.",
    modules: [
      "Dealer and customer records",
      "Purchase and sales order workflows",
      "Warehouse and stock movement tracking",
      "Distribution planning",
      "Inventory and sales reporting",
    ],
    workflow: [
      "Receive dealer demand",
      "Allocate available stock",
      "Dispatch the order",
      "Reconcile delivery and balances",
    ],
    consideration:
      "Units of measure, batch tracking, returns and dealer credit rules should be mapped from real transactions before the data model is finalized.",
    services: ["erp-crm-automation", "custom-software-development"],
  },
  {
    slug: "real-estate-property",
    title: "Real estate & property",
    label: "Property",
    group: "Services & communities",
    intro:
      "Organize listings, enquiries and property administration around a clear source of current information.",
    challenge:
      "Property status and customer interest can become scattered across conversations, spreadsheets and listing channels.",
    modules: [
      "Property listings and searchable portals",
      "Customer enquiries and follow up",
      "Rental records and schedules",
      "Booking and availability workflows",
      "Document and property administration",
    ],
    workflow: [
      "Publish a property",
      "Qualify an enquiry",
      "Track the booking or rental",
      "Maintain the ongoing record",
    ],
    consideration:
      "Property documents, payment terms and legal obligations remain subject to professional review. Public listings and private administration should have separate access rules.",
    services: ["web-application-development", "seo-digital-marketing"],
  },
  {
    slug: "logistics-delivery",
    title: "Logistics & delivery",
    label: "Logistics",
    group: "Commerce & operations",
    intro:
      "Create a reliable record from parcel intake through delivery and collection reconciliation.",
    challenge:
      "Delivery assignments, status updates and cash collections are difficult to reconcile when drivers and dispatchers use separate channels.",
    modules: [
      "Parcel and shipment registration",
      "Delivery assignment and status tracking",
      "Customer tracking views",
      "Courier system integration",
      "COD collection and reconciliation",
    ],
    workflow: [
      "Register the parcel",
      "Assign the delivery",
      "Update shipment status",
      "Reconcile collections",
    ],
    consideration:
      "Connectivity, location permissions and proof of delivery need explicit requirements. Courier integrations depend on provider support and authorized credentials.",
    services: ["mobile-desktop-applications", "api-system-integration"],
  },
  {
    slug: "agriculture-fisheries",
    title: "Agriculture & fisheries",
    label: "Agriculture",
    group: "Services & communities",
    intro:
      "Keep useful records of inputs, production and inventory in tools suited to farm and fisheries operations.",
    challenge:
      "Operational data may be recorded far from an office, with inconsistent connectivity and different ways of measuring stock or output.",
    modules: [
      "Farm and fisheries activity records",
      "Input and inventory management",
      "Production and harvest tracking",
      "Supplier and sales records",
      "Agriculture marketplace workflows",
    ],
    workflow: [
      "Record an activity",
      "Track inputs and stock",
      "Review production",
      "Connect output to sales",
    ],
    consideration:
      "Field usability, local terminology and offline needs should be tested with the people entering records. The software supports operations rather than agronomic or veterinary advice.",
    services: ["mobile-desktop-applications", "custom-software-development"],
  },
  {
    slug: "hospitality-tourism",
    title: "Hospitality & tourism",
    label: "Hospitality",
    group: "Services & communities",
    intro:
      "Coordinate reservations, guest information and service delivery through a shared operational view.",
    challenge:
      "Bookings, room availability and guest requests can become difficult to coordinate across reception and online channels.",
    modules: [
      "Reservation and availability management",
      "Guest administration",
      "Hotel and service workflows",
      "Booking websites and tourism portals",
      "Operational reporting",
    ],
    workflow: [
      "Receive a reservation",
      "Confirm availability",
      "Coordinate the stay or service",
      "Complete the booking record",
    ],
    consideration:
      "Cancellation rules, booking channels and payment handling must be defined for the business. External booking connections are subject to provider access.",
    services: ["web-application-development", "api-system-integration"],
  },
  {
    slug: "ngo-nonprofit",
    title: "NGO & nonprofit organizations",
    label: "Social impact",
    group: "People & organizations",
    intro:
      "Support program teams with organized beneficiary records, project information and reporting workflows.",
    challenge:
      "Field activity and program reporting can rely on many versions of spreadsheets, while sensitive beneficiary information needs careful handling.",
    modules: [
      "Beneficiary and program records",
      "Project monitoring and activity tracking",
      "Volunteer management",
      "Organization websites and portals",
      "Reporting and document workflows",
    ],
    workflow: [
      "Define the program",
      "Record authorized activity",
      "Review progress",
      "Prepare accountable reports",
    ],
    consideration:
      "Consent, access boundaries and data minimization are central to beneficiary systems. Reporting definitions and donor requirements must be supplied by the organization.",
    services: ["custom-software-development", "web-application-development"],
  },
  {
    slug: "professional-services",
    title: "Professional services",
    label: "Client services",
    group: "Services & communities",
    intro:
      "Give clients and service teams a clear way to book, share information and follow the progress of work.",
    challenge:
      "Enquiries, appointments and documents scattered across messages make it difficult to maintain a complete client record.",
    modules: [
      "Appointment and service booking",
      "Client portals and secure access",
      "Document requests and management",
      "Service progress and task tracking",
      "Customer and operational reporting",
    ],
    workflow: [
      "Receive the enquiry",
      "Schedule the work",
      "Exchange relevant documents",
      "Track completion",
    ],
    consideration:
      "Document access, confidentiality and retention depend on the type of professional service. These rules should be defined before client information is imported.",
    services: ["custom-software-development", "web-application-development"],
  },
  {
    slug: "events-membership",
    title: "Events & membership",
    label: "Communities",
    group: "Services & communities",
    intro:
      "Manage registration, membership records and renewals without losing the context of each participant.",
    challenge:
      "Event attendance, payment records and membership status can be hard to reconcile when they are managed through separate tools.",
    modules: [
      "Event registration and ticketing",
      "Member profiles and access",
      "Subscription and renewal workflows",
      "Attendance and participant reporting",
      "Organization communication preferences",
    ],
    workflow: [
      "Register a participant",
      "Confirm the booking or membership",
      "Record attendance or access",
      "Manage follow up and renewal",
    ],
    consideration:
      "Payment handling, cancellation terms and communication consent must be agreed. Capacity limits and duplicate registrations are treated as business rules.",
    services: ["saas-development", "api-system-integration"],
  },
  {
    slug: "business-process-automation",
    title: "Business process automation",
    label: "Automation",
    group: "Commerce & operations",
    intro:
      "Connect repeatable tasks, approvals and information flows while keeping the people responsible in control.",
    challenge:
      "Routine data transfers and manual checks consume attention. Automation needs to account for exceptions and make failures visible.",
    modules: [
      "Approval and workflow automation",
      "API and business system integration",
      "Internal dashboards and reporting",
      "Data processing and reconciliation",
      "AI assisted workflows with human review",
    ],
    workflow: [
      "Define the trigger",
      "Validate the information",
      "Run the agreed action",
      "Review exceptions and results",
    ],
    consideration:
      "Automation permissions and human review points are agreed before activation. AI assisted steps require evaluation for accuracy and appropriate handling of business information.",
    services: ["api-system-integration", "erp-crm-automation"],
  },
];
export const projects = [
  {
    slug: "coaching-management",
    title: "A clearer day for a coaching center.",
    name: "Coaching Management SaaS",
    type: "Product concepts",
    status: "Planned concept",
    image: "education",
    intro:
      "A proposed SaaS direction bringing student administration, attendance and fees into one focused working environment.",
    challenge:
      "Coaching centers often manage admissions, class schedules and fees through disconnected records. The concept explores how a shared platform could reduce that fragmentation.",
    features: [
      "Student and guardian records",
      "Class attendance and schedules",
      "Fee tracking and follow up",
      "Academic reporting",
    ],
    direction:
      "Start by validating the daily administration workflow with prospective users. A first release would focus on the essential records before expanding into learning resources.",
    solution: "education-coaching",
  },
  {
    slug: "commerce-management",
    title: "From a conversation to a completed order.",
    name: "E-commerce & Facebook Business SaaS",
    type: "Product concepts",
    status: "Planned concept",
    image: "logistics",
    intro:
      "A proposed product direction for organizing commerce activity across an online store, social orders and delivery workflows.",
    challenge:
      "Small commerce teams can lose track of stock and order status when customer requests arrive through several channels. This concept brings the operational record together.",
    features: [
      "Orders and customer records",
      "Inventory visibility",
      "Courier coordination",
      "Sales and delivery reconciliation",
    ],
    direction:
      "Validate how merchants capture orders and reconcile delivery. Provider access, integration feasibility and product architecture remain to be confirmed.",
    solution: "ecommerce-facebook",
  },
];
export const allPaths = [
  "/",
  "/about",
  "/services",
  "/solutions",
  "/portfolio",
  "/academy",
  "/contact",
  "/privacy",
  ...services.map((x) => "/services/" + x.slug),
  ...solutions.map((x) => "/solutions/" + x.slug),
  ...projects.map((x) => "/portfolio/" + x.slug),
];
