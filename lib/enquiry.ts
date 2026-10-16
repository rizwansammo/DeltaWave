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
  /** Random per form, so a retried request is stored once. */
  submissionId: string;
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
    submissionId: str("submissionId"),
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
  if (data.submissionId && !/^[A-Za-z0-9-]{16,64}$/.test(data.submissionId))
    errors.form = "Please reload the form and try again.";
  if (data.challenge.length > 2048)
    errors.form = "The security check could not be validated.";
  return { data: Object.keys(errors).length ? undefined : data, errors };
}
export type StoredEnquiry = { id: number | string; duplicate: boolean; notified: boolean };

export type EnquiryConfig = {
  turnstileSecret?: string;
  siteKey?: string;
  expectedUrl: string;
  production: boolean;
  /** Published service options; defaults to the approved list. */
  allowedServices?: string[];
  /** Administrators accept online enquiries (Site settings → Email & enquiries). */
  accepting?: boolean;
  /** The CMS SMTP server is configured, so the team can be notified. */
  mailReady?: boolean;
  /** Shown to visitors when online enquiries are unavailable. */
  contactEmail?: string;
  /** Saves the enquiry. Required: nothing is sent unless it was stored. */
  store?: (enquiry: Enquiry) => Promise<StoredEnquiry>;
  /** Emails the notification and records the outcome; true when accepted. */
  notify?: (id: number | string, enquiry: Enquiry) => Promise<boolean>;
};

/**
 * Online enquiries need the spam check, somewhere to store them and a
 * configured mail server, and an administrator must have switched them on.
 * An accepted enquiry is still saved if a particular email later fails.
 */
export function configured(c: EnquiryConfig) {
  return !!(c.turnstileSecret && c.siteKey && c.accepting && c.mailReady && c.store);
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
/**
 * The visitor's address. The site's own Nginx sets X-Real-IP and overwrites
 * any value a client sends; the application listens on localhost only, so no
 * other proxy can reach it. Client-supplied headers are never trusted.
 */
export const clientIp = (request: Request) =>
  request.headers.get("x-real-ip")?.trim() || "unknown";
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
  const contact = c.contactEmail ? ` Please email ${c.contactEmail}.` : "";
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
      message: "Online enquiries are being prepared." + contact,
    });
  const ip = clientIp(request);
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
  } catch {
    return response(503, {
      message: "The security check is unavailable right now. Please try again shortly." + contact,
    });
  }

  // 1. Store first: an enquiry is never lost because email failed.
  let stored: StoredEnquiry;
  try {
    stored = await c.store!(data);
  } catch {
    return response(503, {
      message: "Your enquiry could not be saved." + (contact || " Please try again later."),
    });
  }
  if (stored.duplicate)
    return response(200, {
      saved: true,
      duplicate: true,
      notified: stored.notified,
      message: "Thank you. We have already received this enquiry.",
    });

  // 2. Then notify, and say exactly what happened.
  let notified = false;
  try {
    notified = (await c.notify?.(stored.id, data)) ?? false;
  } catch {
    notified = false;
  }
  return response(200, {
    saved: true,
    notified,
    message: notified
      ? "Thank you. Your enquiry has been received and our team has been notified."
      : "Thank you. Your enquiry has been saved and our team will review it.",
  });
}
