import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdir, writeFile } from "node:fs/promises";
import { HomePage } from "../components/site/pages.tsx";
import { Navigation } from "../components/site/navigation.tsx";
import { Footer } from "../components/site/shared.tsx";
import Page, { generateMetadata } from "../app/(frontend)/[...slug]/page.tsx";
import NotFound from "../app/(frontend)/not-found.tsx";
import { allPaths } from "../lib/content.ts";
await mkdir(".qa/rendered", { recursive: true });
const meta = [];
for (const route of allPaths) {
  const slug = route.slice(1).split("/");
  const node =
    route === "/"
      ? h(HomePage)
      : await Page({ params: Promise.resolve({ slug }) });
  const page = renderToStaticMarkup(
    h(
      "html",
      { lang: "en" },
      h(
        "body",
        null,
        h(Navigation),
        h("main", { id: "main-content" }, node),
        h(Footer),
      ),
    ),
  );
  await writeFile(
    ".qa/rendered/" + (route === "/" ? "home" : slug.join("__")) + ".html",
    page,
  );
  if (route !== "/")
    meta.push({
      path: route,
      ...(await generateMetadata({ params: Promise.resolve({ slug }) })),
    });
}
await writeFile(
  ".qa/rendered/not-found.html",
  renderToStaticMarkup(h(NotFound)),
);
await writeFile(".qa/metadata.json", JSON.stringify(meta, null, 2));
await writeFile(".qa/routes.json", JSON.stringify(allPaths, null, 2));
try {
  await Page({ params: Promise.resolve({ slug: ["does-not-exist"] }) });
  throw new Error("Missing 404");
} catch (e) {
  if (e.message !== "NOT_FOUND") throw e;
}
console.log(
  `Rendered ${allPaths.length} page components and custom 404 using React server rendering. This is not browser QA.`,
);
