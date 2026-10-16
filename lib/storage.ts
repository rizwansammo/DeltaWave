import { s3Storage } from "@payloadcms/storage-s3";

// Media storage. Cloudflare R2 (S3-compatible) when its four variables are
// set; otherwise local disk under MEDIA_DIR, which production mounts as a
// persistent volume. Files are served through Payload's /cms-api/media/file
// route with its access rules unless R2_PUBLIC_URL names a public bucket URL.

type Env = Record<string, string | undefined>;

export function r2Settings(env: Env = process.env) {
  const bucket = env.R2_BUCKET?.trim();
  const endpoint = env.R2_ENDPOINT?.trim();
  const accessKeyId = env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) return null;
  return {
    bucket,
    endpoint,
    accessKeyId,
    secretAccessKey,
    publicUrl: env.R2_PUBLIC_URL?.trim().replace(/\/+$/, "") || "",
  };
}

export const r2Configured = (env: Env = process.env) => r2Settings(env) !== null;

export function storagePlugins(env: Env = process.env) {
  const r2 = r2Settings(env);
  if (!r2) return [];
  return [
    s3Storage({
      bucket: r2.bucket,
      collections: {
        media: r2.publicUrl
          ? {
              prefix: "media",
              generateFileURL: ({ filename, prefix }) => `${r2.publicUrl}/${prefix}/${filename}`,
            }
          : { prefix: "media" },
      },
      config: {
        endpoint: r2.endpoint,
        region: "auto",
        forcePathStyle: true,
        credentials: { accessKeyId: r2.accessKeyId, secretAccessKey: r2.secretAccessKey },
      },
    }),
  ];
}
