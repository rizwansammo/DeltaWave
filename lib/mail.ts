import nodemailer, { type MailMessage, type Transporter } from "nodemailer";
import type { EmailAdapter, Payload, SendEmailOptions } from "payload";
import { decryptSecret, encryptionKey, encryptSecret } from "./secrets";
import { site } from "./site";
import {
  describeSmtpError,
  parseSmtpInput,
  resolveSmtpHost,
  transportOptions,
  type SmtpConnection,
  type SmtpFields,
  type SmtpSecurity,
} from "./smtp";

// Outgoing email for the whole application: enquiry notifications, test
// messages and Payload's password resets. The SMTP connection is configured
// by administrators in the CMS (Site settings → Email & enquiries) and read
// on every send, so a change applies to the next message without a rebuild
// or restart. There is no fallback to any other mail account: without a
// complete CMS configuration nothing is sent and the reason is reported.
//
// Sending never throws. Payload's password reset awaits the adapter only for
// accounts that exist, so an error would reveal which addresses have
// accounts; failures are returned and logged without message contents.

export const SMTP_GLOBAL = "smtp-settings";
const PASSWORD_PURPOSE = "deltawave:smtp-password";

/** Header values may not carry line breaks (header injection). */
export const headerSafe = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

type Stored = {
  host?: string | null;
  port?: string | null;
  security?: SmtpSecurity | null;
  username?: string | null;
  passwordEncrypted?: string | null;
  passwordUpdatedAt?: string | null;
  updatedBy?: string | null;
  updatedAt?: string | null;
  lastTest?: { at?: string | null; ok?: boolean | null; message?: string | null } | null;
};

export type SmtpState = "not-configured" | "incomplete" | "no-key" | "key-mismatch" | "ready";

/** What administrators may see. Never contains the password or its ciphertext. */
export type SmtpStatus = {
  state: SmtpState;
  summary: string;
  host: string;
  port: number | null;
  security: SmtpSecurity | null;
  username: string;
  passwordSet: boolean;
  passwordUpdatedAt: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  encryptionKeyConfigured: boolean;
  lastTest: { at: string; ok: boolean; message: string } | null;
};

type Env = Record<string, string | undefined>;
export type MailDeps = {
  createTransport?: (options: ReturnType<typeof transportOptions>) => Transporter;
  lookup?: Parameters<typeof resolveSmtpHost>[1];
  env?: Env;
};
const realTransport = (options: ReturnType<typeof transportOptions>) => nodemailer.createTransport(options);
const heloName = () => new URL(site.url).hostname;

async function readStored(payload: Payload): Promise<Stored> {
  return (await payload.findGlobal({ slug: SMTP_GLOBAL, depth: 0, overrideAccess: true })) as Stored;
}

/** The stored connection with its password, for sending only. */
function connectionFrom(stored: Stored, env?: Env): { state: SmtpState; connection?: SmtpConnection } {
  const fields = {
    host: stored.host ?? "",
    port: Number(stored.port),
    security: stored.security ?? undefined,
    username: stored.username ?? "",
  };
  if (!fields.host && !fields.username && !stored.passwordEncrypted) return { state: "not-configured" };
  if (!fields.host || !fields.port || !fields.security || !fields.username || !stored.passwordEncrypted)
    return { state: "incomplete" };
  const key = encryptionKey(env);
  if (!key) return { state: "no-key" };
  const password = decryptSecret(stored.passwordEncrypted, PASSWORD_PURPOSE, key);
  if (!password.ok) return { state: "key-mismatch" };
  return { state: "ready", connection: { ...(fields as SmtpFields), password: password.value } };
}

const summaries: Record<SmtpState, string> = {
  "not-configured": "Not configured. No email is sent: enquiries are still saved, but nobody is notified and password resets cannot be emailed.",
  incomplete: "Incomplete. Host, port, security, username and password are all needed before email can be sent.",
  "no-key": "The server's credential encryption key (CREDENTIALS_ENCRYPTION_KEY) is missing, so the password cannot be stored or used. This needs the server administrator.",
  "key-mismatch": "The stored password cannot be decrypted with the server's current key. Enter the password again and save.",
  ready: "Configured. Use Test connection to check it.",
};

export async function smtpStatus(payload: Payload, env?: Env): Promise<SmtpStatus> {
  const stored = await readStored(payload);
  const { state } = connectionFrom(stored, env);
  const lastTest =
    stored.lastTest?.at && typeof stored.lastTest.ok === "boolean"
      ? { at: stored.lastTest.at, ok: stored.lastTest.ok, message: stored.lastTest.message ?? "" }
      : null;
  return {
    state,
    summary: summaries[state],
    host: stored.host ?? "",
    port: stored.port ? Number(stored.port) : null,
    security: stored.security ?? null,
    username: stored.username ?? "",
    passwordSet: Boolean(stored.passwordEncrypted),
    passwordUpdatedAt: stored.passwordUpdatedAt ?? null,
    updatedAt: stored.updatedAt ?? null,
    updatedBy: stored.updatedBy ?? null,
    encryptionKeyConfigured: encryptionKey(env) !== null,
    lastTest,
  };
}

export const smtpReady = async (payload: Payload, env?: Env) =>
  connectionFrom(await readStored(payload), env).state === "ready";

type Who = { email?: string | null } | null | undefined;

export type SaveResult =
  | { ok: true; status: SmtpStatus }
  | { ok: false; status: number; message: string; errors?: Record<string, string> };

/** Saves the connection. An empty password keeps the stored one. */
export async function saveSmtp(payload: Payload, input: Record<string, unknown>, user: Who, env?: Env): Promise<SaveResult> {
  const parsed = parseSmtpInput(input);
  if (!parsed.ok) return { ok: false, status: 400, message: "Check the highlighted fields.", errors: parsed.errors };
  const stored = await readStored(payload);
  const data: Record<string, unknown> = {
    host: parsed.fields.host,
    port: String(parsed.fields.port),
    security: parsed.fields.security,
    username: parsed.fields.username,
    updatedBy: user?.email ?? null,
  };
  if (parsed.password) {
    const key = encryptionKey(env);
    if (!key) return { ok: false, status: 503, message: summaries["no-key"] };
    data.passwordEncrypted = encryptSecret(parsed.password, PASSWORD_PURPOSE, key);
    data.passwordUpdatedAt = new Date().toISOString();
  } else if (!stored.passwordEncrypted) {
    return { ok: false, status: 400, message: "Enter the SMTP password.", errors: { password: "Enter the SMTP password." } };
  }
  // A different server or account invalidates the previous test result.
  const changed =
    Boolean(parsed.password) ||
    (["host", "port", "security", "username"] as const).some((name) => String(stored[name] ?? "") !== String(data[name]));
  if (changed) data.lastTest = { at: null, ok: null, message: null };
  await payload.updateGlobal({ slug: SMTP_GLOBAL, data, overrideAccess: true, depth: 0 });
  payload.logger.info({ msg: "SMTP settings saved in the CMS", by: user?.email ?? "unknown", passwordReplaced: Boolean(parsed.password) });
  return { ok: true, status: await smtpStatus(payload, env) };
}

/** Removes the whole connection, password included. */
export async function removeSmtp(payload: Payload, user: Who, env?: Env) {
  await payload.updateGlobal({
    slug: SMTP_GLOBAL,
    overrideAccess: true,
    depth: 0,
    data: {
      host: null,
      port: null,
      security: null,
      username: null,
      passwordEncrypted: null,
      passwordUpdatedAt: null,
      updatedBy: user?.email ?? null,
      lastTest: { at: null, ok: null, message: null },
    },
  });
  payload.logger.info({ msg: "SMTP settings removed in the CMS", by: user?.email ?? "unknown" });
  return smtpStatus(payload, env);
}

/**
 * Connects, negotiates TLS and signs in, without sending anything. Tests the
 * values in the form, so a change can be checked before it is saved; an
 * empty password means the stored one. The result is recorded when it
 * describes the saved connection.
 */
export async function testSmtp(payload: Payload, input: Record<string, unknown>, deps: MailDeps = {}) {
  const parsed = parseSmtpInput(input);
  if (!parsed.ok) return { ok: false, message: "Check the highlighted fields.", errors: parsed.errors };
  const stored = await readStored(payload);
  let password = parsed.password;
  if (!password) {
    const saved = connectionFrom(stored, deps.env);
    if (saved.state === "not-configured" || saved.state === "incomplete")
      return { ok: false, message: "Enter the SMTP password to test.", errors: { password: "Enter the SMTP password to test." } };
    if (saved.state !== "ready") return { ok: false, message: summaries[saved.state] };
    password = saved.connection!.password;
  }
  const connection: SmtpConnection = { ...parsed.fields, password };
  const resolved = await resolveSmtpHost(connection.host, deps.lookup);
  let result: { ok: boolean; message: string };
  if (!resolved.ok) result = { ok: false, message: resolved.message };
  else {
    const transport = (deps.createTransport ?? realTransport)(transportOptions(connection, resolved.address, heloName()));
    try {
      await transport.verify();
      result = {
        ok: true,
        message: `Connected to ${connection.host}:${connection.port}, secured the connection and signed in as ${connection.username}.`,
      };
    } catch (error) {
      result = { ok: false, message: describeSmtpError(error, connection) };
    } finally {
      transport.close();
    }
  }
  const isSaved =
    !parsed.password &&
    stored.host === connection.host &&
    Number(stored.port) === connection.port &&
    stored.security === connection.security &&
    stored.username === connection.username;
  if (isSaved)
    await payload.updateGlobal({
      slug: SMTP_GLOBAL,
      overrideAccess: true,
      depth: 0,
      data: { lastTest: { at: new Date().toISOString(), ok: result.ok, message: result.message.slice(0, 400) } },
    });
  return result;
}

/** The sender from the published Site settings, or the SMTP username when it is an address. */
async function sender(payload: Payload, username: string) {
  const settings = await payload.findGlobal({ slug: "site-settings", depth: 0, draft: false, overrideAccess: true });
  const e = settings._status === "published" ? (settings.enquiries ?? {}) : {};
  const address = e.senderEmail?.trim() || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username) ? username : "");
  return { address, name: headerSafe(e.senderName || "DeltaWave Technology") };
}

export type SendResult = { accepted: string[]; rejected: string[]; error?: string };

const addressOf = (value: unknown) =>
  typeof value === "string" ? value : ((value as { address?: string } | null)?.address ?? "");
const asList = (value: unknown) => (Array.isArray(value) ? value : value ? [value] : []).map(addressOf).filter(Boolean);

/** Payload's own sender placeholder; messages carrying it get the CMS sender. */
const PLACEHOLDER = { address: "no-reply@deltawave.tech", name: "DeltaWave Technology" };
const placeholderFrom = `"${PLACEHOLDER.name}" <${PLACEHOLDER.address}>`;

/** Sends through the CMS-configured server. Never throws; never logs contents. */
export async function sendMail(payload: Payload, message: SendEmailOptions, deps: MailDeps = {}): Promise<SendResult> {
  const recipients = asList(message.to);
  const fail = (error: string): SendResult => {
    payload.logger.warn({ msg: "Email not sent", reason: error.slice(0, 200) });
    return { accepted: [], rejected: recipients, error };
  };
  try {
    const { state, connection } = connectionFrom(await readStored(payload), deps.env);
    if (state !== "ready" || !connection) return fail(`SMTP is not ready: ${summaries[state]}`);
    const from =
      !message.from || message.from === placeholderFrom ? await sender(payload, connection.username) : message.from;
    if (!addressOf(from)) return fail("No sender address: set a sender email in Site settings → Email & enquiries.");
    const resolved = await resolveSmtpHost(connection.host, deps.lookup);
    if (!resolved.ok) return fail(resolved.message);
    const transport = (deps.createTransport ?? realTransport)(transportOptions(connection, resolved.address, heloName()));
    try {
      const info = await transport.sendMail({ ...(message as MailMessage), from: from as MailMessage["from"] });
      return { accepted: asList(info.accepted), rejected: asList(info.rejected) };
    } finally {
      transport.close();
    }
  } catch (error) {
    return fail(describeSmtpError(error));
  }
}

/** Payload's email adapter: every message Payload sends goes through sendMail. */
export const cmsEmailAdapter: EmailAdapter<SendResult> = ({ payload }) => ({
  name: "deltawave-cms-smtp",
  defaultFromAddress: PLACEHOLDER.address,
  defaultFromName: PLACEHOLDER.name,
  sendEmail: (message) => sendMail(payload, message),
});
