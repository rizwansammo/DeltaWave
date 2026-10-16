import { lookup as dnsLookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import type { SmtpTransportOptions } from "nodemailer";

// Checks for the SMTP server an administrator enters in the CMS. The host is
// typed into a web form, so it must not become a way to reach the server's
// own network: only public addresses and the usual SMTP ports are accepted,
// the name is resolved once and the connection goes to that checked address
// (no second lookup that could answer differently), and the certificate is
// still verified against the name. Nothing here touches the database.

export type SmtpSecurity = "starttls" | "tls";
export const smtpSecurityModes: SmtpSecurity[] = ["starttls", "tls"];
/** Submission (587), implicit TLS (465), relay (25) and the common alternative (2525). */
export const allowedSmtpPorts = [587, 465, 25, 2525] as const;

export type SmtpFields = { host: string; port: number; security: SmtpSecurity; username: string };
export type SmtpConnection = SmtpFields & { password: string };

// Separate lists: Node also matches IPv4 addresses against IPv4-mapped IPv6
// rules, so one shared list with ::ffff:0:0/96 would block every IPv4 address.
const blocked4 = new BlockList();
const blocked6 = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8], // "this" network
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, cloud metadata
  ["172.16.0.0", 12], // private, Docker networks
  ["192.0.0.0", 24], // protocol assignments
  ["192.0.2.0", 24], // documentation
  ["192.88.99.0", 24], // 6to4 relay
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // documentation
  ["203.0.113.0", 24], // documentation
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved, broadcast
] as const)
  blocked4.addSubnet(network, prefix, "ipv4");
for (const [network, prefix] of [
  ["::", 128], // unspecified
  ["::1", 128], // loopback
  ["::ffff:0:0", 96], // IPv4-mapped
  ["64:ff9b::", 96], // NAT64
  ["100::", 64], // discard
  ["2001::", 23], // protocol assignments, Teredo
  ["2001:db8::", 32], // documentation
  ["2002::", 16], // 6to4
  ["fc00::", 7], // unique local
  ["fe80::", 10], // link-local
  ["ff00::", 8], // multicast
] as const)
  blocked6.addSubnet(network, prefix, "ipv6");

/** True for an address on the public internet. */
export function isPublicAddress(address: string) {
  const family = isIP(address);
  if (family === 0) return false;
  return family === 4 ? !blocked4.check(address, "ipv4") : !blocked6.check(address, "ipv6");
}

const label = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;
const internalSuffixes = [".local", ".localhost", ".internal", ".intranet", ".lan", ".home", ".home.arpa", ".localdomain", ".corp"];

/** A public host name such as mail.example.com, or a public IP address. */
export function hostProblem(host: string): string | null {
  if (!host) return "Enter the mail server's host name.";
  const literal = host.replace(/^\[|\]$/g, "");
  if (isIP(literal)) return isPublicAddress(literal) ? null : "This address is on a private, local or reserved network.";
  if (host.length > 253 || /[\s/:@?#\\[\]]/.test(host))
    return "Enter only the host name, for example mail.example.com (no protocol, port or path).";
  const labels = host.split(".");
  if (labels.length < 2 || !labels.every((part) => label.test(part)))
    return "Enter the full host name of the mail server, for example mail.example.com.";
  if (/^\d+$/.test(labels.at(-1)!) || internalSuffixes.some((suffix) => host.endsWith(suffix)))
    return "Internal or local host names cannot be used; enter the mail server's public host name.";
  return null;
}

const controlCharacters = /[\u0000-\u001f\u007f]/;

export type ParsedSmtp =
  | { ok: true; fields: SmtpFields; password: string }
  | { ok: false; errors: Partial<Record<keyof SmtpConnection, string>> };

/**
 * Validates what an administrator submitted. An empty password means
 * "keep the stored one"; it is returned as "".
 */
export function parseSmtpInput(input: Record<string, unknown> | null | undefined): ParsedSmtp {
  const errors: Partial<Record<keyof SmtpConnection, string>> = {};
  const host = typeof input?.host === "string" ? input.host.trim().toLowerCase().replace(/\.$/, "") : "";
  const hostError = hostProblem(host);
  if (hostError) errors.host = hostError;
  const port = Number(input?.port);
  if (!(allowedSmtpPorts as readonly number[]).includes(port))
    errors.port = `Use one of the SMTP ports: ${allowedSmtpPorts.join(", ")}.`;
  const security = input?.security as SmtpSecurity;
  if (!smtpSecurityModes.includes(security)) errors.security = "Choose STARTTLS or SSL/TLS.";
  const username = typeof input?.username === "string" ? input.username.trim() : "";
  if (!username) errors.username = "Enter the SMTP username (usually the mailbox address).";
  else if (username.length > 254 || controlCharacters.test(username)) errors.username = "This username is not valid.";
  const password = typeof input?.password === "string" ? input.password : "";
  if (password.length > 512 || /[\r\n\u0000]/.test(password)) errors.password = "This password is not valid.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, fields: { host, port, security, username }, password };
}

type Lookup = (host: string) => Promise<{ address: string; family: number }[]>;
const systemLookup: Lookup = (host) => dnsLookup(host, { all: true, verbatim: true });

export type ResolvedHost = { ok: true; address: string } | { ok: false; message: string };

/**
 * Resolves the host once. Every address it resolves to must be public,
 * otherwise a name could point part of its answers inside the network.
 */
export async function resolveSmtpHost(host: string, lookup: Lookup = systemLookup): Promise<ResolvedHost> {
  const problem = hostProblem(host);
  if (problem) return { ok: false, message: problem };
  const literal = host.replace(/^\[|\]$/g, "");
  if (isIP(literal)) return { ok: true, address: literal };
  let answers: { address: string; family: number }[];
  try {
    answers = await lookup(host);
  } catch {
    return { ok: false, message: `The host ${host} could not be found.` };
  }
  if (!answers.length) return { ok: false, message: `The host ${host} could not be found.` };
  if (!answers.every((answer) => isPublicAddress(answer.address)))
    return {
      ok: false,
      message: `${host} points to a private, local or reserved network address. Only public mail servers can be used.`,
    };
  // Containers usually have IPv4 only.
  return { ok: true, address: (answers.find((answer) => answer.family === 4) ?? answers[0]).address };
}

/** Options for one connection to the checked address. */
export function transportOptions(
  connection: SmtpConnection,
  address: string,
  heloName: string,
): SmtpTransportOptions {
  const literal = isIP(connection.host.replace(/^\[|\]$/g, "")) !== 0;
  return {
    host: address,
    port: connection.port,
    secure: connection.security === "tls",
    // STARTTLS is required, never optional: credentials are not sent in clear.
    requireTLS: connection.security === "starttls",
    ignoreTLS: false,
    name: heloName,
    auth: { user: connection.username, pass: connection.password },
    tls: {
      ...(literal ? {} : { servername: connection.host }),
      rejectUnauthorized: true,
      minVersion: "TLSv1.2",
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    // Messages are built here; they may not pull in files or URLs.
    disableFileAccess: true,
    disableUrlAccess: true,
    logger: false,
    debug: false,
  };
}

const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);

/** A plain-language reason for a failed connection or delivery. Never contains the password. */
export function describeSmtpError(error: unknown, connection?: Pick<SmtpFields, "host" | "port">) {
  const e = (error ?? {}) as { code?: string; message?: string; responseCode?: number; response?: string };
  const where = connection ? `${connection.host}:${connection.port}` : "the mail server";
  const detail = oneLine(e.response || e.message || "");
  const text = `${e.code ?? ""} ${e.message ?? ""}`.toLowerCase();
  if (e.code === "EAUTH" || e.responseCode === 535)
    return `The mail server rejected the username or password${detail ? ` (${detail})` : ""}.`;
  if (/certificate|self[- ]signed|altname|unable to verify|hostname\/ip does not match/.test(text))
    return `The mail server's TLS certificate is not valid for this host${detail ? ` (${detail})` : ""}.`;
  if (e.code === "ETLS" || /starttls|tls|ssl|wrong version number/.test(text))
    return `A secure connection to ${where} could not be established. Check the port and the SSL/TLS or STARTTLS setting${detail ? ` (${detail})` : ""}.`;
  if (/timed? ?out|etimedout/.test(text))
    return `${where} did not answer in time. Check the host, the port and that the server accepts connections.`;
  if (/econnrefused/.test(text)) return `${where} refused the connection. Check the host and the port.`;
  if (e.code === "EDNS" || /enotfound|eai_again/.test(text)) return `The host could not be found.`;
  if (e.code === "EENVELOPE")
    return `The mail server refused the sender or a receiver${detail ? ` (${detail})` : ""}. The SMTP account may not be allowed to send as the sender address.`;
  return `The mail server reported an error${detail ? `: ${detail}` : "."}`;
}
