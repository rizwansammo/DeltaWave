import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { Brand } from "../components/site/brand.tsx";
import { AdminLogo } from "../components/cms/admin-logo.tsx";
import { AdminIcon } from "../components/cms/admin-icon.tsx";
import { BrandIcon } from "../components/brand/brand-lockup.tsx";

// Reference folders are optional; checks against them run when present.
const uiDir = process.env.DELTAWAVE_UI_DIR || "../DeltaWave-UI";
const logoDir = process.env.DELTAWAVE_LOGO_DIR || "../DeltaWave-Logo";

// Markup of the approved prototype lockup (DeltaWave-UI components/site/brand.tsx).
const approvedLockup =
  '<span class="brand-icon" aria-hidden="true"><img src="/brand/deltawave_corporate_blue_128px.png" width="64" height="64" alt=""/></span>' +
  '<svg class="brand-wordmark" viewBox="0 0 162 39.5" width="162" height="39.5" aria-hidden="true">' +
  '<text x="-1.104" y="17.328" font-size="24" letter-spacing="2.42">DELTAWAVE</text>' +
  '<text x="-1.104" y="38.934" font-size="23" letter-spacing="-.5">TECHNOLOGY</text></svg>';

const sha256 = async (file) =>
  createHash("sha256").update(await readFile(file)).digest("hex");

// React 19 hoists an image preload hint in front of a standalone fragment.
// It belongs in <head> on a real page, so only the element markup is compared.
const markup = (element) =>
  renderToStaticMarkup(element).replace(/^(<link rel="preload" as="image"[^>]*\/>)+/, "");

test("site lockup renders exactly the approved prototype markup", () => {
  assert.equal(
    markup(h(Brand)),
    `<a class="brand" href="/" aria-label="DeltaWave Technology home">${approvedLockup}</a>`,
  );
});

test("site lockup is identical to the prototype component itself", async (t) => {
  const file = path.resolve(uiDir, "components/site/brand.tsx");
  if (!existsSync(file)) return t.skip(`prototype not found at ${uiDir}`);
  // The reference folder has no node_modules, so compile its component
  // against this project's React.
  const js = ts
    .transpileModule(await readFile(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
    })
    .outputText.replaceAll('"react/jsx-runtime"', JSON.stringify(import.meta.resolve("react/jsx-runtime")));
  const prototype = await import(`data:text/javascript,${encodeURIComponent(js)}`);
  assert.equal(markup(h(Brand)), markup(h(prototype.Brand)));
});

test("CMS logo and icon reuse the same lockup markup", () => {
  assert.equal(
    markup(h(AdminLogo)),
    `<span class="brand dw-admin-logo" role="img" aria-label="DeltaWave Technology">${approvedLockup}</span>`,
  );
  assert.equal(markup(h(AdminIcon)), `<span class="dw-admin-icon">${markup(h(BrandIcon))}</span>`);
});

test("lockup geometry keeps the approved values", async () => {
  const css = await readFile("components/brand/brand.css", "utf8");
  const rule = (selector) => {
    const match = css.match(new RegExp(`(^|\\n)${selector.replace(/[.*]/g, "\\$&")} \\{([^}]*)\\}`));
    assert.ok(match, `missing rule ${selector}`);
    return match[2].replace(/\s+/g, " ").trim();
  };
  assert.equal(
    rule(".brand"),
    "display: flex; align-items: center; gap: 12px; flex-shrink: 0; width: 224px; height: 40px; color: var(--blue);",
  );
  assert.equal(
    rule(".brand-icon"),
    "display: block; position: relative; overflow: hidden; width: 49.25px; height: 39.5px; flex: 0 0 49.25px;",
  );
  assert.equal(
    rule(".brand-icon img"),
    "position: absolute; width: 64px; height: 64px; max-width: none; left: -7.375px; top: -9.75px;",
  );
  assert.equal(
    rule(".brand-wordmark"),
    "font-family: ELNATH, sans-serif; font-kerning: normal; fill: var(--blue); overflow: visible; flex: 0 0 162px;",
  );
});

test("shared stylesheets reproduce the prototype CSS line for line", async (t) => {
  const file = path.resolve(uiDir, "app/globals.css");
  if (!existsSync(file)) return t.skip(`prototype not found at ${uiDir}`);
  const original = (await readFile(file, "utf8")).split("\n");
  const body = async (f, skip) => (await readFile(f, "utf8")).split("\n").slice(skip);
  assert.deepEqual(await body("styles/fonts.css", 3), [...original.slice(0, 32), ""]);
  assert.deepEqual(await body("styles/tokens.css", 2), [...original.slice(32, 43), ""]);
  assert.deepEqual(await body("components/brand/brand.css", 4), [...original.slice(275, 307), ""]);
  assert.deepEqual(await body("app/(frontend)/globals.css", 8), [
    ...original.slice(43, 275),
    ...original.slice(307),
  ]);
});

test("the public site ships its CSS as one stylesheet, shared files first", async () => {
  const globals = await readFile("app/(frontend)/globals.css", "utf8");
  assert.deepEqual(globals.match(/^@import "[^"]+";$/gm), [
    '@import "../../styles/fonts.css";',
    '@import "../../styles/tokens.css";',
    '@import "../../components/brand/brand.css";',
  ]);
  const layout = await readFile("app/(frontend)/layout.tsx", "utf8");
  assert.deepEqual(layout.match(/^import "[^"]+\.s?css";$/gm), ['import "./globals.css";']);
  const lockup = await readFile("components/brand/brand-lockup.tsx", "utf8");
  assert.doesNotMatch(lockup, /^import .*\.css/m);
});

test("ELNATH is loaded from the supplied font files", async () => {
  const css = await readFile("styles/fonts.css", "utf8");
  const face = css.match(/@font-face \{\s*font-family: ELNATH;[^}]*\}/);
  assert.ok(face);
  assert.match(face[0], /url\("\/fonts\/elnath\.woff2"\) format\("woff2"\)/);
  assert.match(face[0], /url\("\/fonts\/ELNATH\.ttf"\) format\("truetype"\)/);
  assert.match(face[0], /font-display: block/);
  for (const f of ["elnath.woff2", "ELNATH.ttf", "ELNATH.otf"])
    assert.ok(existsSync(`public/fonts/${f}`), f);
});

test("brand assets are byte-identical to the owner's originals", async (t) => {
  if (!existsSync(logoDir)) return t.skip(`original logo folder not found at ${logoDir}`);
  const originals = (await readdir(logoDir)).filter((f) => /\.(png|otf|ttf)$/i.test(f));
  assert.equal(originals.filter((f) => f.endsWith(".png")).length, 11);
  for (const name of originals) {
    const local = name.endsWith(".png") ? `public/brand/${name}` : `public/fonts/${name}`;
    assert.equal(await sha256(local), await sha256(path.join(logoDir, name)), name);
  }
});

test("favicon is the original 32px optical icon", async () => {
  assert.equal(
    await sha256("public/favicon.png"),
    await sha256("public/brand/deltawave_corporate_blue_optical_32px.png"),
  );
});
