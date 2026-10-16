import { ArrowUpRight, ArrowDown, ArrowRight, Check } from "lucide-react";
import {
  categories,
  services,
  solutions,
  projects,
  type Service,
  type Solution,
} from "@/lib/content";
import { serviceOptions, site } from "@/lib/site";
import {
  ButtonLink,
  TextLink,
  Photo,
  Eyebrow,
  SectionHead,
  PageHero,
  ProjectCTA,
  Breadcrumbs,
} from "./shared";
import { ContactSection } from "./contact";
import { SolutionsDirectory, ProjectList } from "./directories";

export function HomePage() {
  return (
    <>
      <section className="home-hero container">
        <div className="hero-copy">
          <Eyebrow>Software. Systems. Possibility.</Eyebrow>
          <h1>
            Technology that
            <br />
            moves business
            <br />
            <span>forward.</span>
          </h1>
          <p>
            We bring software engineering, business technology and thoughtful
            design together to help you build what comes next.
          </p>
          <div className="hero-actions">
            <ButtonLink href="/contact">Build with us</ButtonLink>
            <TextLink href="/services">Explore our services</TextLink>
          </div>
          <a className="hero-scroll" href="#introduction">
            <ArrowDown size={15} />
            <span>A considered approach to technology</span>
          </a>
        </div>
        <div className="hero-visual">
          <Photo name="architecture" priority />
          <div className="hero-caption">
            <span>Engineering digital progress.</span>
            <ArrowUpRight size={22} />
          </div>
        </div>
      </section>
      <section id="introduction" className="intro-section container">
        <div>
          <Eyebrow>Meet DeltaWave</Eyebrow>
          <span className="intro-location">
            Based in Bangladesh.
            <br />
            Built with a wider perspective.
          </span>
        </div>
        <div>
          <h2>
            Good technology starts
            <br />
            with understanding
            <br />
            <span className="muted">your business.</span>
          </h2>
          <div className="intro-bottom">
            <p>
              DeltaWave Technology is a developing technology enterprise focused
              on useful, maintainable software and dependable IT. We start with
              the way your organization works, then shape the right solution
              around it.
            </p>
            <TextLink href="/about">Get to know us</TextLink>
          </div>
        </div>
      </section>
      <section className="services-section">
        <div className="container">
          <SectionHead
            label="What we do"
            title="From the first idea to the everyday operation."
          >
            <p>
              Four connected capabilities.
              <br />
              One practical approach.
            </p>
            <TextLink href="/services">All services</TextLink>
          </SectionHead>
          <div className="service-editorial">
            <div className="service-feature">
              <Photo name="workplace" />
              <div className="feature-caption">
                <span>Ideas become useful when people can work with them.</span>
                <span>01</span>
              </div>
            </div>
            <div className="service-summary">
              {categories.map((c) => (
                <a href={"/services/" + c.slug} key={c.slug}>
                  <span className="service-number">{c.number}</span>
                  <div>
                    <h3>{c.title}</h3>
                    <p>{c.description}</p>
                  </div>
                  <ArrowUpRight size={22} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="industry-section container">
        <SectionHead
          label="Solutions we can build"
          title="Built for the way your industry works."
        >
          <p>
            Specific challenges deserve specific solutions. Explore applications
            shaped around your operations.
          </p>
          <TextLink href="/solutions">Explore all industries</TextLink>
        </SectionHead>
        <div className="industry-preview">
          {[
            "ecommerce-facebook",
            "education-coaching",
            "retail-pos-restaurant",
            "healthcare-diagnostics",
            "logistics-delivery",
            "business-process-automation",
          ].map((slug, i) => {
            const s = solutions.find((x) => x.slug === slug)!;
            return (
              <a href={"/solutions/" + s.slug} key={slug}>
                <span className="small-label">
                  0{i + 1} / {s.label}
                </span>
                <h3>{s.title}</h3>
                <p>{s.modules.slice(0, 3).join(". ")}.</p>
                <ArrowUpRight size={21} />
              </a>
            );
          })}
        </div>
      </section>
      <section className="engineering-section">
        <div className="container engineering-inner">
          <div>
            <Eyebrow>The foundation matters</Eyebrow>
            <h2>
              Built to work.
              <br />
              Designed to last.
            </h2>
            <p>
              Architecture, access, deployment and recovery deserve the same
              attention as the interface. We consider how a system will be
              operated long after its first release.
            </p>
            <TextLink href="/services/cloud-managed-it">
              Explore our technical approach
            </TextLink>
          </div>
          <div className="engineering-detail">
            <Photo name="servers" />
            <div className="capability-lines">
              <span>Software & SaaS architecture</span>
              <span>Cloud infrastructure & DevOps</span>
              <span>Systems integration & automation</span>
            </div>
          </div>
        </div>
      </section>
      <section className="portfolio-section container">
        <SectionHead
          label="Product directions"
          title="Ideas with a practical purpose."
        >
          <p>
            A look at the products we are exploring.
            <br />
            These concepts are not commercially available.
          </p>
          <TextLink href="/portfolio">View our portfolio</TextLink>
        </SectionHead>
        <ProjectList compact />
      </section>
      <section className="approach-section container">
        <div>
          <Eyebrow>How we think</Eyebrow>
          <h2>Clarity at every step.</h2>
          <p>
            Good delivery is a series of informed decisions. We keep the work
            understandable, reviewable and connected to your goals.
          </p>
        </div>
        <ol className="approach-list">
          {[
            [
              "Understand the work",
              "Map the business process, listen to the people involved and identify what needs to change.",
            ],
            [
              "Define what matters",
              "Agree a realistic scope, the right architecture and a useful first release.",
            ],
            [
              "Build, review, refine",
              "Work in visible stages with clear acceptance criteria and room for informed feedback.",
            ],
            [
              "Prepare for everyday use",
              "Plan the handover, documentation, maintenance and support the system will need.",
            ],
          ].map(([h, p], i) => (
            <li key={h}>
              <span>0{i + 1}</span>
              <div>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="academy-band container">
        <Photo name="education" />
        <div>
          <Eyebrow>DeltaWave Academy</Eyebrow>
          <h2>
            Practical skills.
            <br />
            New possibilities.
          </h2>
          <p>
            A planned initiative in computer training and digital skills.
            Designed to connect learning with the tools people use in work and
            business.
          </p>
          <span className="status-label">
            In planning · Enrollment is not open
          </span>
          <TextLink href="/academy">Discover the Academy</TextLink>
        </div>
      </section>
      <ContactSection />
    </>
  );
}

export function AboutPage() {
  return (
    <>
      <PageHero
        label="About DeltaWave"
        title="A thoughtful approach to moving forward."
        description="We are building a technology enterprise around a simple idea: software should make real work clearer, more connected and easier to manage."
      />
      <div className="about-image container">
        <Photo name="workplace" priority />
        <p className="photo-note">Representative workplace photography</p>
      </div>
      <section className="container editorial-split">
        <Eyebrow>Who we are</Eyebrow>
        <div>
          <h2>
            Rooted in Bangladesh.
            <br />
            Focused on useful progress.
          </h2>
          <p className="lead">
            DeltaWave Technology brings together software engineering, business
            applications, IT operations and digital design.
          </p>
          <p>
            As a developing enterprise, our direction is deliberate: understand
            the business need, build a sensible solution and make it
            maintainable. Our current business contact location is in
            Borhanuddin, Bhola, Bangladesh.
          </p>
          <p>
            We aim to work with businesses, institutions and organizations that
            need technology suited to their day to day operations, in Bangladesh
            and potentially beyond.
          </p>
        </div>
      </section>
      <section className="container vision-mission">
        <article>
          <span className="small-label">Our vision</span>
          <h2>Technology that opens up better ways of working.</h2>
          <p>
            To develop a lasting technology enterprise that helps organizations
            put practical digital systems to use.
          </p>
        </article>
        <article>
          <span className="small-label">Our mission</span>
          <h2>
            Understand carefully.
            <br />
            Build responsibly.
          </h2>
          <p>
            To connect business understanding, thoughtful engineering and clear
            communication in every project we undertake.
          </p>
        </article>
      </section>
      <section className="container principles">
        <SectionHead
          label="Our approach"
          title="The decisions behind the work."
        />
        <div>
          {[
            [
              "Business context first",
              "We look at the people, data and constraints around a problem before selecting a technology.",
            ],
            [
              "Maintainability by design",
              "Documentation, access boundaries and an understandable architecture belong in the original scope.",
            ],
            [
              "Clear commitments",
              "Scope, responsibilities and acceptance criteria help both sides make informed decisions.",
            ],
          ].map(([h, p], i) => (
            <article key={h}>
              <span>0{i + 1}</span>
              <h3>{h}</h3>
              <p>{p}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="container editorial-split direction">
        <Eyebrow>Our direction</Eyebrow>
        <div>
          <h2>A connected technology practice.</h2>
          <p>
            Our planned direction combines custom software, industry
            applications, managed infrastructure and creative services. Product
            exploration begins with coaching management and commerce operations.
            DeltaWave Academy is a separate planned initiative for practical
            computer and digital skills.
          </p>
          <TextLink href="/portfolio">Explore our product directions</TextLink>
        </div>
      </section>
      <ProjectCTA />
    </>
  );
}

export function ServicesPage() {
  return (
    <>
      <PageHero
        label="Our services"
        title="Engineering the idea.<br/>Supporting the everyday."
        description="Choose a focused service or connect several capabilities around one business goal. The scope starts with what your organization needs to do."
      >
        <ButtonLink href="/contact">Discuss your requirements</ButtonLink>
      </PageHero>
      <section className="container services-directory">
        {categories.map((c) => (
          <article key={c.slug} className="service-category">
            <div className="category-identifier">
              <span>{c.number}</span>
              <p>{c.short}</p>
            </div>
            <div className="category-content">
              <h2>
                <a href={"/services/" + c.slug}>
                  {c.title}
                  <ArrowUpRight size={26} />
                </a>
              </h2>
              <p className="lead">{c.description}</p>
              <div className="category-links">
                {c.links.length
                  ? c.links.map((slug) => (
                      <a href={"/services/" + slug} key={slug}>
                        {services.find((s) => s.slug === slug)?.title}
                        <ArrowUpRight size={15} />
                      </a>
                    ))
                  : solutions.slice(0, 6).map((s) => (
                      <a href={"/solutions/" + s.slug} key={s.slug}>
                        {s.title}
                        <ArrowUpRight size={15} />
                      </a>
                    ))}
              </div>
              <TextLink href={"/services/" + c.slug}>
                Explore this capability
              </TextLink>
            </div>
            <Photo name={c.image} />
          </article>
        ))}
      </section>
      <ProjectCTA
        title="Not sure where to start?"
        description="Describe the challenge in your own words. We can help identify the right starting point."
      />
    </>
  );
}

export function ServicePage({ service: s }: { service: Service }) {
  const c = categories.find((x) => x.slug === s.category)!;
  const category = s.slug === s.category;
  return (
    <>
      <div className="container">
        <Breadcrumbs
          items={[
            { label: "Services", href: "/services" },
            ...(!category
              ? [{ label: c.title, href: "/services/" + c.slug }]
              : []),
            { label: category ? c.title : s.title },
          ]}
        />
      </div>
      <section className="container detail-hero">
        <div>
          <Eyebrow>{category ? "Our capability" : c.title}</Eyebrow>
          <h1>{s.title}</h1>
          <p className="lead">{s.intro}</p>
          <ButtonLink
            href={
              "/contact?service=" +
              encodeURIComponent(serviceOptions[categories.indexOf(c)])
            }
          >
            Discuss this service
          </ButtonLink>
        </div>
        <Photo name={c.image} priority />
      </section>
      <section className="container service-body">
        <aside>
          <span className="small-label">Designed for</span>
          <p>{s.audience}</p>
          <span className="small-label">The starting point</span>
          <p>A focused discovery conversation and an agreed scope.</p>
        </aside>
        <div className="detail-content">
          <div>
            <Eyebrow>The business need</Eyebrow>
            <h2>{s.short}</h2>
            <p>{s.problem}</p>
          </div>
          <div className="deliverables">
            <h2>What the scope can include</h2>
            <ul>
              {s.deliverables.map((d) => (
                <li key={d}>
                  <Check size={18} />
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>How we approach the work</h2>
            <p>{s.approach}</p>
          </div>
          <div className="technical-note">
            <span className="small-label">Technology & planning</span>
            <p>{s.technology}</p>
          </div>
        </div>
      </section>
      {category && c.links.length > 0 && (
        <section className="container category-more">
          <SectionHead
            label="Explore the capability"
            title="Find the right starting point."
          />
          <div className="related-list">
            {c.links.map((slug) => {
              const item = services.find((x) => x.slug === slug)!;
              return (
                <a key={slug} href={"/services/" + slug}>
                  <h3>{item.title}</h3>
                  <p>{item.short}</p>
                  <ArrowUpRight size={20} />
                </a>
              );
            })}
          </div>
        </section>
      )}
      <section className="container related-section">
        <SectionHead
          label="Where it can make a difference"
          title="Connected to real business needs."
        />
        <div className="related-list">
          {s.related.map((slug) => {
            const sol = solutions.find((x) => x.slug === slug)!;
            return (
              <a href={"/solutions/" + slug} key={slug}>
                <h3>{sol.title}</h3>
                <p>{sol.intro}</p>
                <ArrowUpRight size={20} />
              </a>
            );
          })}
        </div>
      </section>
      <ProjectCTA service={serviceOptions[categories.indexOf(c)]} />
    </>
  );
}

export function SolutionsPage() {
  return (
    <>
      <PageHero
        label="Custom solutions for your industry"
        title="Your industry.<br/>Your way of working."
        description="Explore the kinds of tailored applications we can build. Each solution begins with your workflows, users and operational requirements."
      />
      <section className="container solutions-opening">
        <p className="small-label">Industry applications</p>
        <p>
          These are custom development capabilities. They are scoped for each
          organization and are not a catalog of ready to purchase products.
        </p>
        <TextLink href="/services/business-industry-solutions">
          Our industry approach
        </TextLink>
      </section>
      <section className="container directory-section">
        <SolutionsDirectory />
      </section>
      <ProjectCTA
        title="Your industry is only the starting point."
        description="Every organization works a little differently. Tell us about the process you would like to improve."
        service="Business & industry solutions"
      />
    </>
  );
}

export function SolutionPage({ solution: s }: { solution: Solution }) {
  return (
    <>
      <div className="container">
        <Breadcrumbs
          items={[
            { label: "Solutions", href: "/solutions" },
            { label: s.title },
          ]}
        />
      </div>
      <section className="container solution-hero">
        <Eyebrow>Solutions we can build / {s.label}</Eyebrow>
        <h1>{s.title}</h1>
        <div>
          <p className="lead">{s.intro}</p>
          <ButtonLink href="/contact?service=Business%20%26%20industry%20solutions">
            Discuss your workflow
          </ButtonLink>
        </div>
      </section>
      <section className="container solution-overview">
        <div>
          <span className="small-label">The operational challenge</span>
          <h2>A clearer view of the work.</h2>
          <p>{s.challenge}</p>
          <span className="status-label">
            Custom solution · Scoped for your organization
          </span>
        </div>
        <div>
          <h2>Possible modules</h2>
          <ol className="module-list">
            {s.modules.map((m, i) => (
              <li key={m}>
                <span>0{i + 1}</span>
                {m}
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="workflow-section">
        <div className="container">
          <SectionHead
            label="An example workflow"
            title="Connect the steps that matter."
          />
          <ol className="workflow">
            {s.workflow.map((w, i) => (
              <li key={w}>
                <span>0{i + 1}</span>
                <h3>{w}</h3>
                {i < 3 && <ArrowRight size={20} aria-hidden="true" />}
              </li>
            ))}
          </ol>
          <p className="workflow-note">
            Illustrative workflow. The final process is defined with your team.
          </p>
        </div>
      </section>
      <section className="container editorial-split">
        <Eyebrow>Before we build</Eyebrow>
        <div>
          <h2>Plan for your working reality.</h2>
          <p>{s.consideration}</p>
          <p>
            Discovery establishes your existing records, user responsibilities
            and the first useful scope. A prototype can help validate the main
            workflow before development expands.
          </p>
        </div>
      </section>
      <section className="container related-section">
        <SectionHead
          label="Supporting capabilities"
          title="The engineering behind the solution."
        />
        <div className="related-list">
          {s.services.map((slug) => {
            const service = services.find((x) => x.slug === slug)!;
            return (
              <a href={"/services/" + slug} key={slug}>
                <h3>{service.title}</h3>
                <p>{service.short}</p>
                <ArrowUpRight size={20} />
              </a>
            );
          })}
        </div>
        <TextLink href="/solutions">Explore other industries</TextLink>
      </section>
      <ProjectCTA service="Business & industry solutions" />
    </>
  );
}

export function PortfolioPage() {
  return (
    <>
      <PageHero
        label="Portfolio & product direction"
        title="Useful ideas.<br/>Considered possibilities."
        description="A transparent view of the work we are exploring. We will add approved projects, demonstrations and case studies as they become ready to share."
      />
      <section className="container portfolio-directory">
        <div className="portfolio-note">
          <span className="status-label">Early product direction</span>
          <p>
            The entries below are planned product concepts. Development, launch
            dates and commercial availability have not been confirmed.
          </p>
        </div>
        <ProjectList />
      </section>
      <ProjectCTA title="Have a problem worth exploring?" />
    </>
  );
}
export function ProjectPage({ slug }: { slug: string }) {
  const p = projects.find((x) => x.slug === slug)!;
  return (
    <>
      <div className="container">
        <Breadcrumbs
          items={[
            { label: "Portfolio", href: "/portfolio" },
            { label: p.name },
          ]}
        />
      </div>
      <section className="container project-hero">
        <Eyebrow>{p.status}</Eyebrow>
        <h1>{p.name}</h1>
        <p className="lead">{p.intro}</p>
        <div className="project-status">
          <span>Product concept</span>
          <span>No commercial release</span>
          <span>Discovery to be planned</span>
        </div>
      </section>
      <div className="container project-wide-image">
        <Photo name={p.image} priority />
        <p className="photo-note">
          Representative industry photography. This is not a product screenshot.
        </p>
      </div>
      <section className="container editorial-split">
        <Eyebrow>The opportunity</Eyebrow>
        <div>
          <h2>{p.title}</h2>
          <p>{p.challenge}</p>
          <h3>Proposed capabilities</h3>
          <ul className="plain-list">
            {p.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <h3>What would come next</h3>
          <p>{p.direction}</p>
          <div className="technical-note">
            <span className="small-label">Current status</span>
            <p>
              This is a product direction, not a completed project or live
              product. Technology choices, screenshots, customer use and
              measurable outcomes are not yet available.
            </p>
          </div>
          <TextLink href={"/solutions/" + p.solution}>
            Explore the related industry solution
          </TextLink>
        </div>
      </section>
      <ProjectCTA
        title="Help shape a more useful product."
        description="If this direction matches a challenge in your organization, we would like to understand your workflow."
      />
    </>
  );
}

export function AcademyPage() {
  return (
    <>
      <section className="container academy-hero">
        <div>
          <Eyebrow>DeltaWave Academy</Eyebrow>
          <h1>
            Learn the skills.
            <br />
            Open up
            <br />
            <span>possibilities.</span>
          </h1>
          <p className="lead">
            A planned initiative in computer training and digital skills, shaped
            around practical work and everyday confidence.
          </p>
          <span className="status-label">
            In planning · Enrollment is not open
          </span>
        </div>
        <Photo name="education" priority />
      </section>
      <section className="container editorial-split">
        <Eyebrow>The intention</Eyebrow>
        <div>
          <h2>
            Learning that connects
            <br />
            to the real world.
          </h2>
          <p>
            The Academy is planned for phased implementation. Its direction
            includes foundational computer skills, workplace tools and pathways
            into digital work.
          </p>
          <p>
            Course schedules, delivery formats, fees and instructors will be
            shared only after they are confirmed. There are no open courses or
            reserved seats at this stage.
          </p>
        </div>
      </section>
      <section className="container academy-topics">
        <SectionHead
          label="Proposed learning areas"
          title="Build a foundation. Then find your direction."
        />
        <div>
          {[
            {
              n: "01",
              title: "Everyday digital confidence",
              items: [
                "Computer fundamentals",
                "Microsoft Office",
                "Productivity applications",
                "Business software training",
              ],
            },
            {
              n: "02",
              title: "Building for the web",
              items: [
                "Programming fundamentals",
                "Web development",
                "Professional IT skills",
              ],
            },
            {
              n: "03",
              title: "Creative & business skills",
              items: [
                "Graphic design",
                "Digital marketing",
                "E-commerce operations",
              ],
            },
          ].map((g) => (
            <article key={g.n}>
              <span className="topic-number">{g.n}</span>
              <h3>{g.title}</h3>
              <ul>
                {g.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <section className="container academy-next">
        <div>
          <Eyebrow>A phased initiative</Eyebrow>
          <h2>
            Help us understand
            <br />
            what you want to learn.
          </h2>
          <p>
            You can share your interests or suggest a training need for your
            organization. An enquiry is not enrollment or a place reservation.
          </p>
        </div>
        <ButtonLink href="/contact?service=Academy%20interest">
          Share your learning interests
        </ButtonLink>
      </section>
    </>
  );
}

export function ContactPage() {
  return (
    <>
      <section className="contact-page-intro container">
        <Eyebrow>Contact DeltaWave</Eyebrow>
        <h1>
          What would you like
          <br />
          to make possible?
        </h1>
        <p className="lead">
          A new idea, a better process or a system that needs attention. We are
          ready to understand the starting point.
        </p>
      </section>
      <ContactSection standalone />
      <section className="container contact-next">
        <Eyebrow>What happens next</Eyebrow>
        <div>
          <h2>A conversation before a commitment.</h2>
          <p>
            We review the context you share, clarify the requirements and
            discuss an appropriate next step. Please avoid including passwords,
            payment details or sensitive personal records in an initial enquiry.
          </p>
        </div>
      </section>
    </>
  );
}

export function PrivacyPage() {
  return (
    <>
      <PageHero
        label="Privacy & enquiries"
        title="A clear purpose for the details you share."
        description="This notice explains how contact information is used when you enquire about DeltaWave Technology services."
      />
      <article className="container prose">
        <h2>Information you provide</h2>
        <p>
          The enquiry form asks for your name, email address, phone number,
          optional organization, service interest and a project description.
          Please do not include passwords, payment card information or sensitive
          records.
        </p>
        <h2>Why we use it</h2>
        <p>
          We use the details to understand your request, communicate with you
          and assess a possible engagement. Submitting an enquiry does not
          subscribe you to marketing.
        </p>
        <h2>Delivery and security</h2>
        <p>
          When online submissions are enabled, the form uses Cloudflare
          Turnstile for spam protection and Resend for email delivery to the
          business contact inbox. These providers process the information needed
          to perform those services. The website does not maintain a separate
          enquiry database.
        </p>
        <h2>When online delivery is unavailable</h2>
        <p>
          The form clearly indicates when it is not configured. You can contact
          us directly by email or phone. A successful form message is shown only
          after the email provider confirms acceptance, which does not guarantee
          inbox delivery.
        </p>
        <h2>Retention and your requests</h2>
        <p>
          Enquiry correspondence is retained in the business inbox while it is
          needed to respond and manage a possible engagement. For access,
          correction or deletion requests, contact{" "}
          <a href={"mailto:" + site.email}>{site.email}</a>. Any legal or
          contractual retention requirements will be considered when handling a
          request.
        </p>
        <h2>Cookies and analytics</h2>
        <p>
          This website does not add advertising or analytics cookies. If
          enabled, the spam protection provider may use technical signals for
          verification. Access to this private preview is managed by the hosting
          platform, whose own privacy terms apply.
        </p>
        <h2>Business contact</h2>
        <p>
          DeltaWave Technology
          <br />
          {site.location}
          <br />
          <a href={"mailto:" + site.email}>{site.email}</a>
        </p>
      </article>
    </>
  );
}
