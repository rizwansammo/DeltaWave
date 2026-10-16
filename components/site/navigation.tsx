"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, ArrowUpRight, Menu, X } from "lucide-react";
import { Brand } from "./brand";
import { nav } from "@/lib/site";
import { categories, services, solutions } from "@/lib/content";

export function Navigation() {
  const path = usePathname();
  const [open, setOpen] = useState<string | null>(null),
    [mobile, setMobile] = useState(false),
    [expanded, setExpanded] = useState<string | null>(null),
    [shownPath, setShownPath] = useState(path);
  // Close every menu when the route changes (adjusted during render).
  if (shownPath !== path) {
    setShownPath(path);
    setOpen(null);
    setMobile(false);
    setExpanded(null);
  }
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    root = useRef<HTMLElement>(null),
    toggles = useRef<Record<string, HTMLButtonElement | null>>({});
  const mobileToggle = useRef<HTMLButtonElement>(null);
  function cancel() {
    if (timer.current) clearTimeout(timer.current);
  }
  function show(name: string) {
    cancel();
    setOpen(name);
  }
  function schedule() {
    cancel();
    timer.current = setTimeout(() => setOpen(null), 160);
  }
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (open) toggles.current[open]?.focus();
        if (mobile) mobileToggle.current?.focus();
        setOpen(null);
        setMobile(false);
      }
    }
    function outside(e: PointerEvent) {
      if (!root.current?.contains(e.target as Node)) {
        setOpen(null);
        setMobile(false);
      }
    }
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", outside);
      cancel();
    };
  }, [open, mobile]);
  useEffect(() => {
    const q = matchMedia("(min-width: 1120px)");
    const close = () => {
      setMobile(false);
      setExpanded(null);
      setOpen(null);
    };
    q.addEventListener("change", close);
    return () => q.removeEventListener("change", close);
  }, []);
  return (
    <header
      ref={root}
      className="site-header"
      onMouseLeave={schedule}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(null);
      }}
    >
      <div className="header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Main navigation">
          {nav.map(([n, p]) => {
            const has = n === "Services" || n === "Solutions",
              active = p === "/" ? path === "/" : path.startsWith(p);
            return (
              <div
                className={"nav-item " + (active ? "is-active" : "")}
                key={p}
                onMouseEnter={() => {
                  if (has) show(n);
                  else setOpen(null);
                }}
              >
                <a href={p} aria-current={active ? "page" : undefined}>
                  {n}
                </a>
                {has && (
                  <button
                    ref={(el) => {
                      toggles.current[n] = el;
                    }}
                    className="nav-toggle"
                    aria-label={`${open === n ? "Close" : "Open"} ${n.toLowerCase()} menu`}
                    aria-expanded={open === n}
                    aria-controls={`mega-${n}`}
                    onClick={() => {
                      cancel();
                      setOpen(open === n ? null : n);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setOpen(n);
                        requestAnimationFrame(() =>
                          document
                            .querySelector<HTMLAnchorElement>(`#mega-${n} a`)
                            ?.focus(),
                        );
                      }
                    }}
                  >
                    <ChevronDown size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </nav>
        <a className="header-cta" href="/contact">
          Let’s talk <ArrowUpRight size={17} />
        </a>
        <button
          className="mobile-toggle"
          aria-label={mobile ? "Close navigation" : "Open navigation"}
          aria-expanded={mobile}
          aria-controls="mobile-nav"
          ref={mobileToggle}
          onClick={() => setMobile(!mobile)}
        >
          {mobile ? <X /> : <Menu />}
        </button>
      </div>
      {["Services", "Solutions"].map((name) => (
        <div
          key={name}
          id={"mega-" + name}
          className={"mega-menu " + (open === name ? "is-open" : "")}
          hidden={open !== name}
          onMouseEnter={cancel}
          onMouseLeave={schedule}
        >
          <div className="mega-inner">
            {name === "Services" ? (
              <>
                <div className="mega-intro">
                  <span className="small-label">Our capabilities</span>
                  <h2>
                    From an idea
                    <br />
                    to everyday impact.
                  </h2>
                  <p>Engineering, operations and design working together.</p>
                  <a href="/services">
                    View all services <ArrowUpRight size={16} />
                  </a>
                </div>
                <div className="mega-services">
                  {categories.map((cat) => (
                    <div key={cat.slug} className="mega-group">
                      <a
                        className="mega-heading"
                        href={"/services/" + cat.slug}
                      >
                        {cat.title}
                        <ArrowUpRight size={14} />
                      </a>
                      <p>{cat.short}</p>
                      {cat.links.slice(0, 4).map((slug) => (
                        <a
                          className="mega-sub"
                          key={slug}
                          href={"/services/" + slug}
                        >
                          {services.find((x) => x.slug === slug)?.title}
                        </a>
                      ))}
                      {cat.links.length > 4 && (
                        <a className="mega-sub" href={"/services/" + cat.slug}>
                          Explore this capability <ArrowUpRight size={12} />
                        </a>
                      )}
                      {cat.slug === "business-industry-solutions" &&
                        [
                          "education-coaching",
                          "ecommerce-facebook",
                          "retail-pos-restaurant",
                        ].map((slug) => (
                          <a
                            className="mega-sub"
                            key={slug}
                            href={"/solutions/" + slug}
                          >
                            {solutions.find((x) => x.slug === slug)?.title}
                          </a>
                        ))}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="mega-intro">
                  <span className="small-label">Solutions we can build</span>
                  <h2>
                    Different industries.
                    <br />
                    Specific needs.
                  </h2>
                  <p>
                    Explore custom applications for the way your business works.
                  </p>
                  <a href="/solutions">
                    Explore all solutions <ArrowUpRight size={16} />
                  </a>
                </div>
                <div className="mega-solutions">
                  {[
                    "Commerce & operations",
                    "People & organizations",
                    "Services & communities",
                  ].map((g) => (
                    <div className="mega-group" key={g}>
                      <h3>{g}</h3>
                      {solutions
                        .filter((s) => s.group === g)
                        .map((s) => (
                          <a
                            className="mega-sub"
                            href={"/solutions/" + s.slug}
                            key={s.slug}
                          >
                            {s.title}
                            <ArrowUpRight size={12} />
                          </a>
                        ))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ))}
      <nav
        id="mobile-nav"
        className="mobile-nav"
        aria-label="Mobile navigation"
        hidden={!mobile}
      >
        {nav.map(([n, p]) => (
          <div className="mobile-item" key={p}>
            <div className="mobile-item-head">
              <a href={p} aria-current={path === p ? "page" : undefined}>
                {n}
              </a>
              {(n === "Services" || n === "Solutions") && (
                <button
                  aria-label={`Expand ${n.toLowerCase()}`}
                  aria-expanded={expanded === n}
                  aria-controls={"mobile-" + n}
                  onClick={() => setExpanded(expanded === n ? null : n)}
                >
                  <ChevronDown
                    className={expanded === n ? "rotated" : ""}
                    size={20}
                  />
                </button>
              )}
            </div>
            {(n === "Services" || n === "Solutions") && (
              <div
                className="mobile-submenu"
                id={"mobile-" + n}
                hidden={expanded !== n}
              >
                {n === "Services"
                  ? categories.map((c) => (
                      <div key={c.slug}>
                        <a
                          className="mobile-category"
                          href={"/services/" + c.slug}
                        >
                          {c.title}
                        </a>
                        {c.links.map((s) => (
                          <a href={"/services/" + s} key={s}>
                            {services.find((x) => x.slug === s)?.title}
                          </a>
                        ))}
                      </div>
                    ))
                  : solutions.map((s) => (
                      <a href={"/solutions/" + s.slug} key={s.slug}>
                        {s.title}
                      </a>
                    ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </header>
  );
}
