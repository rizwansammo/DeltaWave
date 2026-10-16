import test from "node:test";
import assert from "node:assert/strict";
import {
  validateEnquiry,
  handleEnquiry,
  checkRateLimit,
  clientIp,
} from "../lib/enquiry.ts";
import { notificationMessage, submissionKey } from "../lib/cms/enquiries.ts";
import { headerSafe } from "../lib/mail.ts";

const data = () => ({
  name: "Test Enquiry",
  email: "test@example.com",
  phone: "+8801821777620",
  company: "Example",
  service: "Software engineering & SaaS",
  description: "A demonstration request for a business application.",
  consent: true,
  website: "",
  challenge: "test-token",
  startedAt: Date.now() - 3000,
  submissionId: "0f1e2d3c-4b5a-4968-8776-655443322110",
});

/** Records what the route did, in order. */
function harness({ store, notify } = {}) {
  const calls = [];
  return {
    calls,
    config: {
      turnstileSecret: "TEST_ONLY_NOT_A_SECRET",
      siteKey: "TEST_ONLY",
      expectedUrl: "https://example.com",
      production: true,
      accepting: true,
      mailReady: true,
      contactEmail: "hello@example.com",
      store: async (enquiry) => {
        calls.push("store");
        return store ? store(enquiry) : { id: 7, duplicate: false, notified: false };
      },
      notify: async (id, enquiry) => {
        calls.push("notify");
        return notify ? notify(id, enquiry) : true;
      },
    },
  };
}

let index = 0;
const request = (body = data(), extra = {}) =>
  new Request("https://example.com/api/enquiry", {
    method: "POST",
    headers: {
      origin: "https://example.com",
      "content-type": "application/json",
      "x-real-ip": "203.0.113." + (index++ % 250),
      ...extra,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const never = async () => {
  throw new Error("Unexpected external network call");
};
const turnstileOk = async () =>
  Response.json({ success: true, hostname: "example.com", action: "enquiry" });

test("valid enquiry is normalized", () => {
  assert.ok(validateEnquiry(data()).data);
});
test("invalid fields and absent consent are rejected", () => {
  const r = validateEnquiry({
    ...data(),
    name: "a",
    email: "bad",
    phone: "12",
    description: "short",
    consent: false,
    service: "unlisted",
  });
  assert.equal(Object.keys(r.errors).length, 6);
});
test("honeypot content is rejected", () =>
  assert.ok(validateEnquiry({ ...data(), website: "spam" }).errors.form));
test("a malformed submission ID is rejected", () =>
  assert.ok(validateEnquiry({ ...data(), submissionId: "<script>" }).errors.form));

test("closed or unconfigured enquiries fail closed and store nothing", async () => {
  for (const change of [{ accepting: false }, { mailReady: false }, { turnstileSecret: undefined }, { siteKey: "" }]) {
    const { calls, config } = harness();
    const r = await handleEnquiry(request(), { ...config, ...change }, never);
    assert.equal(r.status, 503, JSON.stringify(change));
    assert.match((await r.json()).message, /hello@example\.com/);
    assert.deepEqual(calls, []);
  }
});
test("foreign origin is rejected before anything else", async () => {
  const { calls, config } = harness();
  const r = await handleEnquiry(request(data(), { origin: "https://attacker.example" }), config, never);
  assert.equal(r.status, 403);
  assert.deepEqual(calls, []);
});
test("missing origin is rejected", async () => {
  const r = request();
  r.headers.delete("origin");
  assert.equal((await handleEnquiry(r, harness().config, never)).status, 403);
});
test("incorrect content type rejected", async () =>
  assert.equal(
    (await handleEnquiry(request(data(), { "content-type": "text/plain" }), harness().config, never)).status,
    415,
  ));
test("malformed JSON is rejected", async () =>
  assert.equal((await handleEnquiry(request("{no"), harness().config, never)).status, 400));
test("oversized streamed body is rejected", async () =>
  assert.equal((await handleEnquiry(request("a".repeat(16001)), harness().config, never)).status, 413));
test("invalid payload returns field errors", async () => {
  const r = await handleEnquiry(request({ ...data(), email: "wrong" }), harness().config, never);
  assert.equal(r.status, 422);
  assert.ok((await r.json()).errors.email);
});
test("missing challenge cannot reach the spam check or storage", async () => {
  const { calls, config } = harness();
  assert.equal((await handleEnquiry(request({ ...data(), challenge: "" }), config, never)).status, 400);
  assert.deepEqual(calls, []);
});
test("too rapid submissions are rejected", async () =>
  assert.equal(
    (await handleEnquiry(request({ ...data(), startedAt: Date.now() }), harness().config, never)).status,
    400,
  ));
test("a challenge for another hostname or action is rejected and nothing is stored", async () => {
  for (const verdict of [
    { success: true, hostname: "other.example", action: "enquiry" },
    { success: true, hostname: "example.com", action: "login" },
    { success: false },
  ]) {
    const { calls, config } = harness();
    const r = await handleEnquiry(request(), config, async () => Response.json(verdict));
    assert.equal(r.status, 400);
    assert.deepEqual(calls, []);
  }
});
test("an unreachable spam check fails closed", async () => {
  const { calls, config } = harness();
  const r = await handleEnquiry(request(), config, async () => {
    throw new TypeError("fetch failed");
  });
  assert.equal(r.status, 503);
  assert.deepEqual(calls, []);
});

test("the enquiry is stored before anyone is notified", async () => {
  const { calls, config } = harness();
  const r = await handleEnquiry(request(), config, turnstileOk);
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.deepEqual(calls, ["store", "notify"]);
  assert.equal(body.saved, true);
  assert.equal(body.notified, true);
  assert.match(body.message, /notified/);
});
test("a saved enquiry whose email fails is reported as saved, never as sent", async () => {
  for (const notify of [async () => false, async () => { throw new Error("SMTP down"); }]) {
    const { calls, config } = harness({ notify });
    const r = await handleEnquiry(request(), config, turnstileOk);
    const body = await r.json();
    assert.equal(r.status, 200);
    assert.deepEqual(calls, ["store", "notify"]);
    assert.equal(body.notified, false);
    assert.match(body.message, /saved/);
    assert.doesNotMatch(body.message, /notified|email/i);
  }
});
test("if storing fails the visitor is not told it was saved, and nobody is emailed", async () => {
  const { calls, config } = harness({ store: async () => { throw new Error("database down"); } });
  const r = await handleEnquiry(request(), config, turnstileOk);
  assert.equal(r.status, 503);
  const body = await r.json();
  assert.deepEqual(calls, ["store"]);
  assert.equal(body.saved, undefined);
  assert.match(body.message, /could not be saved/);
});
test("a retried submission is not stored or emailed twice", async () => {
  const { calls, config } = harness({ store: async () => ({ id: 7, duplicate: true, notified: true }) });
  const r = await handleEnquiry(request(), config, turnstileOk);
  const body = await r.json();
  assert.equal(r.status, 200);
  assert.deepEqual(calls, ["store"]);
  assert.equal(body.duplicate, true);
});
test("submission keys: one per form, stable across retries", () => {
  const enquiry = validateEnquiry(data()).data;
  assert.equal(submissionKey(enquiry), submissionKey({ ...enquiry }));
  assert.notEqual(submissionKey(enquiry), submissionKey({ ...enquiry, submissionId: "a".repeat(32) }));
  const legacy = { ...enquiry, submissionId: "" };
  assert.equal(submissionKey(legacy), submissionKey({ ...legacy, email: "TEST@example.com" }));
  assert.match(submissionKey(enquiry), /^[a-f0-9]{64}$/, "only a hash is stored");
});

test("notifications escape the visitor's text and keep headers single-line", () => {
  const enquiry = {
    ...validateEnquiry(data()).data,
    name: "Evil\r\nBcc: victim@example.com",
    description: "<script>alert(1)</script> & more",
  };
  const message = notificationMessage(enquiry, { subjectPrefix: "Website enquiry" });
  assert.doesNotMatch(message.subject, /[\r\n]/);
  assert.match(message.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; more/);
  assert.doesNotMatch(message.html, /<script>/);
  assert.match(message.text, /Project description:\n<script>alert\(1\)<\/script> & more/);
  assert.equal(headerSafe("A\r\nB"), "A B");
});
test("the client address comes from the proxy, never from client-chosen headers", () => {
  const r = new Request("https://example.com/", {
    headers: { "cf-connecting-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" },
  });
  assert.equal(clientIp(r), "unknown");
  assert.equal(clientIp(new Request("https://example.com/", { headers: { "x-real-ip": "203.0.113.9" } })), "203.0.113.9");
});
test("rate limit denies excess attempts and resets", () => {
  const key = "unit-rate-test";
  for (let i = 0; i < 5; i++) assert.equal(checkRateLimit(key, 1000), true);
  assert.equal(checkRateLimit(key, 1000), false);
  assert.equal(checkRateLimit(key, 1000000), true);
});
