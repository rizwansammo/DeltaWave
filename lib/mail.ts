import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import type { EmailAdapter } from "payload";

// One mail transport for the whole application: Payload's nodemailer adapter
// over authenticated SMTP, configured only from protected environment
// variables. Password resets and enquiry notifications both go through
// payload.sendEmail; credentials never live in the CMS.

type Env = Record<string, string | undefined>;

export type SmtpSettings = { host: string; port: number; secure: boolean; user: string; pass: string };

export function smtpSettings(env: Env = process.env): SmtpSettings | null {
  const host = env.SMTP_HOST?.trim();
  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const port = Number(env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  return { host, port, secure: env.SMTP_SECURE === "true" || port === 465, user, pass };
}

export const mailConfigured = (env: Env = process.env) => smtpSettings(env) !== null;

/** Domains the mail server is authorised to send for (MAIL_ALLOWED_SENDER_DOMAINS). */
export function allowedSenderDomains(env: Env = process.env): string[] {
  return (env.MAIL_ALLOWED_SENDER_DOMAINS || "deltawave.tech")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedSender(address: string | null | undefined, env: Env = process.env) {
  const domain = address?.split("@")[1]?.trim().toLowerCase();
  return Boolean(domain) && allowedSenderDomains(env).includes(domain!);
}

/** The sender for messages Payload itself sends, such as password resets. */
export function defaultSender(env: Env = process.env) {
  const smtp = smtpSettings(env);
  return {
    address: env.MAIL_FROM_ADDRESS?.trim() || smtp?.user || "",
    name: env.MAIL_FROM_NAME?.trim() || "DeltaWave Technology",
  };
}

/** Header values may not carry line breaks (header injection). */
export const headerSafe = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

/**
 * Production without SMTP: refuse to send and log one line without the
 * message, because messages carry reset tokens and personal data.
 */
const disabledAdapter: EmailAdapter = ({ payload }) => ({
  name: "disabled",
  defaultFromAddress: defaultSender().address || "no-reply@deltawave.tech",
  defaultFromName: defaultSender().name,
  sendEmail: async () => {
    payload.logger.warn("Email is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS); a message was not sent.");
    return { accepted: [], rejected: [], disabled: true };
  },
});

export function emailAdapter(env: Env = process.env) {
  const smtp = smtpSettings(env);
  // In development Payload's console adapter shows messages in the terminal.
  if (!smtp) return env.NODE_ENV === "production" ? disabledAdapter : undefined;
  const sender = defaultSender(env);
  return nodemailerAdapter({
    defaultFromAddress: sender.address,
    defaultFromName: sender.name,
    // Delivery is reported per message; a startup check would delay boot.
    skipVerify: true,
    transportOptions: {
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      requireTLS: !smtp.secure,
      auth: { user: smtp.user, pass: smtp.pass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    },
  });
}
