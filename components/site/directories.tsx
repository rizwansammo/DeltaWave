"use client";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { solutions, projects } from "@/lib/content";
import { staticPhoto } from "@/lib/images";
import { ProjectEntry } from "./project-entry";

export function SolutionsDirectory() {
  const [query, setQuery] = useState(""),
    [group, setGroup] = useState("All industries");
  const found = useMemo(
    () =>
      solutions.filter(
        (s) =>
          (group === "All industries" || s.group === group) &&
          [s.title, s.intro, ...s.modules]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [query, group],
  );
  return (
    <div className="solution-directory">
      <div className="directory-controls">
        <div className="filter-buttons" aria-label="Filter industries">
          {[
            "All industries",
            "Commerce & operations",
            "People & organizations",
            "Services & communities",
          ].map((g) => (
            <button
              key={g}
              className={group === g ? "selected" : ""}
              aria-pressed={group === g}
              onClick={() => setGroup(g)}
            >
              {g}
            </button>
          ))}
        </div>
        <label className="search-field">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Search industries</span>
          <input
            type="search"
            placeholder="Find your industry"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <p className="result-count" aria-live="polite">
        {found.length} {found.length === 1 ? "solution" : "solutions"} to
        explore
      </p>
      <div className="solution-list">
        {found.map((s) => (
          <a
            key={s.slug}
            href={"/solutions/" + s.slug}
            className="solution-row"
          >
            <span className="solution-index">
              {String(solutions.indexOf(s) + 1).padStart(2, "0")}
            </span>
            <h3>{s.title}</h3>
            <p>{s.intro}</p>
            <ArrowUpRight aria-hidden="true" size={22} />
          </a>
        ))}
      </div>
      {!found.length && (
        <div className="empty-state">
          <h3>No matching industries yet.</h3>
          <p>
            Try another search, or tell us about the workflow you have in mind.
          </p>
          <button
            className="text-link"
            onClick={() => {
              setQuery("");
              setGroup("All industries");
            }}
          >
            Reset filters <ArrowUpRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
export function ProjectList({ compact = false }: { compact?: boolean }) {
  const [filter, setFilter] = useState("All work");
  const list =
    filter === "All work" || filter === "Product concepts" ? projects : [];
  return (
    <>
      {!compact && (
        <div
          className="portfolio-filters filter-buttons"
          aria-label="Filter portfolio"
        >
          {[
            "All work",
            "Real projects",
            "Case studies",
            "Software demonstrations",
            "Product concepts",
            "Under development",
          ].map((f) => (
            <button
              key={f}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={filter === f ? "selected" : ""}
            >
              {f}
            </button>
          ))}
        </div>
      )}
      <div className="project-list">
        {list.map((p, i) => (
          <ProjectEntry
            key={p.slug}
            index={i}
            project={{
              slug: p.slug,
              name: p.name,
              title: p.title,
              status: p.status,
              intro: p.intro,
              photo: staticPhoto(p.image),
              linkLabel: "Explore the concept",
            }}
          />
        ))}
      </div>
      {!list.length && (
        <div className="empty-state" role="status">
          <span className="small-label">{filter}</span>
          <h3>Good work deserves a complete story.</h3>
          <p>
            There are no approved entries in this category yet. We will share
            work here when its status and publication permissions are confirmed.
          </p>
          <button
            className="text-link"
            onClick={() => setFilter("Product concepts")}
          >
            View product concepts <ArrowUpRight size={16} />
          </button>
        </div>
      )}
    </>
  );
}
