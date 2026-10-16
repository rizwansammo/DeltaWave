export type Enquiry = {
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  description: string;
  consent: boolean;
  website: string;
  challenge: string;
  startedAt: number;
};
/** The options the form offers when the CMS cannot be read. */
export const acceptedServices = [
  "Software engineering & SaaS",
  "Business & industry solutions",
  "Cloud infrastructure & managed IT",
  "Creative & digital growth",
  "Academy interest",
  "Other",
];
export function validateEnquiry(
  input: unknown,
  allowedServices: string[] = acceptedServices,
): {
  data?: Enquiry;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  if (!input || typeof input !== "object" || Array.isArray(input))
    return { errors: { form: "Please complete the enquiry form." } };
  const raw = input as Record<string, unknown>;
  const str = (k: string) =>
    typeof raw[k] === "string" ? (raw[k] as string).trim() : "";
  const data: Enquiry = {
    name: str("name"),
    email: str("email"),
    phone: str("phone"),
    company: str("company"),
    service: str("service"),
    description: str("description"),
    website: str("website"),
    challenge: str("challenge"),
    consent: raw.consent === true,
    startedAt: typeof raw.startedAt === "number" ? raw.startedAt : 0,
  };
  if (
    data.name.length < 2 ||
    data.name.length > 120 ||
    /[\r\n]/.test(data.name)
  )
    errors.name = "Please enter a name between 2 and 120 characters.";
  if (data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.email = "Please enter a valid email address.";
  if (
    !/^[+()\d .-]{7,30}$/.test(data.phone) ||
    data.phone.replace(/\D/g, "").length < 7
  )
    errors.phone = "Please enter a valid phone number.";
  if (data.company.length > 120)
    errors.company = "Please keep the organization name under 120 characters.";
  if (!allowedServices.includes(data.service))
    errors.service = "Please choose a listed service.";
  if (data.description.length < 20 || data.description.length > 5000)
    errors.description =
      "Please describe the project in 20 to 5000 characters.";
  if (!data.consent)
    errors.consent = "Please confirm that we may use your details to respond.";
  if (data.website) errors.form = "This enquiry could not be accepted.";
  if (
    !Number.isFinite(data.startedAt) ||
    data.startedAt <= 0 ||
    data.startedAt > Date.now() + 60000
  )
    errors.form = "Please reload the form and try again.";
  if (data.challenge.length > 2048)
    errors.form = "The security check could not be validated.";
  return { data: Object.keys(errors).length ? undefined : data, errors };
}
export type EnquiryConfig = {
  apiKey?: string;
  from?: string;
  to: string;
  turnstileSecret?: string;
  siteKey?: string;
  expectedUrl: string;
  production: boolean;
  /** Published service options; defaults to the approved list. */
  allowedServices?: string[];
};
export function configured(c: EnquiryConfig) {
  return !!(c.apiKey && c.from && c.turnstileSecret && c.siteKey);
}
const limits = new Map<string, { count: number; reset: number }>();
export function checkRateLimit(key: string, now = Date.now()) {
  for (const [k, v] of limits) if (v.reset <= now) limits.delete(k);
  const found = limits.get(key);
  if (found) {
    found.count++;
    return found.count <= 5;
  }
  if (limits.size >= 1000) return false;
  limits.set(key, { count: 1, reset: now + 15 * 60 * 1000 });
  return true;
}
const response = (status: number, body: Record<string, unknown>) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
export async function handleEnquiry(
  request: Request,
  c: EnquiryConfig,
  fetcher: typeof fetch = fetch,
) {
  const origin = request.headers.get("origin");
  let allowed = false;
  try {
    allowed =
      origin === new URL(c.expectedUrl).origin ||
      (!c.production && origin === new URL(request.url).origin);
  } catch {}
  if (!allowed)
    return response(403, {
      message: "Please submit this form from the DeltaWave website.",
    });
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    return response(415, { message: "Please use the enquiry form." });
  if (Number(request.headers.get("content-length") || 0) > 16000)
    return response(413, { message: "The enquiry is too large." });
  // Read with a hard limit even if the client omits Content-Length.
  let body = "";
  try {
    const reader = request.body?.getReader();
    if (!reader) return response(400, { message: "Please complete the form." });
    let length = 0;
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 16000) {
        await reader.cancel();
        return response(413, { message: "The enquiry is too large." });
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  } catch {
    return response(400, { message: "The enquiry could not be read." });
  }
  let input: unknown;
  try {
    input = JSON.parse(body);
  } catch {
    return response(400, { message: "The enquiry could not be read." });
  }
  const { data, errors } = validateEnquiry(input, c.allowedServices);
  if (!data)
    return response(422, {
      message: "Please check the highlighted fields.",
      errors,
    });
  if (!configured(c))
    return response(503, {
      message:
        "Online enquiries are being prepared. Please email rizwan@deltawave.tech.",
    });
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  if (!checkRateLimit(ip))
    return response(429, {
      message:
        "Too many attempts. Please wait 15 minutes or email us directly.",
    });
  if (
    Date.now() - data.startedAt < 2000 ||
    Date.now() - data.startedAt > 24 * 60 * 60 * 1000 ||
    !data.challenge
  )
    return response(400, {
      message: "Please complete the security check and try again.",
    });
  try {
    const verification = await fetcher(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: c.turnstileSecret!,
          response: data.challenge,
          ...(ip === "unknown" ? {} : { remoteip: ip }),
        }),
        signal: AbortSignal.timeout(10000),
      },
    );
    const verified = (await verification.json()) as {
      success?: boolean;
      hostname?: string;
      action?: string;
    };
    if (
      !verification.ok ||
      !verified.success ||
      verified.hostname !== new URL(c.expectedUrl).hostname ||
      verified.action !== "enquiry"
    )
      return response(400, {
        message:
          "The security check expired or could not be verified. Please try again.",
      });
    const result = await fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${c.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: c.from,
        to: [c.to],
        reply_to: data.email,
        subject: `Website enquiry: ${data.service}`,
        text: [
          `Name: ${data.name}`,
          `Email: ${data.email}`,
          `Phone: ${data.phone}`,
          `Organization: ${data.company || "Not supplied"}`,
          `Service: ${data.service}`,
          "",
          "Project description:",
          data.description,
          "",
          "Consent: Use these details to respond to this enquiry.",
        ].join("\n"),
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!result.ok)
      return response(502, {
        message:
          "The email service could not accept your enquiry. Please email us directly.",
      });
    const receipt = (await result.json()) as { id?: string };
    if (!receipt.id)
      return response(502, {
        message:
          "The email service did not confirm acceptance. Please contact us directly.",
      });
    return response(200, {
      message: "Your enquiry has been accepted by our email service.",
    });
  } catch {
    return response(502, {
      message:
        "We could not confirm that the enquiry was sent. Please email us directly.",
    });
  }
}
