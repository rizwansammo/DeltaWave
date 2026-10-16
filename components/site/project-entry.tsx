import { ArrowUpRight } from "lucide-react";
import type { PhotoSource } from "@/lib/images";
import { ResponsivePhoto, TextLink } from "./shared";

export type ProjectSummary = {
  slug: string;
  name: string;
  title: string;
  status: string;
  intro: string;
  photo: PhotoSource | null;
  linkLabel: string;
};

/** One portfolio entry, shared by the portfolio page and the homepage. */
export function ProjectEntry({ project: p, index: i }: { project: ProjectSummary; index: number }) {
  return (
    <article className={"project-entry project-" + i}>
      <a
        className="project-image"
        href={"/portfolio/" + p.slug}
        tabIndex={-1}
        aria-hidden="true"
      >
        {p.photo && <ResponsivePhoto photo={p.photo} />}
        <span>{p.status}</span>
      </a>
      <div className="project-meta">
        <span className="small-label">{p.name}</span>
        <span>0{i + 1}</span>
      </div>
      <h3>
        <a href={"/portfolio/" + p.slug}>
          {p.title}
          <ArrowUpRight size={23} />
        </a>
      </h3>
      <p>{p.intro}</p>
      <TextLink href={"/portfolio/" + p.slug}>{p.linkLabel}</TextLink>
    </article>
  );
}
