import type { Endpoint, PayloadRequest } from "payload";
import { isAdmin } from "../access";
import { removeSmtp, saveSmtp, sendMail, smtpStatus, testSmtp, type MailDeps } from "../../lib/mail";

// Administrator-only endpoints behind the "SMTP server" panel, mounted on the
// Site settings global (/cms-api/globals/site-settings/...):
//   GET  /smtp       the masked status (never the password)
//   POST /smtp       save, or { action: "remove" } to delete the connection
//   POST /smtp/test  connect, secure and sign in without sending
//   POST /test-email one fixed message to the administrator or the receiver
// Payload only signs a cookie session in when the request comes from this
// site (csrf in payload.config.ts), so other sites cannot call these.

const forbidden = () => Response.json({ message: "Administrators only." }, { status: 403 });
const noStore = { "Cache-Control": "no-store" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: noStore });

async function body(req: PayloadRequest): Promise<Record<string, unknown>> {
  try {
    const data = await req.json?.();
    return data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** At most `limit` uses per `windowMs` for each administrator, and one at a time. */
function throttle(limit: number, windowMs: number) {
  const uses = new Map<string, number[]>();
  return (key: string, now = Date.now()) => {
    const recent = (uses.get(key) ?? []).filter((at) => now - at < windowMs);
    if (recent.length >= limit) return false;
    recent.push(now);
    uses.set(key, recent);
    return true;
  };
}
const testThrottle = throttle(6, 10 * 60_000);
const emailThrottle = throttle(1, 60_000);

export function smtpEndpoints(deps: MailDeps = {}): Endpoint[] {
  return [
    {
      path: "/smtp",
      method: "get",
      handler: async (req) => (isAdmin(req.user) ? json(await smtpStatus(req.payload, deps.env)) : forbidden()),
    },
    {
      path: "/smtp",
      method: "post",
      handler: async (req) => {
        if (!isAdmin(req.user)) return forbidden();
        const input = await body(req);
        if (input.action === "remove")
          return json({ message: "SMTP settings removed. No email is sent until they are entered again.", status: await removeSmtp(req.payload, req.user, deps.env) });
        const result = await saveSmtp(req.payload, input, req.user, deps.env);
        return result.ok
          ? json({ message: "SMTP settings saved. They apply to the next email; no publishing needed.", status: result.status })
          : json({ message: result.message, errors: result.errors }, result.status);
      },
    },
    {
      path: "/smtp/test",
      method: "post",
      handler: async (req) => {
        if (!isAdmin(req.user)) return forbidden();
        if (!testThrottle(String(req.user!.id)))
          return json({ ok: false, message: "Too many connection tests. Please wait a few minutes." }, 429);
        const result = await testSmtp(req.payload, await body(req), deps);
        return json(result, result.ok ? 200 : "errors" in result && result.errors ? 400 : 502);
      },
    },
    {
      path: "/test-email",
      method: "post",
      handler: async (req) => {
        if (!isAdmin(req.user)) return forbidden();
        const { to } = await body(req);
        let address: string | null | undefined;
        if (to === "receiver") {
          const settings = await req.payload.findGlobal({ slug: "site-settings", depth: 0, draft: false, overrideAccess: true });
          address = settings._status === "published" ? settings.enquiries?.recipient : null;
          if (!address) return json({ ok: false, message: "Publish a primary enquiry receiver first." }, 409);
        } else address = req.user!.email;
        if (!address) return json({ ok: false, message: "Your account has no email address." }, 409);
        // Never to an address taken from the request.
        if (!emailThrottle(String(req.user!.id)))
          return json({ ok: false, message: "Please wait a minute before sending another test email." }, 429);
        const result = await sendMail(
          req.payload,
          {
            to: address,
            subject: "DeltaWave website: test email",
            text: "This is a test message from the DeltaWave CMS (Site settings → Email & enquiries). If you can read it, the SMTP settings work.",
          },
          deps,
        );
        return result.accepted.length
          ? json({ ok: true, message: `The mail server accepted the test message for ${address}. Check that inbox (and its spam folder).` })
          : json({ ok: false, message: result.error ?? "The mail server did not accept the test message." }, 502);
      },
    },
  ];
}
