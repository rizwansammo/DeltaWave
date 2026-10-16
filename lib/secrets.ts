import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Encryption of credentials stored in the CMS database (the SMTP password).
// AES-256-GCM with a master key that exists only in the server environment
// (CREDENTIALS_ENCRYPTION_KEY), never in the database, its backups or the
// image. Each value gets a fresh 96-bit IV and is bound to its purpose, so a
// ciphertext copied into another field does not decrypt.
//
// Stored form: v1:<key fingerprint>:<iv>:<auth tag>:<ciphertext> (base64url).
// If the key is lost or replaced, stored values cannot be read and the
// password is simply entered again in the CMS.

type Env = Record<string, string | undefined>;

const VERSION = "v1";

/** The 32-byte master key (64 hex characters or base64), or null if absent or malformed. */
export function encryptionKey(env: Env = process.env): Buffer | null {
  const raw = env.CREDENTIALS_ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  const key = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  return key.length === 32 ? key : null;
}

/** A short public fingerprint of the key, so a value from another key is recognised. */
export const keyFingerprint = (key: Buffer) =>
  createHash("sha256").update("deltawave-credentials:").update(key).digest("hex").slice(0, 12);

export function encryptSecret(plain: string, purpose: string, key: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(purpose, "utf8"));
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [VERSION, keyFingerprint(key), iv, cipher.getAuthTag(), data]
    .map((part) => (typeof part === "string" ? part : part.toString("base64url")))
    .join(":");
}

export type Decrypted = { ok: true; value: string } | { ok: false; reason: "malformed" | "other-key" | "corrupt" };

export function decryptSecret(stored: string, purpose: string, key: Buffer): Decrypted {
  const parts = stored.split(":");
  if (parts.length !== 5 || parts[0] !== VERSION) return { ok: false, reason: "malformed" };
  const [, fingerprint, iv, tag, data] = parts;
  if (fingerprint !== keyFingerprint(key)) return { ok: false, reason: "other-key" };
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
    decipher.setAAD(Buffer.from(purpose, "utf8"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    const value = Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]);
    return { ok: true, value: value.toString("utf8") };
  } catch {
    return { ok: false, reason: "corrupt" };
  }
}
