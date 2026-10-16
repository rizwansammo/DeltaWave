import { Fragment } from "react";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { Brand } from "./brand";
import { nav } from "@/lib/site";
import { staticPhoto, type PhotoSource } from "@/lib/images";
import type { SettingsView } from "@/lib/cms/pages-view";

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
/** A responsive photograph from either public/images or the CMS media library. */
export function ResponsivePhoto({
  photo,
  className = "",
  priority = false,
}: {
  photo: PhotoSource;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={"photo " + className}>
      <picture>
        {photo.srcSet && (
          <source
            type="image/webp"
            srcSet={photo.srcSet}
            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 70vw, 60vw"
          />
        )}
        <img
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
        />
      </picture>
    </div>
  );
}
export function Photo({
  name,
  className = "",
  priority = false,
}: {
  name: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <ResponsivePhoto photo={staticPhoto(name)} className={className} priority={priority} />
  );
}
/** Text with each entry on its own line, as typed in the CMS. */
export function Lines({
  lines,
  breakClassName,
  spaced = false,
}: {
  lines: string[];
  /** Class for the <br>, for breaks that only apply at some widths. */
  breakClassName?: string;
  /** Keep the space a sentence has when it wraps instead of breaking. */
  spaced?: boolean;
}) {
  return lines.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br className={breakClassName} />}
      {i > 0 && spaced ? " " + line : line}
    </Fragment>
  ));
}
export function SectionHead({
  label,
  title,
  children,
}: {
  label?: string;
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-head">
      <div>
        {label && <Eyebrow>{label}</Eyebrow>}
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
  title: string | string[];
  description: string;
  children?: React.ReactNode;
}) {
  const lines = Array.isArray(title) ? title : title.split("<br/>");
  return (
    <section className="page-hero container">
      <Eyebrow>{label}</Eyebrow>
      <h1>
        {lines.map((line, i) => (
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
  title?: React.ReactNode;
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
export function Footer({ settings }: { settings: SettingsView }) {
  const { footer } = settings;
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand">
            <Brand />
            {footer.statementLines.length > 0 && (
              <p>
                <Lines lines={footer.statementLines} />
              </p>
            )}
            {settings.email && (
              <a className="text-link" href={"mailto:" + settings.email}>
                {settings.email}
                <ArrowUpRight size={15} />
              </a>
            )}
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
            {footer.locationLabel && (
              <p className="small-label">{footer.locationLabel}</p>
            )}
            {settings.location && <address>{settings.location}</address>}
            {settings.phone && (
              <a href={"tel:" + settings.phone}>
                {settings.phoneDisplay || settings.phone}
              </a>
            )}
            {footer.captionLines.length > 0 && (
              <p className="footer-caption">
                <Lines lines={footer.captionLines} />
              </p>
            )}
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} {settings.siteName}
          </p>
          <a href="/privacy">Privacy & enquiries</a>
          {footer.closingLink && (
            <a href={footer.closingLink.href}>
              {footer.closingLink.label} <ArrowRight size={14} />
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
