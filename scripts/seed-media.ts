// Shared by the seeds: uploads the approved photographs from public/images
// once each, as trusted server code (Local API, overrideAccess).
import { copyFile, stat } from "node:fs/promises";
import path from "node:path";
import type { Payload, PayloadRequest } from "payload";
import sharp from "sharp";
import { images } from "../lib/images";
import type { Media } from "../payload-types";

export type SeedResult = [kind: string, name: string, outcome: "created" | "kept" | "completed"];

const imagesDir = path.resolve("public/images");

/**
 * An approved photograph, uploaded once from its full-size WebP master in
 * public/images (the JPEG beside it is a smaller fallback for old browsers).
 */
export async function seedPhoto(payload: Payload, key: string, results: SeedResult[], req?: Partial<PayloadRequest>) {
  const p = images[key];
  if (!p) throw new Error(`Unknown approved image "${key}" (see lib/images.ts).`);
  const filename = `${p.file}.webp`;
  const { docs } = await payload.find({
    collection: "media",
    where: { filename: { equals: filename } },
    limit: 1,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    req,
  });
  if (docs[0]) {
    results.push(["media", filename, "kept"]);
    return docs[0].id;
  }
  // No record owns this name, so a file left on disk by an earlier database
  // is an orphan; overwriting it keeps the name stable for the lookup above.
  const doc = await payload.create({
    collection: "media",
    data: { alt: p.alt, credit: p.credit },
    filePath: path.join(imagesDir, filename),
    overwriteExistingFiles: true,
    overrideAccess: true,
    req,
  });
  const installed = await installApprovedWebp(payload, doc, p.file, req);
  results.push(["media", `${filename}${installed.length ? ` (approved WebP: ${installed.join(", ")})` : ""}`, "created"]);
  return doc.id;
}

/**
 * Payload re-encodes WebP uploads (it treats WebP as possibly animated) and
 * encodes its own WebP sizes, both slightly differently from the prototype.
 * Where the stored original or a generated size has exactly the dimensions of
 * one of the approved WebP files, that file is installed in its place, so the
 * seeded site serves the approved images byte for byte.
 */
async function installApprovedWebp(payload: Payload, doc: Media, file: string, req?: Partial<PayloadRequest>) {
  const mediaDir = path.resolve(payload.collections.media.config.upload.staticDir ?? "media");
  const approved = new Map<string, string>();
  for (const name of [`${file}-640.webp`, `${file}-1100.webp`, `${file}.webp`]) {
    const source = path.join(imagesDir, name);
    const { width, height } = await sharp(source).metadata();
    approved.set(`${width}x${height}`, source);
  }
  const install = async (stored: { filename?: string | null; width?: number | null; height?: number | null; mimeType?: string | null } | undefined) => {
    if (!stored?.filename || stored.mimeType !== "image/webp") return null;
    const source = approved.get(`${stored.width}x${stored.height}`);
    if (!source) return null;
    await copyFile(source, path.join(mediaDir, stored.filename));
    return (await stat(source)).size;
  };

  const installed: string[] = [];
  const data: { filesize?: number; sizes?: Partial<Record<"small" | "medium" | "large", { filesize: number }>> } = {};
  const original = await install(doc);
  if (original !== null) {
    data.filesize = original;
    installed.push("original");
  }
  for (const size of ["small", "medium", "large"] as const) {
    const filesize = await install(doc.sizes?.[size]);
    if (filesize === null) continue;
    data.sizes = { ...data.sizes, [size]: { filesize } };
    installed.push(size);
  }
  if (installed.length > 0) {
    await payload.update({ collection: "media", id: doc.id, data, overrideAccess: true, req });
  }
  return installed;
}

export function printResults(heading: string, results: SeedResult[]) {
  console.log(heading);
  for (const [kind, name, outcome] of results) console.log(`  ${outcome.padEnd(10)}${kind}: ${name}`);
}
