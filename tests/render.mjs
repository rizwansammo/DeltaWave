import { mkdir, writeFile } from "node:fs/promises";
import { allPaths } from "../lib/content.ts";
import { renderSite } from "./render-site.mjs";

// Real 404 behaviour needs a request and the database, so it is covered by
// the browser tests; this renders the approved markup of every page.
await mkdir(".qa/rendered", { recursive: true });
const pages = await renderSite();
for (const page of pages) await writeFile(`.qa/rendered/${page.name}.html`, page.html);
await writeFile(
  ".qa/metadata.json",
  JSON.stringify(
    pages.filter((p) => p.meta).map((p) => ({ path: p.path, ...p.meta })),
    null,
    2,
  ),
);
await writeFile(".qa/routes.json", JSON.stringify(allPaths, null, 2));
console.log(
  `Rendered ${allPaths.length} page components and custom 404 using React server rendering. This is not browser QA.`,
);
