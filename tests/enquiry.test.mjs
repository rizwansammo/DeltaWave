import test from "node:test";
import assert from "node:assert/strict";
import {
  validateEnquiry,
  handleEnquiry,
  checkRateLimit,
} from "../lib/enquiry.ts";
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
});
const config = {
  apiKey: "TEST_ONLY_NOT_A_KEY",
  from: "website@example.com",
  to: "test@example.com",
  turnstileSecret: "TEST_ONLY_NOT_A_SECRET",
  siteKey: "TEST_ONLY",
  expectedUrl: "https://example.com",
  production: true,
};
let index = 0;
const request = (body = data(), extra = {}) =>
  new Request("https://example.com/api/enquiry", {
    method: "POST",
    headers: {
      origin: "https://example.com",
      "content-type": "application/json",
      "cf-connecting-ip": "test-" + index++,
      ...extra,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const never = async () => {
  throw new Error("Unexpected external network call");
};
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
test("unconfigured endpoint fails closed without sending", async () => {
  const r = await handleEnquiry(
    request(),
    { ...config, apiKey: undefined },
    never,
  );
  assert.equal(r.status, 503);
});
test("foreign origin is rejected before sending", async () =>
  assert.equal(
    (
      await handleEnquiry(
        request(data(), { origin: "https://attacker.example" }),
        config,
        never,
      )
    ).status,
    403,
  ));
test("missing origin is rejected", async () => {
  const r = request();
  r.headers.delete("origin");
  assert.equal((await handleEnquiry(r, config, never)).status, 403);
});
test("incorrect content type rejected", async () =>
  assert.equal(
    (
      await handleEnquiry(
        request(data(), { "content-type": "text/plain" }),
        config,
        never,
      )
    ).status,
    415,
  ));
test("malformed JSON is rejected", async () =>
  assert.equal(
    (await handleEnquiry(request("{no"), config, never)).status,
    400,
  ));
test("oversized streamed body is rejected", async () =>
  assert.equal(
    (await handleEnquiry(request("a".repeat(16001)), config, never)).status,
    413,
  ));
test("invalid payload returns field errors", async () => {
  const r = await handleEnquiry(
    request({ ...data(), email: "wrong" }),
    config,
    never,
  );
  assert.equal(r.status, 422);
  assert.ok((await r.json()).errors.email);
});
test("missing challenge cannot reach provider", async () =>
  assert.equal(
    (await handleEnquiry(request({ ...data(), challenge: "" }), config, never))
      .status,
    400,
  ));
test("too rapid submissions are rejected", async () =>
  assert.equal(
    (
      await handleEnquiry(
        request({ ...data(), startedAt: Date.now() }),
        config,
        never,
      )
    ).status,
    400,
  ));
test("challenge from another hostname is rejected", async () => {
  const fake = async () =>
    Response.json({
      success: true,
      hostname: "other.example",
      action: "enquiry",
    });
  assert.equal((await handleEnquiry(request(), config, fake)).status, 400);
});
test("challenge from another action is rejected", async () => {
  const fake = async () =>
    Response.json({ success: true, hostname: "example.com", action: "login" });
  assert.equal((await handleEnquiry(request(), config, fake)).status, 400);
});
test("provider failure never reports success", async () => {
  let calls = 0;
  const fake = async () =>
    ++calls === 1
      ? Response.json({
          success: true,
          hostname: "example.com",
          action: "enquiry",
        })
      : Response.json({ error: "unavailable" }, { status: 500 });
  assert.equal((await handleEnquiry(request(), config, fake)).status, 502);
});
test("provider acceptance requires an actual receipt", async () => {
  let calls = 0;
  const fake = async () =>
    ++calls === 1
      ? Response.json({
          success: true,
          hostname: "example.com",
          action: "enquiry",
        })
      : Response.json({});
  assert.equal((await handleEnquiry(request(), config, fake)).status, 502);
});
test("confirmed acceptance uses fixed recipient and plain text", async () => {
  let calls = 0;
  const fake = async (url, options) => {
    if (++calls === 1)
      return Response.json({
        success: true,
        hostname: "example.com",
        action: "enquiry",
      });
    const body = JSON.parse(options.body);
    assert.deepEqual(body.to, ["test@example.com"]);
    assert.equal(body.reply_to, "test@example.com");
    assert.ok(body.text.includes("Project description:"));
    assert.equal(body.html, undefined);
    return Response.json({ id: "mock-receipt" });
  };
  assert.equal((await handleEnquiry(request(), config, fake)).status, 200);
  assert.equal(calls, 2);
});
test("rate limit denies excess attempts and resets", () => {
  const key = "unit-rate-test";
  for (let i = 0; i < 5; i++) assert.equal(checkRateLimit(key, 1000), true);
  assert.equal(checkRateLimit(key, 1000), false);
  assert.equal(checkRateLimit(key, 1000000), true);
});
