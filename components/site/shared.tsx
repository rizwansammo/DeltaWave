import { ArrowUpRight, ArrowRight } from "lucide-react";
import { Brand } from "./brand";
import { nav, site } from "@/lib/site";

export function ButtonLink({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <a className={"button " + (secondary ? "button-outline" : "")} href={href}>
      {children}
      <ArrowUpRight size={17} aria-hidden="true" />
    </a>
  );
}
export function TextLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a className="text-link" href={href}>
      {children}
      <ArrowUpRight size={17} aria-hidden="true" />
    </a>
  );
}
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow">
      <span aria-hidden="true" />
      {children}
    </p>
  );
}
const images: Record<
  string,
  { file: string; alt: string; width: number; height: number }
> = {
  architecture: {
    file: "architecture",
    alt: "White modern architecture viewed against a pale blue sky",
    width: 2200,
    height: 1467,
  },
  detail: {
    file: "detail",
    alt: "Silver architectural facade with a precise repeating pattern",
    width: 1800,
    height: 2267,
  },
  workplace: {
    file: "workplace",
    alt: "An editorial photograph of people collaborating around laptops",
    width: 1600,
    height: 1067,
  },
  servers: {
    file: "servers",
    alt: "Network cabling and server cabinets illustrating IT infrastructure",
    width: 1600,
    height: 898,
  },
  education: {
    file: "education",
    alt: "A student using a laptop, illustrating digital learning",
    width: 1500,
    height: 2250,
  },
  logistics: {
    file: "logistics",
    alt: "Warehouse shelving illustrating stock and distribution operations",
    width: 1500,
    height: 998,
  },
};
export function Photo({
  name,
  className = "",
  priority = false,
}: {
  name: string;
  className?: string;
  priority?: boolean;
}) {
  const p = images[name] || images.architecture;
  return (
    <div className={"photo " + className}>
      <picture>
        <source
          type="image/webp"
          srcSet={`/images/${p.file}-640.webp 640w, /images/${p.file}-1100.webp 1100w, /images/${p.file}.webp ${p.width}w`}
          sizes="(max-width: 700px) 100vw, (max-width: 1100px) 70vw, 60vw"
        />
        <img
          src={`/images/${p.file}.jpg`}
          alt={p.alt}
          width={p.width}
          height={p.height}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
        />
      </picture>
    </div>
  );
}
export function SectionHead({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-head">
      <div>
        <Eyebrow>{label}</Eyebrow>
        <h2>{title}</h2>
      </div>
      {children && <div className="section-head-side">{children}</div>}
    </div>
  );
}
export function PageHero({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="page-hero container">
      <Eyebrow>{label}</Eyebrow>
      <h1>
        {title.split("<br/>").map((line, i) => (
          <span key={i}>
            {i > 0 && <br />}
            {line}
          </span>
        ))}
      </h1>
      <div className="page-hero-bottom">
        <p className="lead">{description}</p>
        {children}
      </div>
    </section>
  );
}
export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a>
      {items.map((i, n) => (
        <span key={n}>
          <span aria-hidden="true">/</span>
          {i.href ? (
            <a href={i.href}>{i.label}</a>
          ) : (
            <span aria-current="page">{i.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
export function ProjectCTA({
  title = "Let’s turn a good question into a clear plan.",
  description = "Tell us what your business needs to do. We can start with the problem, then define the right scope.",
  service,
}: {
  title?: string;
  description?: string;
  service?: string;
}) {
  return (
    <section className="container project-cta">
      <div>
        <Eyebrow>Start a conversation</Eyebrow>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <ButtonLink
        href={
          "/contact" +
          (service ? "?service=" + encodeURIComponent(service) : "")
        }
      >
        Discuss your project
      </ButtonLink>
    </section>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand">
            <Brand />
            <p>
              Thoughtful engineering.
              <br />
              Practical business technology.
            </p>
            <a className="text-link" href={"mailto:" + site.email}>
              {site.email}
              <ArrowUpRight size={15} />
            </a>
          </div>
          <div className="footer-nav">
            <p className="small-label">Explore</p>
            {nav
              .filter((x) => x[0] !== "Home")
              .map(([n, p]) => (
                <a href={p} key={p}>
                  {n}
                </a>
              ))}
          </div>
          <div className="footer-location">
            <p className="small-label">Based in Bangladesh</p>
            <address>{site.location}</address>
            <a href={"tel:" + site.phone}>{site.phoneDisplay}</a>
            <p className="footer-caption">
              Building with a local understanding
              <br />
              and a wider perspective.
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} DeltaWave Technology</p>
          <a href="/privacy">Privacy & enquiries</a>
          <a href="/contact">
            Let’s build something useful <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </footer>
  );
}
