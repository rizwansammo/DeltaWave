import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { safePath } from "../lib/preview-path.ts";
import {
  approvedPageContentView,
  approvedSettingsView,
  businessContact,
  toPageContentView,
  toSettingsView,
} from "../lib/cms/pages-view.ts";
import { approvedPageContent, approvedPrivacyPage } from "../lib/cms/pages-approved.ts";
import { toLexical } from "../lib/cms/lexical.ts";
import { RichText } from "../components/site/rich-text.tsx";
import { AboutPage, AcademyPage } from "../components/site/pages.tsx";

test("preview links only ever point at a page of this website", () => {
  assert.equal(safePath("/about"), "/about");
  assert.equal(safePath("/services/web-application-development"), "/services/web-application-development");
  assert.equal(safePath("/contact?service=Other"), "/contact?service=Other");
  for (const bad of [
    "https://attacker.example/",
    "//attacker.example/",
    "/admin",
    "/admin/collections/pages",
    "/api/enquiry",
    "javascript:alert(1)",
    "about",
    "",
    null,
    undefined,
  ])
    assert.equal(safePath(bad), null, String(bad));
});

test("published page content maps without defaults; empty fields stay empty", () => {
  const view = toPageContentView({
    about: {
      hero: { label: "About", heading: "One\r\nTwo", description: "Lead" },
      imageCaption: "",
      intro: { eyebrow: "", heading: "Who", lead: "", paragraphs: [{ text: " Kept " }, { text: "  " }] },
      principles: { enabled: false, title: "Hidden but kept", items: [] },
      direction: { enabled: null, heading: "Shown", link: { label: "Go", href: "" } },
      cta: { title: "Talk", description: "", service: "Other" },
      seo: { title: " ", description: "Desc" },
    },
    academy: { hero: { heading: "A", description: "B", image: 7 }, topics: { groups: [] } },
    contact: { section: { detailsIntro: "First\nSecond" } },
    services: {},
    solutions: {},
    portfolio: {},
  });
  assert.deepEqual(view.about.hero.headingLines, ["One", "Two"]);
  assert.deepEqual(view.about.intro.paragraphs, ["Kept"], "blank paragraphs are dropped");
  assert.equal(view.about.imageCaption, "");
  assert.equal(view.about.principles.enabled, false);
  assert.equal(view.about.principles.title, "Hidden but kept", "hidden content is kept");
  assert.equal(view.about.direction.enabled, true, "an unset toggle means shown");
  assert.equal(view.about.direction.link, null, "a link without a destination is dropped");
  assert.equal(view.about.seo.title, "", "whitespace is not a title");
  assert.equal(view.academy.hero.image, null, "an unpopulated image is left out");
  assert.deepEqual(view.contact.section.detailsIntroLines, ["First", "Second"]);
});

test("hidden sections disappear from the page but keep their content", () => {
  const content = approvedPageContentView();
  const shown = renderToStaticMarkup(h(AboutPage, { content: content.about }));
  assert.match(shown, /class="container principles"/);
  assert.match(shown, /editorial-split direction/);
  const hidden = renderToStaticMarkup(
    h(AboutPage, {
      content: {
        ...content.about,
        principles: { ...content.about.principles, enabled: false },
        direction: { ...content.about.direction, enabled: false },
      },
    }),
  );
  assert.doesNotMatch(hidden, /class="container principles"/);
  assert.doesNotMatch(hidden, /editorial-split direction/);
  assert.match(hidden, /A thoughtful approach to moving forward/, "the rest of the page stays");
});

test("the Academy page states the real status and never invents availability", () => {
  const content = approvedPageContentView().academy;
  const html = renderToStaticMarkup(h(AcademyPage, { content }));
  assert.match(html, /In planning · Enrollment is not open/);
  assert.doesNotMatch(html, /enroll now|apply today|fees from|certificate guaranteed/i);
  assert.equal(approvedPageContent.academy.hero.statusLabel, "In planning · Enrollment is not open");
});

test("site settings map to the header, footer and business details", () => {
  const view = toSettingsView({
    identity: { siteName: "DeltaWave", tagline: "" },
    contact: { email: "a@b.test", phone: "+880123456789", phoneDisplay: "", location: "Somewhere" },
    social: [
      { platform: "LinkedIn", url: "https://linkedin.com/company/x" },
      { platform: "Facebook", url: "http://insecure.example" },
      { platform: "", url: "https://no-platform.example" },
    ],
    header: { ctaLabel: "Talk", ctaHref: "" },
    footer: { statement: "One\nTwo", caption: "", closingLink: { label: "Go", href: "/contact" } },
  });
  assert.equal(view.headerCta, null, "a call to action needs both parts");
  assert.deepEqual(view.footer.statementLines, ["One", "Two"]);
  assert.deepEqual(view.footer.captionLines, []);
  assert.deepEqual(
    view.social.map((s) => s.platform),
    ["LinkedIn"],
    "only complete https profiles are shown",
  );
  assert.equal(businessContact(view).phoneDisplay, "+880123456789", "falls back to the dialling number");
  assert.equal(businessContact(approvedSettingsView()).siteName, "DeltaWave Technology");
});

test("the approved privacy notice survives the round trip through rich text", () => {
  const html = renderToStaticMarkup(h(RichText, { data: toLexical(approvedPrivacyPage.body) }));
  assert.match(html, /^<h2>Information you provide<\/h2>/);
  assert.match(html, /<a href="mailto:[^"]+">/);
  assert.match(html, /DeltaWave Technology<br\/>/, "line breaks are kept");
  assert.equal(renderToStaticMarkup(h(RichText, { data: null })), "");
});

test("rich text renders no markup or unsafe links from stored content", () => {
  const text = (value) => ({ type: "text", text: value, format: 0, version: 1 });
  const data = {
    root: {
      type: "root",
      children: [
        { type: "paragraph", children: [text("<img src=x onerror=alert(1)>")] },
        {
          type: "link",
          fields: { url: "javascript:alert(1)" },
          children: [text("Unsafe")],
        },
        { type: "link", fields: { url: "https://example.com", newTab: true }, children: [text("Safe")] },
        { type: "unknown-block", children: [text("Still readable")] },
      ],
    },
  };
  const html = renderToStaticMarkup(h(RichText, { data }));
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /<img/);
  assert.doesNotMatch(html, /javascript:/);
  assert.match(html, /Unsafe/, "the label survives; only the address is dropped");
  assert.match(html, /<a href="https:\/\/example.com" target="_blank" rel="noopener noreferrer">Safe<\/a>/);
  assert.match(html, /Still readable/);
});
