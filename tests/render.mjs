import { mkdir, writeFile } from "node:fs/promises";
import Page from "../app/(frontend)/[...slug]/page.tsx";
import { allPaths } from "../lib/content.ts";
import { renderSite } from "./render-site.mjs";

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
try {
  await Page({ params: Promise.resolve({ slug: ["does-not-exist"] }) });
  throw new Error("Missing 404");
} catch (e) {
  if (e.message !== "NOT_FOUND") throw e;
}
console.log(
  `Rendered ${allPaths.length} page components and custom 404 using React server rendering. This is not browser QA.`,
);
