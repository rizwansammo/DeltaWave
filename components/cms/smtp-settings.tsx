"use client";

import { Button, useAuth, useConfig } from "@payloadcms/ui";
import { useCallback, useEffect, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { isAdmin, type Role } from "@/cms/access";

// The "SMTP server" panel at the top of Site settings → Email & enquiries.
// It talks only to the administrator endpoints in cms/globals/smtp-endpoints.ts.
// The stored password never reaches the browser: the panel only learns
// whether one is set. Saving applies immediately and is separate from the
// page's Save draft / Publish buttons.

type Security = "starttls" | "tls";
type Status = {
  state: "not-configured" | "incomplete" | "no-key" | "key-mismatch" | "ready";
  summary: string;
  host: string;
  port: number | null;
  security: Security | null;
  username: string;
  passwordSet: boolean;
  passwordUpdatedAt: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  encryptionKeyConfigured: boolean;
  lastTest: { at: string; ok: boolean; message: string } | null;
};
type Reply = { ok?: boolean; message?: string; errors?: Record<string, string>; status?: Status };
type Form = { host: string; port: string; security: Security; username: string; password: string };

const ports = [
  { value: "587", label: "587 (submission, STARTTLS)" },
  { value: "465", label: "465 (SSL/TLS)" },
  { value: "25", label: "25" },
  { value: "2525", label: "2525" },
];

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "");

const box: CSSProperties = {
  border: "1px solid var(--theme-elevation-150)",
  borderRadius: "var(--style-radius-m)",
  padding: "20px 24px",
  marginBottom: "32px",
  background: "var(--theme-elevation-0)",
};
const selectStyle: CSSProperties = {
  width: "100%",
  height: "40px",
  padding: "8px 12px",
  border: "1px solid var(--theme-elevation-150)",
  borderRadius: "var(--style-radius-s)",
  background: "var(--theme-input-bg)",
  color: "var(--theme-elevation-800)",
  fontSize: "1rem",
};
const tone = (ok: boolean | undefined): CSSProperties => ({
  margin: "12px 0 0",
  padding: "10px 14px",
  borderRadius: "var(--style-radius-s)",
  background: ok ? "var(--theme-success-50)" : ok === false ? "var(--theme-error-50)" : "var(--theme-elevation-50)",
  color: ok ? "var(--theme-success-800)" : ok === false ? "var(--theme-error-800)" : "inherit",
});

/** Enter would submit the surrounding Site settings form. */
const stayHere = (event: KeyboardEvent) => {
  if (event.key === "Enter") event.preventDefault();
};

function Field(props: { id: string; label: string; error?: string; hint?: ReactNode; kind?: string; children: ReactNode }) {
  return (
    <div className={`field-type ${props.kind ?? "text"}${props.error ? " error" : ""}`} style={{ marginBottom: "16px" }}>
      <label className="field-label" htmlFor={props.id}>
        {props.label}
      </label>
      <div className="field-type__wrap">{props.children}</div>
      {props.error && (
        <p role="alert" style={{ color: "var(--theme-error-500)", margin: "6px 0 0" }}>
          {props.error}
        </p>
      )}
      {props.hint && <div className="field-description">{props.hint}</div>}
    </div>
  );
}

export function SmtpSettings() {
  const { user } = useAuth<{ roles?: Role[] | null }>();
  const {
    config: { routes, serverURL },
  } = useConfig();
  const base = `${serverURL}${routes.api}/globals/site-settings`;
  const [status, setStatus] = useState<Status | null>(null);
  const [form, setForm] = useState<Form>({ host: "", port: "587", security: "starttls", username: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string>("");
  const [notice, setNotice] = useState<{ ok?: boolean; text: string } | null>(null);
  const admin = isAdmin(user);

  const adopt = useCallback((next: Status) => {
    setStatus(next);
    setForm({
      host: next.host,
      port: next.port ? String(next.port) : "587",
      security: next.security ?? "starttls",
      username: next.username,
      password: "",
    });
  }, []);

  useEffect(() => {
    if (!admin) return;
    fetch(`${base}/smtp`, { credentials: "include", cache: "no-store" })
      .then((response) => (response.ok ? (response.json() as Promise<Status>) : Promise.reject()))
      .then(adopt)
      .catch(() => setNotice({ ok: false, text: "The SMTP settings could not be loaded." }));
  }, [admin, base, adopt]);

  if (!admin) return null;

  const call = async (name: string, path: string, payload: Record<string, unknown>) => {
    setBusy(name);
    setNotice(null);
    setErrors({});
    try {
      const response = await fetch(`${base}${path}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const reply = (await response.json().catch(() => ({}))) as Reply;
      setErrors(reply.errors ?? {});
      setNotice({ ok: response.ok && reply.ok !== false, text: reply.message ?? `The server answered ${response.status}.` });
      if (reply.status) adopt(reply.status);
      else if (path === "/smtp/test") {
        // The recorded result is part of the status.
        const fresh = await fetch(`${base}/smtp`, { credentials: "include", cache: "no-store" });
        if (fresh.ok) setStatus((await fresh.json()) as Status);
      }
    } catch {
      setNotice({ ok: false, text: "The server could not be reached." });
    } finally {
      setBusy("");
    }
  };

  const connection = { host: form.host, port: Number(form.port), security: form.security, username: form.username, password: form.password };
  const set = (name: keyof Form) => (event: { target: { value: string } }) => {
    const value = event.target.value;
    setForm((current) => ({
      ...current,
      [name]: value,
      // The usual pairing; either can still be changed afterwards.
      ...(name === "port" && value === "465" ? { security: "tls" as Security } : {}),
      ...(name === "port" && value === "587" ? { security: "starttls" as Security } : {}),
    }));
  };

  return (
    <section style={box} aria-labelledby="smtp-heading" data-testid="smtp-settings">
      <h3 id="smtp-heading" style={{ margin: "0 0 4px" }}>
        SMTP server
      </h3>
      <p className="field-description" style={{ margin: "0 0 16px" }}>
        The mail server the website sends through: enquiry notifications and password-reset emails. Saved here
        immediately and used for the next email; it is not part of Save draft or Publish below.
      </p>

      {status && (
        <div role="status" style={tone(status.state === "ready" ? (status.lastTest ? status.lastTest.ok : undefined) : false)}>
          {status.summary}
          {status.lastTest && (
            <div style={{ marginTop: "6px" }}>
              Last test ({when(status.lastTest.at)}): {status.lastTest.ok ? "succeeded" : "failed"}. {status.lastTest.message}
            </div>
          )}
          {status.updatedAt && status.state !== "not-configured" && (
            <div style={{ marginTop: "6px", opacity: 0.8 }}>
              Last saved {when(status.updatedAt)}
              {status.updatedBy ? ` by ${status.updatedBy}` : ""}.
            </div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: "0 16px", marginTop: "20px" }}>
        <Field id="smtp-host" label="SMTP host" error={errors.host} hint="For example mail.example.com. Public mail servers only.">
          <input id="smtp-host" type="text" value={form.host} onChange={set("host")} onKeyDown={stayHere} autoComplete="off" spellCheck={false} />
        </Field>
        <Field id="smtp-port" label="Port" error={errors.port}>
          <select id="smtp-port" value={form.port} onChange={set("port")} style={selectStyle}>
            {ports.map((port) => (
              <option key={port.value} value={port.value}>
                {port.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field id="smtp-security" label="Connection security" error={errors.security} kind="radio-group">
        <div role="radiogroup" aria-labelledby="smtp-security" style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
          {(
            [
              ["starttls", "STARTTLS (usually port 587)"],
              ["tls", "SSL/TLS (usually port 465)"],
            ] as const
          ).map(([value, text]) => (
            <label key={value} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="radio"
                name="smtp-security"
                value={value}
                checked={form.security === value}
                onChange={() => setForm((current) => ({ ...current, security: value }))}
              />
              {text}
            </label>
          ))}
        </div>
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0 16px" }}>
        <Field id="smtp-username" label="Username" error={errors.username} hint="Usually the full mailbox address.">
          <input id="smtp-username" type="text" value={form.username} onChange={set("username")} onKeyDown={stayHere} autoComplete="off" spellCheck={false} />
        </Field>
        <Field
          id="smtp-password"
          label="Password"
          kind="password"
          error={errors.password}
          hint={
            status?.passwordSet
              ? `A password is stored (encrypted)${status.passwordUpdatedAt ? `, set ${when(status.passwordUpdatedAt)}` : ""}. Leave empty to keep it; type a new one to replace it.`
              : "Stored encrypted. It is never shown again after saving."
          }
        >
          <input
            id="smtp-password"
            type="password"
            value={form.password}
            onChange={set("password")}
            onKeyDown={stayHere}
            // Keeps the browser from offering the CMS sign-in password here.
            autoComplete="new-password"
            placeholder={status?.passwordSet ? "•••••••• (unchanged)" : ""}
          />
        </Field>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
        <Button buttonStyle="primary" size="small" disabled={Boolean(busy)} onClick={() => call("save", "/smtp", connection)}>
          {busy === "save" ? "Saving…" : "Save SMTP settings"}
        </Button>
        <Button buttonStyle="secondary" size="small" disabled={Boolean(busy)} onClick={() => call("test", "/smtp/test", connection)}>
          {busy === "test" ? "Testing…" : "Test SMTP connection"}
        </Button>
        <Button
          buttonStyle="secondary"
          size="small"
          disabled={Boolean(busy) || status?.state !== "ready"}
          onClick={() => call("me", "/test-email", { to: "me" })}
        >
          {busy === "me" ? "Sending…" : "Send test email to me"}
        </Button>
        <Button
          buttonStyle="secondary"
          size="small"
          disabled={Boolean(busy) || status?.state !== "ready"}
          onClick={() => call("receiver", "/test-email", { to: "receiver" })}
        >
          {busy === "receiver" ? "Sending…" : "Send test email to the primary receiver"}
        </Button>
        {status && status.state !== "not-configured" && (
          <Button
            buttonStyle="error"
            size="small"
            disabled={Boolean(busy)}
            onClick={() => {
              if (window.confirm("Remove the SMTP settings and the stored password? No email will be sent until they are entered again."))
                void call("remove", "/smtp", { action: "remove" });
            }}
          >
            {busy === "remove" ? "Removing…" : "Remove SMTP settings"}
          </Button>
        )}
      </div>
      <p className="field-description" style={{ margin: "8px 0 0" }}>
        Test SMTP connection checks the values in the form (the stored password if the field is empty) without
        sending anything. Test emails use the saved settings.
      </p>

      {notice && (
        <p role="status" aria-live="polite" style={tone(notice.ok)}>
          {notice.text}
        </p>
      )}
    </section>
  );
}
