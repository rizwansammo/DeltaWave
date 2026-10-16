import test from "node:test";
import assert from "node:assert/strict";
import { decryptSecret, encryptionKey, encryptSecret, keyFingerprint } from "../lib/secrets.ts";
import {
  describeSmtpError,
  hostProblem,
  isPublicAddress,
  parseSmtpInput,
  resolveSmtpHost,
  transportOptions,
} from "../lib/smtp.ts";
import { cmsEmailAdapter, removeSmtp, saveSmtp, sendMail, smtpReady, smtpStatus, testSmtp } from "../lib/mail.ts";
import { smtpEndpoints } from "../cms/globals/smtp-endpoints.ts";
import { SmtpSettings } from "../cms/globals/SmtpSettings.ts";
import { enquiryPrerequisites, privacyNoticeReady } from "../lib/cms/enquiry-readiness.ts";

const KEY_HEX = "11".repeat(32);
const OTHER_KEY_HEX = "22".repeat(32);
const env = { CREDENTIALS_ENCRYPTION_KEY: KEY_HEX };
const PASSWORD = "Correct-Horse-Battery-Staple-9";
const valid = { host: "mail.example.com", port: 587, security: "starttls", username: "website@example.com", password: PASSWORD };
const publicLookup = async () => [{ address: "93.184.215.14", family: 4 }];

/** A Payload stand-in holding the SMTP global and published Site settings. */
function fakePayload({ smtp = {}, enquiries = { senderName: "DeltaWave Website", senderEmail: "website@example.com", recipient: "team@example.com" }, published = true } = {}) {
  const state = { smtp: { ...smtp }, logs: [] };
  return {
    state,
    findGlobal: async ({ slug }) =>
      slug === "smtp-settings"
        ? structuredClone(state.smtp)
        : { _status: published ? "published" : "draft", enquiries },
    updateGlobal: async ({ slug, data }) => {
      assert.equal(slug, "smtp-settings");
      state.smtp = { ...state.smtp, ...structuredClone(data), updatedAt: new Date().toISOString() };
      return state.smtp;
    },
    logger: {
      info: (entry) => state.logs.push(entry),
      warn: (entry) => state.logs.push(entry),
      error: (entry) => state.logs.push(entry),
    },
  };
}

/** A transport stand-in recording what it was asked to do. */
function fakeTransport({ verify, send } = {}) {
  const seen = { options: [], messages: [], closed: 0 };
  return {
    seen,
    createTransport: (options) => {
      seen.options.push(options);
      return {
        verify: async () => (verify ? verify() : true),
        sendMail: async (message) => {
          seen.messages.push(message);
          return send ? send(message) : { accepted: [].concat(message.to).map(String), rejected: [] };
        },
        close: () => seen.closed++,
      };
    },
  };
}

const ready = async (payload) => {
  const saved = await saveSmtp(payload, valid, { email: "admin@example.com" }, env);
  assert.equal(saved.ok, true);
};

// Encryption at rest

test("SMTP passwords are encrypted with AES-256-GCM, a fresh IV each time and no trace of the plaintext", () => {
  const key = encryptionKey(env);
  const a = encryptSecret(PASSWORD, "deltawave:smtp-password", key);
  const b = encryptSecret(PASSWORD, "deltawave:smtp-password", key);
  assert.notEqual(a, b);
  for (const stored of [a, b]) {
    assert.match(stored, /^v1:[0-9a-f]{12}:[\w-]+:[\w-]+:[\w-]+$/);
    assert.ok(!stored.includes(PASSWORD));
    assert.ok(!stored.includes(Buffer.from(PASSWORD).toString("base64").slice(0, 12)));
    assert.deepEqual(decryptSecret(stored, "deltawave:smtp-password", key), { ok: true, value: PASSWORD });
  }
});

test("a value cannot be read with another key, for another purpose, or after tampering", () => {
  const key = encryptionKey(env);
  const stored = encryptSecret(PASSWORD, "deltawave:smtp-password", key);
  assert.deepEqual(decryptSecret(stored, "deltawave:smtp-password", encryptionKey({ CREDENTIALS_ENCRYPTION_KEY: OTHER_KEY_HEX })), { ok: false, reason: "other-key" });
  assert.deepEqual(decryptSecret(stored, "deltawave:other", key), { ok: false, reason: "corrupt" });
  const parts = stored.split(":");
  parts[4] = (parts[4][0] === "A" ? "B" : "A") + parts[4].slice(1);
  assert.deepEqual(decryptSecret(parts.join(":"), "deltawave:smtp-password", key), { ok: false, reason: "corrupt" });
  assert.deepEqual(decryptSecret("plain-text", "deltawave:smtp-password", key), { ok: false, reason: "malformed" });
});

test("the master key must be exactly 32 bytes, given as hex or base64", () => {
  assert.equal(encryptionKey({ CREDENTIALS_ENCRYPTION_KEY: KEY_HEX }).length, 32);
  assert.equal(encryptionKey({ CREDENTIALS_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64") }).length, 32);
  assert.equal(encryptionKey({ CREDENTIALS_ENCRYPTION_KEY: "short" }), null);
  assert.equal(encryptionKey({ CREDENTIALS_ENCRYPTION_KEY: "ab".repeat(16) }), null);
  assert.equal(encryptionKey({}), null);
  assert.match(keyFingerprint(encryptionKey(env)), /^[0-9a-f]{12}$/);
});

// The configurable host must not reach the server's own network

test("internal, local and reserved hosts are refused before any connection", () => {
  for (const host of [
    "localhost", "db", "app", "127.0.0.1", "127.1", "2130706433", "0x7f000001", "0.0.0.0", "10.0.0.5",
    "100.64.1.1", "169.254.169.254", "172.17.0.1", "172.31.255.255", "192.168.1.10", "198.18.0.1",
    "224.0.0.1", "[::1]", "::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1", "fd00::25", "fe80::1",
    "mail.internal", "smtp.local", "mx.home.arpa", "printer.lan",
    "smtp://mail.example.com", "mail.example.com:587", "user@mail.example.com", "mail example.com",
    "mail.example.com/path", "-bad.example.com",
  ])
    assert.notEqual(hostProblem(host), null, host);
  for (const host of ["mail.example.com", "smtp.gmail.com", "mx.matemail.pro", "93.184.215.14", "2606:4700:4700::1111"])
    assert.equal(hostProblem(host), null, host);
  assert.equal(isPublicAddress("8.8.8.8"), true);
  assert.equal(isPublicAddress("172.20.0.3"), false);
});

test("only SMTP ports and the two TLS modes are accepted", () => {
  for (const port of [22, 80, 443, 3000, 3077, 5432, 6379, 0, "587x"])
    assert.ok(parseSmtpInput({ ...valid, port }).errors?.port, String(port));
  for (const port of [25, 465, 587, 2525]) assert.equal(parseSmtpInput({ ...valid, port }).ok, true);
  assert.ok(parseSmtpInput({ ...valid, security: "none" }).errors?.security);
  assert.ok(parseSmtpInput({ ...valid, username: "" }).errors?.username);
  assert.ok(parseSmtpInput({ ...valid, username: "a\r\nb" }).errors?.username);
  assert.ok(parseSmtpInput({ ...valid, password: "x\r\nRCPT TO:<a@b>" }).errors?.password);
  const parsed = parseSmtpInput({ ...valid, host: " Mail.Example.COM. " });
  assert.equal(parsed.fields.host, "mail.example.com");
});

test("a name is resolved once and every answer must be public; the connection uses that address", async () => {
  assert.deepEqual(await resolveSmtpHost("mail.example.com", publicLookup), { ok: true, address: "93.184.215.14" });
  const mixed = async () => [{ address: "93.184.215.14", family: 4 }, { address: "10.1.2.3", family: 4 }];
  assert.equal((await resolveSmtpHost("mail.example.com", mixed)).ok, false);
  const inside = async () => [{ address: "172.18.0.2", family: 4 }];
  const refused = await resolveSmtpHost("rebind.example.com", inside);
  assert.equal(refused.ok, false);
  assert.match(refused.message, /private, local or reserved/);
  assert.ok(!refused.message.includes("172.18"), "the internal address is not revealed");
  const missing = async () => {
    throw Object.assign(new Error("getaddrinfo ENOTFOUND"), { code: "ENOTFOUND" });
  };
  assert.equal((await resolveSmtpHost("nope.example.com", missing)).ok, false);
  const ipv6First = async () => [{ address: "2606:4700::1", family: 6 }, { address: "93.184.215.14", family: 4 }];
  assert.equal((await resolveSmtpHost("mail.example.com", ipv6First)).address, "93.184.215.14");
});

test("connections require TLS, verify the certificate against the host name and cannot read files or URLs", () => {
  const starttls = transportOptions(valid, "93.184.215.14", "www.deltawave.tech");
  assert.equal(starttls.host, "93.184.215.14");
  assert.equal(starttls.secure, false);
  assert.equal(starttls.requireTLS, true);
  assert.equal(starttls.ignoreTLS, false);
  assert.deepEqual(starttls.tls, { servername: "mail.example.com", rejectUnauthorized: true, minVersion: "TLSv1.2" });
  assert.equal(starttls.disableFileAccess, true);
  assert.equal(starttls.disableUrlAccess, true);
  assert.equal(starttls.name, "www.deltawave.tech");
  assert.deepEqual(starttls.auth, { user: valid.username, pass: PASSWORD });
  const tls = transportOptions({ ...valid, security: "tls", port: 465 }, "93.184.215.14", "www.deltawave.tech");
  assert.equal(tls.secure, true);
  assert.equal(tls.requireTLS, false);
});

test("connection errors become plain-language reasons", () => {
  assert.match(describeSmtpError({ code: "EAUTH", response: "535 5.7.8 Authentication failed" }), /rejected the username or password/);
  assert.match(describeSmtpError({ code: "ESOCKET", message: "Hostname/IP does not match certificate's altnames" }), /certificate/);
  assert.match(describeSmtpError({ code: "ETIMEDOUT", message: "Connection timeout" }, { host: "mail.example.com", port: 587 }), /did not answer in time/);
  assert.match(describeSmtpError({ code: "ESOCKET", message: "connect ECONNREFUSED 93.184.215.14:587" }), /refused the connection/);
  assert.match(describeSmtpError({ code: "ETLS", message: "Error upgrading connection with STARTTLS" }), /secure connection/);
  assert.doesNotMatch(describeSmtpError({ code: "EAUTH", response: "535\r\nInjected" }), /[\r\n]/);
});

// Write-only password, masked status

test("saving stores only ciphertext and the status never contains the password or its ciphertext", async () => {
  const payload = fakePayload();
  const saved = await saveSmtp(payload, valid, { email: "admin@example.com" }, env);
  assert.equal(saved.ok, true);
  const stored = payload.state.smtp.passwordEncrypted;
  assert.match(stored, /^v1:/);
  assert.ok(!JSON.stringify(payload.state.smtp).includes(PASSWORD));
  const status = await smtpStatus(payload, env);
  const visible = JSON.stringify(status);
  assert.equal(status.state, "ready");
  assert.equal(status.passwordSet, true);
  assert.ok(!visible.includes(PASSWORD));
  assert.ok(!visible.includes(stored));
  assert.ok(!("password" in status) && !("passwordEncrypted" in status));
  assert.equal(status.updatedBy, "admin@example.com");
  assert.ok(!JSON.stringify(payload.state.logs).includes(PASSWORD), "logs never contain the password");
});

test("an empty password keeps the stored one; a new one replaces it; remove deletes everything", async () => {
  const payload = fakePayload();
  await ready(payload);
  const first = payload.state.smtp.passwordEncrypted;
  const kept = await saveSmtp(payload, { ...valid, password: "", port: 465, security: "tls" }, null, env);
  assert.equal(kept.ok, true);
  assert.equal(payload.state.smtp.passwordEncrypted, first);
  assert.equal(payload.state.smtp.host, valid.host);
  assert.equal(payload.state.smtp.port, "465");

  const blocked = await saveSmtp(payload, { ...valid, password: "", host: "smtp.example.org" }, null, env);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.status, 400);
  assert.equal(payload.state.smtp.host, valid.host, "server must not change without new credentials");
  await saveSmtp(payload, { ...valid, password: "A-New-Password-123" }, null, env);
  assert.notEqual(payload.state.smtp.passwordEncrypted, first);
  const status = await removeSmtp(payload, null, env);
  assert.equal(status.state, "not-configured");
  assert.equal(payload.state.smtp.passwordEncrypted, null);
  assert.equal(payload.state.smtp.host, null);
});

test("nothing is stored without the master key, a first password, or a valid host", async () => {
  const noKey = fakePayload();
  const refused = await saveSmtp(noKey, valid, null, {});
  assert.equal(refused.ok, false);
  assert.equal(refused.status, 503);
  assert.deepEqual(noKey.state.smtp, {});
  const noPassword = await saveSmtp(fakePayload(), { ...valid, password: "" }, null, env);
  assert.equal(noPassword.status, 400);
  const internal = fakePayload();
  const blocked = await saveSmtp(internal, { ...valid, host: "10.0.0.8" }, null, env);
  assert.equal(blocked.status, 400);
  assert.ok(blocked.errors.host);
  assert.deepEqual(internal.state.smtp, {});
});

test("the status explains incomplete settings, a missing key and a password from another key", async () => {
  assert.equal((await smtpStatus(fakePayload(), env)).state, "not-configured");
  assert.equal((await smtpStatus(fakePayload({ smtp: { host: "mail.example.com" } }), env)).state, "incomplete");
  const payload = fakePayload();
  await ready(payload);
  assert.equal((await smtpStatus(payload, {})).state, "no-key");
  assert.equal((await smtpStatus(payload, { CREDENTIALS_ENCRYPTION_KEY: OTHER_KEY_HEX })).state, "key-mismatch");
  assert.equal(await smtpReady(payload, env), true);
  assert.equal(await smtpReady(payload, { CREDENTIALS_ENCRYPTION_KEY: OTHER_KEY_HEX }), false);
});

// Connection test

test("Test connection signs in with the form values (stored password when empty) and records saved results", async () => {
  const payload = fakePayload();
  await ready(payload);
  const transport = fakeTransport();
  const ok = await testSmtp(payload, { ...valid, password: "" }, { ...transport, lookup: publicLookup, env });
  assert.equal(ok.ok, true);
  assert.equal(transport.seen.options[0].auth.pass, PASSWORD);
  assert.equal(transport.seen.options[0].host, "93.184.215.14");
  assert.equal(transport.seen.messages.length, 0, "nothing is sent");
  assert.equal(transport.seen.closed, 1);
  assert.equal(payload.state.smtp.lastTest.ok, true);

  const failing = fakeTransport({ verify: () => Promise.reject(Object.assign(new Error("Invalid login"), { code: "EAUTH" })) });
  const bad = await testSmtp(payload, { ...valid, password: "wrong-password-x" }, { ...failing, lookup: publicLookup, env });
  assert.equal(bad.ok, false);
  assert.match(bad.message, /username or password/);
  assert.ok(!bad.message.includes("wrong-password-x"));
  assert.equal(payload.state.smtp.lastTest.ok, true, "an unsaved password's test does not overwrite the saved result");
});

test("changing SMTP host or username never reuses the saved password", async () => {
  const payload = fakePayload();
  await ready(payload);
  const transport = fakeTransport();
  const deps = { ...transport, lookup: publicLookup, env };

  const hostTest = await testSmtp(payload, { ...valid, host: "different.example.com", password: "" }, deps);
  assert.equal(hostTest.ok, false);
  assert.ok(hostTest.errors.password);
  const userTest = await testSmtp(payload, { ...valid, username: "new@example.com", password: "" }, deps);
  assert.equal(userTest.ok, false);
  assert.ok(userTest.errors.password);
  assert.equal(transport.seen.options.length, 0, "must not attempt a connection with another account's password");

  const usernameSave = await saveSmtp(payload, { ...valid, username: "new@example.com", password: "" }, null, env);
  assert.equal(usernameSave.status, 400);
  assert.equal(payload.state.smtp.username, valid.username);
});

test("Test connection never connects to a blocked host", async () => {
  const payload = fakePayload();
  const transport = fakeTransport();
  const inside = async () => [{ address: "127.0.0.1", family: 4 }];
  const result = await testSmtp(payload, { ...valid, host: "evil.example.com" }, { ...transport, lookup: inside, env });
  assert.equal(result.ok, false);
  assert.equal(transport.seen.options.length, 0);
  const literal = await testSmtp(payload, { ...valid, host: "169.254.169.254" }, { ...transport, lookup: publicLookup, env });
  assert.equal(literal.ok, false);
  assert.equal(transport.seen.options.length, 0);
});

// Sending

test("without a complete CMS configuration nothing is sent and the reason is returned, never thrown", async () => {
  const transport = fakeTransport();
  const result = await sendMail(fakePayload(), { to: "someone@example.com", subject: "Secret reset link", html: "token-123" }, { ...transport, env });
  assert.deepEqual(result.accepted, []);
  assert.match(result.error, /not ready/i);
  assert.equal(transport.seen.options.length, 0);
});

test("messages use the CMS sender, Payload's placeholder sender is replaced, and failures are returned", async () => {
  const payload = fakePayload();
  await ready(payload);
  const transport = fakeTransport();
  const deps = { ...transport, lookup: publicLookup, env };
  const reset = await sendMail(
    payload,
    { from: '"DeltaWave Technology" <no-reply@deltawave.tech>', to: "user@example.com", subject: "Reset your password", html: "reset-token-abc" },
    deps,
  );
  assert.deepEqual(reset.accepted, ["user@example.com"]);
  assert.deepEqual(transport.seen.messages[0].from, { address: "website@example.com", name: "DeltaWave Website" });
  await sendMail(payload, { from: { address: "other@example.com", name: "X" }, to: "a@example.com", subject: "s", text: "t" }, deps);
  assert.deepEqual(transport.seen.messages[1].from, { address: "other@example.com", name: "X" });

  const broken = fakeTransport({ send: () => Promise.reject(Object.assign(new Error("Message rejected"), { code: "EENVELOPE" })) });
  const failed = await sendMail(payload, { to: "user@example.com", subject: "Reset", html: "reset-token-abc" }, { ...broken, lookup: publicLookup, env });
  assert.deepEqual(failed.accepted, []);
  assert.match(failed.error, /refused the sender or a receiver/);
  assert.ok(!JSON.stringify(payload.state.logs).includes("reset-token-abc"), "message contents are never logged");
  assert.ok(!JSON.stringify(payload.state.logs).includes("user@example.com"), "recipients are never logged");
});

test("the SMTP username is the sender when no sender email is published", async () => {
  const payload = fakePayload({ enquiries: {}, published: false });
  await ready(payload);
  const transport = fakeTransport();
  await sendMail(payload, { to: "a@example.com", subject: "s", text: "t" }, { ...transport, lookup: publicLookup, env });
  assert.equal(transport.seen.messages[0].from.address, "website@example.com");
});

test("Payload's email adapter routes through the CMS configuration", () => {
  const adapter = cmsEmailAdapter({ payload: fakePayload() });
  assert.equal(adapter.name, "deltawave-cms-smtp");
  assert.equal(adapter.defaultFromAddress, "no-reply@deltawave.tech");
  assert.equal(typeof adapter.sendEmail, "function");
});

// Endpoints: administrators only

const people = {
  admin: { id: 1, email: "admin@example.com", roles: ["admin"] },
  editor: { id: 2, email: "editor@example.com", roles: ["editor"] },
  visitor: null,
};
const endpoint = (path, method) => smtpEndpoints({ env, lookup: publicLookup, ...fakeTransport() }).find((e) => e.path === path && e.method === method);
const call = async (path, method, user, payload, body = {}) => {
  const response = await endpoint(path, method).handler({ user, payload, json: async () => body });
  return { status: response.status, body: await response.json(), headers: response.headers };
};

test("editors and visitors cannot read, change, test or use the SMTP settings", async () => {
  const payload = fakePayload();
  await ready(payload);
  for (const who of ["editor", "visitor"]) {
    for (const [path, method, body] of [
      ["/smtp", "get"],
      ["/smtp", "post", { ...valid, host: "attacker.example.com" }],
      ["/smtp", "post", { action: "remove" }],
      ["/smtp/test", "post", valid],
      ["/test-email", "post", { to: "receiver" }],
    ]) {
      const r = await call(path, method, people[who], payload, body);
      assert.equal(r.status, 403, `${who} ${method} ${path}`);
    }
  }
  assert.equal(payload.state.smtp.host, "mail.example.com", "nothing was changed");
});

test("administrators see a masked status, save, and send tests only to known addresses", async () => {
  const payload = fakePayload();
  const saved = await call("/smtp", "post", people.admin, payload, valid);
  assert.equal(saved.status, 200);
  assert.equal(saved.headers.get("cache-control"), "no-store");
  const status = await call("/smtp", "get", people.admin, payload);
  assert.equal(status.body.passwordSet, true);
  assert.ok(!JSON.stringify(status.body).includes(PASSWORD));
  assert.ok(!JSON.stringify(saved.body).includes(PASSWORD));

  const transport = fakeTransport();
  const send = smtpEndpoints({ env, lookup: publicLookup, ...transport }).find((e) => e.path === "/test-email");
  const r = await send.handler({ user: people.admin, payload, json: async () => ({ to: "attacker@example.net" }) });
  assert.equal(r.status, 200);
  assert.deepEqual(transport.seen.messages[0].to, "admin@example.com", "an address in the request is ignored");
  const again = await send.handler({ user: people.admin, payload, json: async () => ({ to: "me" }) });
  assert.equal(again.status, 429, "one test email a minute");
});

test("connection tests are throttled per administrator", async () => {
  const payload = fakePayload();
  await ready(payload);
  const test = smtpEndpoints({ env, lookup: publicLookup, ...fakeTransport() }).find((e) => e.path === "/smtp/test");
  const admin = { ...people.admin, id: 99 };
  const statuses = [];
  for (let i = 0; i < 7; i++) statuses.push((await test.handler({ user: admin, payload, json: async () => valid })).status);
  assert.deepEqual(statuses, [200, 200, 200, 200, 200, 200, 429]);
});

test("the SMTP store is closed to the API for everyone, has no versions and hides the ciphertext", () => {
  const admin = { req: { user: people.admin } };
  for (const rule of ["read", "update", "readVersions"]) assert.equal(SmtpSettings.access[rule](admin), false, rule);
  assert.equal(SmtpSettings.graphQL, false);
  assert.equal(SmtpSettings.admin.hidden, true);
  assert.equal(SmtpSettings.versions, undefined);
  const secret = SmtpSettings.fields.find((f) => f.name === "passwordEncrypted");
  for (const rule of ["read", "create", "update"]) assert.equal(secret.access[rule](admin), false, rule);
  assert.ok(!SmtpSettings.fields.some((f) => f.name === "password"), "no plaintext password field");
});

// Enquiries stay closed until everything is in place

function pagesPayload(privacy) {
  const payload = fakePayload();
  payload.find = async () => ({ docs: privacy ? [privacy] : [] });
  return payload;
}

test("online enquiries need SMTP, Turnstile and a final privacy notice", async () => {
  const draftNotice = { _status: "published", content: { text: "How enquiries are stored ... [retention period to be confirmed ...]" } };
  const finalNotice = { _status: "published", content: { text: "How enquiries are stored ... kept for 24 months" } };
  assert.equal(await privacyNoticeReady(pagesPayload(null)), false);
  assert.equal(await privacyNoticeReady(pagesPayload(draftNotice)), false);
  assert.equal(await privacyNoticeReady(pagesPayload({ _status: "published", content: { text: "Old notice" } })), false);
  assert.equal(await privacyNoticeReady(pagesPayload(finalNotice)), true);

  const none = await enquiryPrerequisites(pagesPayload(draftNotice), env);
  assert.equal(none.length, 3);
  const payload = pagesPayload(finalNotice);
  await ready(payload);
  const turnstile = { ...env, TURNSTILE_SITE_KEY: "site", TURNSTILE_SECRET_KEY: "secret" };
  assert.deepEqual(await enquiryPrerequisites(payload, turnstile), []);
  assert.equal((await enquiryPrerequisites(payload, env)).length, 1);
});
