import { ArrowUpRight, ArrowDown, ArrowRight, Check } from "lucide-react";
import type { HomepageView, LinkView } from "@/lib/cms/homepage-view";
import type { PageContentView } from "@/lib/cms/pages-view";
import type { Page } from "@/payload-types";
import {
  isPlannedConcept,
  type Catalog,
  type ProjectView,
  type ServiceView,
  type SolutionView,
} from "@/lib/cms/catalog-view";
import {
  ButtonLink,
  TextLink,
  Photo,
  ResponsivePhoto,
  Lines,
  Eyebrow,
  SectionHead,
  PageHero,
  ProjectCTA,
  Breadcrumbs,
} from "./shared";
import { ContactSection, type ContactSectionData } from "./contact";
import { RichText } from "./rich-text";
import { SolutionsDirectory, ProjectList } from "./directories";
import { ProjectEntry } from "./project-entry";

const sideContent = (lines: string[], link: LinkView | null) =>
  lines.length > 0 || link ? (
    <>
      {lines.length > 0 && (
        <p>
          <Lines lines={lines} />
        </p>
      )}
      {link && <TextLink href={link.href}>{link.label}</TextLink>}
    </>
  ) : undefined;

/**
 * The homepage composition. Section order, markup and classes are fixed by the
 * design; the content comes from the Homepage global (lib/cms/homepage.ts).
 */
export function HomePage({
  content,
  contact: contactData,
}: {
  content: HomepageView;
  contact: ContactSectionData;
}) {
  const {
    hero,
    introduction: intro,
    services,
    industries,
    engineering,
    portfolio,
    approach,
    academy,
    contact,
  } = content;
  return (
    <>
      <section className="home-hero container">
        <div className="hero-copy">
          {hero.eyebrow && <Eyebrow>{hero.eyebrow}</Eyebrow>}
          <h1>
            <Lines lines={hero.headingLines} />
            {hero.headingAccent && (
              <>
                {hero.headingLines.length > 0 && <br />}
                <span>{hero.headingAccent}</span>
              </>
            )}
          </h1>
          {hero.description && <p>{hero.description}</p>}
          {(hero.primaryLink || hero.secondaryLink) && (
            <div className="hero-actions">
              {hero.primaryLink && (
                <ButtonLink href={hero.primaryLink.href}>{hero.primaryLink.label}</ButtonLink>
              )}
              {hero.secondaryLink && (
                <TextLink href={hero.secondaryLink.href}>{hero.secondaryLink.label}</TextLink>
              )}
            </div>
          )}
          {intro.enabled && hero.scrollLabel && (
            <a className="hero-scroll" href="#introduction">
              <ArrowDown size={15} />
              <span>{hero.scrollLabel}</span>
            </a>
          )}
        </div>
        {(hero.image || hero.imageCaption) && (
          <div className="hero-visual">
            {hero.image && <ResponsivePhoto photo={hero.image} priority />}
            {hero.imageCaption && (
              <div className="hero-caption">
                <span>{hero.imageCaption}</span>
                <ArrowUpRight size={22} />
              </div>
            )}
          </div>
        )}
      </section>
      {intro.enabled && (
        <section id="introduction" className="intro-section container">
          <div>
            {intro.eyebrow && <Eyebrow>{intro.eyebrow}</Eyebrow>}
            {intro.locationLines.length > 0 && (
              <span className="intro-location">
                <Lines lines={intro.locationLines} />
              </span>
            )}
          </div>
          <div>
            <h2>
              <Lines lines={intro.headingLines} />
              {intro.headingMuted && (
                <>
                  {intro.headingLines.length > 0 && <br />}
                  <span className="muted">{intro.headingMuted}</span>
                </>
              )}
            </h2>
            {(intro.body || intro.link) && (
              <div className="intro-bottom">
                {intro.body && <p>{intro.body}</p>}
                {intro.link && <TextLink href={intro.link.href}>{intro.link.label}</TextLink>}
              </div>
            )}
          </div>
        </section>
      )}
      {services.enabled && (
        <section className="services-section">
          <div className="container">
            <SectionHead
              label={services.eyebrow}
              title={<Lines lines={services.headingLines} />}
            >
              {sideContent(services.sideTextLines, services.link)}
            </SectionHead>
            <div className="service-editorial">
              {(services.featureImage || services.featureCaption) && (
                <div className="service-feature">
                  {services.featureImage && <ResponsivePhoto photo={services.featureImage} />}
                  {services.featureCaption && (
                    <div className="feature-caption">
                      <span>{services.featureCaption}</span>
                      <span>01</span>
                    </div>
                  )}
                </div>
              )}
              <div className="service-summary">
                {services.categories.map((c) => (
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
      )}
      {industries.enabled && (
        <section className="industry-section container">
          <SectionHead
            label={industries.eyebrow}
            title={<Lines lines={industries.headingLines} />}
          >
            {sideContent(industries.sideTextLines, industries.link)}
          </SectionHead>
          <div className="industry-preview">
            {industries.items.map((s, i) => (
              <a href={"/solutions/" + s.slug} key={s.slug}>
                <span className="small-label">
                  0{i + 1} / {s.label}
                </span>
                <h3>{s.title}</h3>
                {s.summary && <p>{s.summary}.</p>}
                <ArrowUpRight size={21} />
              </a>
            ))}
          </div>
        </section>
      )}
      {engineering.enabled && (
        <section className="engineering-section">
          <div className="container engineering-inner">
            <div>
              {engineering.eyebrow && <Eyebrow>{engineering.eyebrow}</Eyebrow>}
              <h2>
                <Lines lines={engineering.headingLines} />
              </h2>
              {engineering.body && <p>{engineering.body}</p>}
              {engineering.link && (
                <TextLink href={engineering.link.href}>{engineering.link.label}</TextLink>
              )}
            </div>
            {(engineering.image || engineering.capabilities.length > 0) && (
              <div className="engineering-detail">
                {engineering.image && <ResponsivePhoto photo={engineering.image} />}
                {engineering.capabilities.length > 0 && (
                  <div className="capability-lines">
                    {engineering.capabilities.map((capability, i) => (
                      <span key={i}>{capability}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}
      {portfolio.enabled && (
        <section className="portfolio-section container">
          <SectionHead
            label={portfolio.eyebrow}
            title={<Lines lines={portfolio.headingLines} />}
          >
            {sideContent(portfolio.sideTextLines, portfolio.link)}
          </SectionHead>
          {portfolio.projects.length > 0 && (
            <div className="project-list">
              {portfolio.projects.map((p, i) => (
                <ProjectEntry key={p.slug} project={p} index={i} />
              ))}
            </div>
          )}
        </section>
      )}
      {approach.enabled && (
        <section className="approach-section container">
          <div>
            {approach.eyebrow && <Eyebrow>{approach.eyebrow}</Eyebrow>}
            <h2>
              <Lines lines={approach.headingLines} />
            </h2>
            {approach.body && <p>{approach.body}</p>}
          </div>
          {approach.steps.length > 0 && (
            <ol className="approach-list">
              {approach.steps.map((step, i) => (
                <li key={i}>
                  <span>0{i + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
      {academy.enabled && (
        <section className="academy-band container">
          {academy.image && <ResponsivePhoto photo={academy.image} />}
          <div>
            {academy.eyebrow && <Eyebrow>{academy.eyebrow}</Eyebrow>}
            <h2>
              <Lines lines={academy.headingLines} />
            </h2>
            {academy.body && <p>{academy.body}</p>}
            {academy.statusLabel && <span className="status-label">{academy.statusLabel}</span>}
            {academy.link && <TextLink href={academy.link.href}>{academy.link.label}</TextLink>}
          </div>
        </section>
      )}
      {contact.enabled && (
        <ContactSection
          eyebrow={contact.eyebrow}
          heading={<Lines lines={contact.headingLines} />}
          data={contactData}
        />
      )}
    </>
  );
}

export function AboutPage({ content }: { content: PageContentView["about"] }) {
  const { hero, intro, vision, mission, principles, direction, cta } = content;
  return (
    <>
      <PageHero
        label={hero.label}
        title={hero.headingLines}
        description={hero.description}
      />
      {(content.image || content.imageCaption) && (
        <div className="about-image container">
          {content.image && <ResponsivePhoto photo={content.image} priority />}
          {content.imageCaption && (
            <p className="photo-note">{content.imageCaption}</p>
          )}
        </div>
      )}
      <section className="container editorial-split">
        {intro.eyebrow && <Eyebrow>{intro.eyebrow}</Eyebrow>}
        <div>
          <h2>
            <Lines lines={intro.headingLines} />
          </h2>
          {intro.lead && <p className="lead">{intro.lead}</p>}
          {intro.paragraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </section>
      <section className="container vision-mission">
        {[vision, mission].map((item, i) => (
          <article key={i}>
            {item.label && <span className="small-label">{item.label}</span>}
            <h2>
              <Lines lines={item.headingLines} />
            </h2>
            {item.body && <p>{item.body}</p>}
          </article>
        ))}
      </section>
      {principles.enabled && (
        <section className="container principles">
          <SectionHead label={principles.eyebrow} title={principles.title} />
          <div>
            {principles.items.map((item, i) => (
              <article key={item.title}>
                <span>0{i + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}
      {direction.enabled && (
        <section className="container editorial-split direction">
          {direction.eyebrow && <Eyebrow>{direction.eyebrow}</Eyebrow>}
          <div>
            <h2>
              <Lines lines={direction.headingLines} />
            </h2>
            {direction.body && <p>{direction.body}</p>}
            {direction.link && (
              <TextLink href={direction.link.href}>{direction.link.label}</TextLink>
            )}
          </div>
        </section>
      )}
      <ProjectCTA
        title={<Lines lines={cta.titleLines} />}
        description={cta.description}
        service={cta.service || undefined}
      />
    </>
  );
}

export function ServicesPage({
  catalog,
  content,
}: {
  catalog: Catalog;
  content: PageContentView["services"];
}) {
  return (
    <>
      <PageHero
        label={content.hero.label}
        title={content.hero.headingLines}
        description={content.hero.description}
      >
        {content.heroButton && (
          <ButtonLink href="/contact">{content.heroButton}</ButtonLink>
        )}
      </PageHero>
      <section className="container services-directory">
        {catalog.categories.map((c) => (
          <article key={c.slug} className="service-category">
            <div className="category-identifier">
              <span>{c.number}</span>
              <p>{c.short}</p>
            </div>
            <div className="category-content">
              <h2>
                {c.href ? (
                  <a href={c.href}>
                    {c.title}
                    <ArrowUpRight size={26} />
                  </a>
                ) : (
                  c.title
                )}
              </h2>
              <p className="lead">{c.description}</p>
              <div className="category-links">
                {c.services.length
                  ? c.services.map((s) => (
                      <a href={"/services/" + s.slug} key={s.slug}>
                        {s.title}
                        <ArrowUpRight size={15} />
                      </a>
                    ))
                  : catalog.solutions.slice(0, 6).map((s) => (
                      <a href={"/solutions/" + s.slug} key={s.slug}>
                        {s.title}
                        <ArrowUpRight size={15} />
                      </a>
                    ))}
              </div>
              {c.href && <TextLink href={c.href}>Explore this capability</TextLink>}
            </div>
            {c.photo && <ResponsivePhoto photo={c.photo} />}
          </article>
        ))}
      </section>
      <ProjectCTA
        title={<Lines lines={content.cta.titleLines} />}
        description={content.cta.description}
        service={content.cta.service || undefined}
      />
    </>
  );
}

export function ServicePage({ service: s }: { service: ServiceView }) {
  const c = s.category;
  const category = s.isOverview && c !== null;
  const option = c?.contactOption ?? undefined;
  return (
    <>
      <div className="container">
        <Breadcrumbs
          items={[
            { label: "Services", href: "/services" },
            ...(!category && c ? [{ label: c.title, href: c.href ?? undefined }] : []),
            { label: category ? c.title : s.title },
          ]}
        />
      </div>
      <section className="container detail-hero">
        <div>
          <Eyebrow>{category ? "Our capability" : (c?.title ?? "Our services")}</Eyebrow>
          <h1>{s.title}</h1>
          <p className="lead">{s.intro}</p>
          <ButtonLink href={option ? "/contact?service=" + encodeURIComponent(option) : "/contact"}>
            Discuss this service
          </ButtonLink>
        </div>
        {c?.photo && <ResponsivePhoto photo={c.photo} priority />}
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
      {category && c.services.length > 0 && (
        <section className="container category-more">
          <SectionHead
            label="Explore the capability"
            title="Find the right starting point."
          />
          <div className="related-list">
            {c.services.map((item) => (
              <a key={item.slug} href={"/services/" + item.slug}>
                <h3>{item.title}</h3>
                <p>{item.short}</p>
                <ArrowUpRight size={20} />
              </a>
            ))}
          </div>
        </section>
      )}
      {s.relatedSolutions.length > 0 && (
        <section className="container related-section">
          <SectionHead
            label="Where it can make a difference"
            title="Connected to real business needs."
          />
          <div className="related-list">
            {s.relatedSolutions.map((sol) => (
              <a href={"/solutions/" + sol.slug} key={sol.slug}>
                <h3>{sol.title}</h3>
                <p>{sol.intro}</p>
                <ArrowUpRight size={20} />
              </a>
            ))}
          </div>
        </section>
      )}
      <ProjectCTA service={option} />
    </>
  );
}

export function SolutionsPage({
  solutions,
  content,
}: {
  solutions: SolutionView[];
  content: PageContentView["solutions"];
}) {
  const { opening } = content;
  return (
    <>
      <PageHero
        label={content.hero.label}
        title={content.hero.headingLines}
        description={content.hero.description}
      />
      <section className="container solutions-opening">
        {opening.label && <p className="small-label">{opening.label}</p>}
        {opening.body && <p>{opening.body}</p>}
        {opening.link && (
          <TextLink href={opening.link.href}>{opening.link.label}</TextLink>
        )}
      </section>
      <section className="container directory-section">
        <SolutionsDirectory
          solutions={solutions.map(({ slug, title, intro, group, modules }) => ({
            slug,
            title,
            intro,
            group,
            modules,
          }))}
        />
      </section>
      <ProjectCTA
        title={<Lines lines={content.cta.titleLines} />}
        description={content.cta.description}
        service={content.cta.service || undefined}
      />
    </>
  );
}

export function SolutionPage({ solution: s }: { solution: SolutionView }) {
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
                {i < s.workflow.length - 1 && <ArrowRight size={20} aria-hidden="true" />}
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
        {s.supportingServices.length > 0 && (
          <div className="related-list">
            {s.supportingServices.map((service) => (
              <a href={"/services/" + service.slug} key={service.slug}>
                <h3>{service.title}</h3>
                <p>{service.short}</p>
                <ArrowUpRight size={20} />
              </a>
            ))}
          </div>
        )}
        <TextLink href="/solutions">Explore other industries</TextLink>
      </section>
      <ProjectCTA service="Business & industry solutions" />
    </>
  );
}

export function PortfolioPage({
  projects,
  content,
}: {
  projects: ProjectView[];
  content: PageContentView["portfolio"];
}) {
  // The note describes concepts, so it is shown only while every entry is one.
  const onlyConcepts = projects.length > 0 && projects.every(isPlannedConcept);
  const { note } = content;
  return (
    <>
      <PageHero
        label={content.hero.label}
        title={content.hero.headingLines}
        description={content.hero.description}
      />
      <section className="container portfolio-directory">
        {onlyConcepts && (note.statusLabel || note.body) && (
          <div className="portfolio-note">
            {note.statusLabel && (
              <span className="status-label">{note.statusLabel}</span>
            )}
            {note.body && <p>{note.body}</p>}
          </div>
        )}
        <ProjectList
          projects={projects.map((p) => ({
            slug: p.slug,
            name: p.name,
            title: p.title,
            type: p.type,
            status: p.status,
            intro: p.intro,
            photo: p.photo,
            linkLabel: p.linkLabel,
          }))}
        />
      </section>
      <ProjectCTA
        title={<Lines lines={content.cta.titleLines} />}
        description={content.cta.description}
        service={content.cta.service || undefined}
      />
    </>
  );
}
export function ProjectPage({ project: p }: { project: ProjectView }) {
  // The concept wording describes planned product concepts only.
  const concept = isPlannedConcept(p);
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
          {concept ? (
            <>
              <span>Product concept</span>
              <span>No commercial release</span>
              <span>Discovery to be planned</span>
            </>
          ) : (
            <span>{p.type}</span>
          )}
        </div>
      </section>
      {p.photo && (
        <div className="container project-wide-image">
          <ResponsivePhoto photo={p.photo} priority />
          {p.type === "Product concepts" && (
            <p className="photo-note">
              Representative industry photography. This is not a product screenshot.
            </p>
          )}
        </div>
      )}
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
          {p.direction && (
            <>
              <h3>What would come next</h3>
              <p>{p.direction}</p>
            </>
          )}
          {concept && (
            <div className="technical-note">
              <span className="small-label">Current status</span>
              <p>
                This is a product direction, not a completed project or live
                product. Technology choices, screenshots, customer use and
                measurable outcomes are not yet available.
              </p>
            </div>
          )}
          {p.relatedSolution && (
            <TextLink href={"/solutions/" + p.relatedSolution.slug}>
              Explore the related industry solution
            </TextLink>
          )}
        </div>
      </section>
      <ProjectCTA
        title="Help shape a more useful product."
        description="If this direction matches a challenge in your organization, we would like to understand your workflow."
      />
    </>
  );
}

export function AcademyPage({ content }: { content: PageContentView["academy"] }) {
  const { hero, intention, topics, next } = content;
  return (
    <>
      <section className="container academy-hero">
        <div>
          {hero.eyebrow && <Eyebrow>{hero.eyebrow}</Eyebrow>}
          <h1>
            <Lines lines={hero.headingLines} />
            {hero.headingAccent && (
              <>
                {hero.headingLines.length > 0 && <br />}
                <span>{hero.headingAccent}</span>
              </>
            )}
          </h1>
          {hero.description && <p className="lead">{hero.description}</p>}
          {hero.statusLabel && (
            <span className="status-label">{hero.statusLabel}</span>
          )}
        </div>
        {hero.image && <ResponsivePhoto photo={hero.image} priority />}
      </section>
      {intention.enabled && (
        <section className="container editorial-split">
          {intention.eyebrow && <Eyebrow>{intention.eyebrow}</Eyebrow>}
          <div>
            <h2>
              <Lines lines={intention.headingLines} />
            </h2>
            {intention.paragraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </section>
      )}
      {topics.enabled && (
        <section className="container academy-topics">
          <SectionHead label={topics.eyebrow} title={topics.title} />
          <div>
            {topics.groups.map((group, i) => (
              <article key={group.title}>
                <span className="topic-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3>{group.title}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}
      {next.enabled && (
        <section className="container academy-next">
          <div>
            {next.eyebrow && <Eyebrow>{next.eyebrow}</Eyebrow>}
            <h2>
              <Lines lines={next.headingLines} />
            </h2>
            {next.body && <p>{next.body}</p>}
          </div>
          {next.link && (
            <ButtonLink href={next.link.href}>{next.link.label}</ButtonLink>
          )}
        </section>
      )}
    </>
  );
}

export function ContactPage({
  content,
  contact,
}: {
  content: PageContentView["contact"];
  contact: ContactSectionData;
}) {
  const { hero, section, next } = content;
  return (
    <>
      <section className="contact-page-intro container">
        {hero.eyebrow && <Eyebrow>{hero.eyebrow}</Eyebrow>}
        <h1>
          <Lines lines={hero.headingLines} />
        </h1>
        {hero.description && <p className="lead">{hero.description}</p>}
      </section>
      <ContactSection
        standalone
        eyebrow={section.eyebrow}
        heading={<Lines lines={section.headingLines} />}
        data={contact}
      />
      {next.enabled && (
        <section className="container contact-next">
          {next.eyebrow && <Eyebrow>{next.eyebrow}</Eyebrow>}
          <div>
            <h2>
              <Lines lines={next.headingLines} />
            </h2>
            {next.body && <p>{next.body}</p>}
          </div>
        </section>
      )}
    </>
  );
}

/** Any standalone page from the CMS, such as the privacy notice. */
export function StandalonePage({ page }: { page: Page }) {
  return (
    <>
      <PageHero
        label={page.hero?.eyebrow || page.title}
        title={(page.hero?.heading || page.title).split(/\r?\n/)}
        description={page.hero?.description || ""}
      />
      <article className="container prose">
        <RichText data={page.body} />
      </article>
    </>
  );
}
