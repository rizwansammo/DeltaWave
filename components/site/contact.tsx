"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowUpRight,
  Loader2,
  Check,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Eyebrow, Lines } from "./shared";

/** Business contact details, from the published site settings. */
export type ContactDetails = {
  siteName: string;
  email: string;
  phone: string;
  phoneDisplay: string;
  location: string;
  publicWebsite: string;
};

/** Everything the contact band needs besides its heading. */
export type ContactSectionData = {
  introLines: string[];
  note: string;
  details: ContactDetails;
  /** The options of the "Service required" list, in order. */
  serviceOptions: string[];
};
type Turnstile = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}
// A ?service= preselection from the address bar. The server snapshot is empty,
// so the first client render matches the static HTML.
const ignoreChanges = () => () => {};
/** A random ID for one submission, so a retried request is stored once. */
const newSubmissionId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
function requestedService(options: string[]) {
  const requested = new URLSearchParams(location.search).get("service");
  return requested && options.includes(requested) ? requested : "";
}
export function ContactSection({
  standalone = false,
  eyebrow,
  heading,
  data,
}: {
  standalone?: boolean;
  /** Empty hides the eyebrow. */
  eyebrow: string;
  heading: React.ReactNode;
  data: ContactSectionData;
}) {
  const { details, serviceOptions } = data;
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">(
      "idle",
    ),
    [message, setMessage] = useState(""),
    [available, setAvailable] = useState<boolean | null>(null),
    [chosenService, setService] = useState<string | null>(null);
  const requested = useSyncExternalStore(
    ignoreChanges,
    () => requestedService(serviceOptions),
    () => "",
  );
  const service = chosenService ?? requested;
  const [errors, setErrors] = useState<Record<string, string>>({}),
    [challenge, setChallenge] = useState("");
  const widget = useRef<HTMLDivElement>(null),
    widgetId = useRef<string | null>(null),
    started = useRef(0),
    submission = useRef(""),
    formRef = useRef<HTMLFormElement>(null),
    statusRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    started.current = Date.now();
    submission.current = newSubmissionId();
    let alive = true;
    let script: HTMLScriptElement | undefined;
    fetch("/api/enquiry")
      .then((r) =>
        r.ok
          ? (r.json() as Promise<{ enabled: boolean; siteKey?: string }>)
          : Promise.reject(),
      )
      .then((config) => {
        if (!alive) return;
        setAvailable(config.enabled);
        if (config.enabled && config.siteKey) {
          const mount = () => {
            if (alive && widget.current && window.turnstile)
              widgetId.current = window.turnstile.render(widget.current, {
                sitekey: config.siteKey,
                action: "enquiry",
                callback: (token: string) => setChallenge(token),
                "expired-callback": () => setChallenge(""),
                "error-callback": () => {
                  setChallenge("");
                  setMessage(
                    "The security check could not load. Please try again or email us.",
                  );
                  setState("error");
                },
              });
          };
          if (window.turnstile) mount();
          else {
            script = document.createElement("script");
            script.src =
              "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
            script.async = true;
            script.onload = mount;
            script.onerror = () => {
              if (alive) {
                setAvailable(false);
                setMessage(
                  "The security check could not load. Please email us instead.",
                );
              }
            };
            document.head.appendChild(script);
          }
        }
      })
      .catch(() => {
        if (alive) setAvailable(false);
      });
    return () => {
      alive = false;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      script?.remove();
    };
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setMessage("");
    const fd = new FormData(e.currentTarget),
      values = Object.fromEntries(fd.entries());
    const errs: Record<string, string> = {};
    if (String(values.name || "").trim().length < 2)
      errs.name = "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values.email || "")))
      errs.email = "Please enter a valid email address.";
    if (String(values.phone || "").replace(/\D/g, "").length < 7)
      errs.phone = "Please enter a valid phone number.";
    if (!serviceOptions.includes(service))
      errs.service = "Please choose a service.";
    if (String(values.description || "").trim().length < 20)
      errs.description =
        "Please add at least 20 characters about your project.";
    if (!values.consent)
      errs.consent = "Please confirm that we may use these details to respond.";
    if (Object.keys(errs).length) {
      setErrors(errs);
      document.getElementById("enquiry-" + Object.keys(errs)[0])?.focus();
      return;
    }
    if (!available) {
      setState("error");
      setMessage(
        "Online enquiries are being prepared. Please contact us by email or phone.",
      );
      return;
    }
    if (!challenge) {
      setState("error");
      setMessage("Please complete the security check.");
      return;
    }
    setState("sending");
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          service,
          consent: !!values.consent,
          challenge,
          startedAt: started.current,
          submissionId: submission.current,
        }),
      });
      const data = (await response.json()) as {
        errors?: Record<string, string>;
        message?: string;
      };
      if (!response.ok) {
        setErrors(data.errors || {});
        throw new Error(
          data.message ||
            "Your enquiry could not be sent. Please try again or email us.",
        );
      }
      setState("success");
      // The server says whether the enquiry was saved and whether the team
      // was notified; it never claims an email that was not accepted.
      setMessage(data.message || "Thank you. Your enquiry has been saved.");
      formRef.current?.reset();
      setService("");
      started.current = Date.now();
      submission.current = newSubmissionId();
    } catch (e) {
      setState("error");
      setMessage(
        e instanceof Error
          ? e.message
          : "Your enquiry could not be sent. Please email us.",
      );
    } finally {
      setChallenge("");
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
      requestAnimationFrame(() => statusRef.current?.focus());
    }
  }
  const field = (
    name: string,
    label: string,
    type = "text",
    required = true,
  ) => (
    <div className="form-field">
      <label htmlFor={"enquiry-" + name}>
        {label}
        {!required && <span> (optional)</span>}
      </label>
      <input
        id={"enquiry-" + name}
        name={name}
        type={type}
        required={required}
        autoComplete={
          name === "name"
            ? "name"
            : name === "email"
              ? "email"
              : name === "phone"
                ? "tel"
                : "organization"
        }
        maxLength={name === "email" ? 254 : 120}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? "error-" + name : undefined}
      />
      {errors[name] && (
        <p className="field-error" id={"error-" + name}>
          {errors[name]}
        </p>
      )}
    </div>
  );
  return (
    <section
      className={"contact-section " + (standalone ? "contact-standalone" : "")}
      id="project-enquiry"
    >
      <div className="container">
        <div className="contact-heading">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h2>{heading}</h2>
        </div>
        <div className="contact-columns">
          <div className="contact-details">
            {details.siteName && <h3>{details.siteName}</h3>}
            {data.introLines.length > 0 && (
              <p>
                <Lines
                  lines={data.introLines}
                  breakClassName="desktop-only"
                  spaced
                />
              </p>
            )}
            {details.location && (
              <div className="contact-detail">
                <MapPin size={18} />
                <div>
                  <span className="small-label">Business location</span>
                  <address>{details.location}</address>
                </div>
              </div>
            )}
            {details.email && (
              <div className="contact-detail">
                <Mail size={18} />
                <div>
                  <span className="small-label">Email us</span>
                  <a href={"mailto:" + details.email}>{details.email}</a>
                </div>
              </div>
            )}
            {details.phone && (
              <div className="contact-detail">
                <Phone size={18} />
                <div>
                  <span className="small-label">Call us</span>
                  <a href={"tel:" + details.phone}>
                    {details.phoneDisplay || details.phone}
                  </a>
                </div>
              </div>
            )}
            {details.publicWebsite && (
              <a className="website-link" href="/">
                {details.publicWebsite}
                <ArrowUpRight size={15} />
              </a>
            )}
            {data.note && <p className="contact-note">{data.note}</p>}
          </div>
          <form
            ref={formRef}
            className="enquiry-form"
            noValidate
            onSubmit={submit}
          >
            <div className="form-heading">
              <h3>Project enquiry</h3>
              <span className="small-label">Tell us what you have in mind</span>
            </div>
            <div className="form-grid">
              {field("name", "Full name")}
              {field("email", "Business email", "email")}
              {field("phone", "Phone number", "tel")}
              {field("company", "Company / organization", "text", false)}
            </div>
            <div className="form-field">
              <label htmlFor="enquiry-service">Service required</label>
              <select
                id="enquiry-service"
                name="service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                required
                aria-invalid={!!errors.service}
                aria-describedby={errors.service ? "error-service" : undefined}
              >
                <option value="">Select a service</option>
                {serviceOptions.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              {errors.service && (
                <p className="field-error" id="error-service">
                  {errors.service}
                </p>
              )}
            </div>
            <div className="form-field">
              <label htmlFor="enquiry-description">Project description</label>
              <textarea
                id="enquiry-description"
                name="description"
                rows={4}
                placeholder="What would you like to build, improve or solve?"
                minLength={20}
                maxLength={5000}
                required
                aria-invalid={!!errors.description}
                aria-describedby={
                  errors.description ? "error-description" : undefined
                }
              />
              {errors.description && (
                <p className="field-error" id="error-description">
                  {errors.description}
                </p>
              )}
            </div>
            <div className="honeypot" aria-hidden="true">
              <label>
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <label className="consent">
              <input
                id="enquiry-consent"
                name="consent"
                type="checkbox"
                required
                aria-invalid={!!errors.consent}
                aria-describedby={errors.consent ? "error-consent" : undefined}
              />
              <span>
                I agree to the use of my details to respond to this enquiry.{" "}
                <a href="/privacy">Privacy notice</a>
              </span>
            </label>
            {errors.consent && (
              <p className="field-error" id="error-consent">
                {errors.consent}
              </p>
            )}
            <div ref={widget} className="security-widget" />
            {available === false && (
              <p className="form-availability">
                Online enquiries are being prepared. You can reach us directly
                at <a href={"mailto:" + details.email}>{details.email}</a>.
              </p>
            )}
            <div
              ref={statusRef}
              tabIndex={-1}
              className={"form-message " + state}
              role={state === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              {message && (
                <>
                  {state === "success" && <Check size={18} />}
                  <p>{message}</p>
                </>
              )}
            </div>
            <button
              type="submit"
              className="button"
              disabled={
                state === "sending" || available === null || available === false
              }
            >
              {state === "sending" ? (
                <>
                  Sending enquiry <Loader2 size={17} className="spinner" />
                </>
              ) : (
                <>
                  Submit enquiry <ArrowUpRight size={17} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
