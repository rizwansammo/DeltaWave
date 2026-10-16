import ts from "typescript";
import { readFile, access } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
export async function resolve(specifier, context, next) {
  if (specifier === "next/navigation")
    return {
      url: new URL("./navigation-stub.mjs", import.meta.url).href,
      shortCircuit: true,
    };
  // Stylesheets are bundled by Next.js; markup rendering does not need them.
  if (/\.s?css$/.test(specifier))
    return { url: "data:text/javascript,export {}", shortCircuit: true };
  let candidate = specifier.startsWith("@/")
    ? path.join(root, specifier.slice(2))
    : specifier.startsWith(".") && context.parentURL?.startsWith("file:")
      ? path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier)
      : null;
  if (candidate && !candidate.includes("node_modules")) {
    for (const ext of ["", ".ts", ".tsx", ".mjs"]) {
      try {
        await access(candidate + ext);
        return { url: pathToFileURL(candidate + ext).href, shortCircuit: true };
      } catch {}
    }
  }
  return next(specifier, context);
}
export async function load(url, context, next) {
  if (/\.(tsx|ts)$/.test(url) && !url.includes("node_modules")) {
    const source = await readFile(fileURLToPath(url), "utf8");
    return {
      format: "module",
      source: ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
        },
      }).outputText,
      shortCircuit: true,
    };
  }
  return next(url, context);
}
