import { allowedSenderDomains, defaultSender, mailConfigured } from "@/lib/mail";
import { TestEmailButton } from "./test-email-button";

/**
 * Shows whether the server can send email, without revealing any credential.
 * Rendered at the top of Site settings → Email & enquiries.
 */
export function MailStatus() {
  const configured = mailConfigured();
  const sender = defaultSender();
  return (
    <div className="dw-mail-status" style={{ marginBottom: "24px" }}>
      <p className="field-label">Mail server</p>
      <p style={{ margin: "4px 0 8px" }}>
        {configured
          ? `Configured. Default sender: ${sender.name}${sender.address ? ` <${sender.address}>` : ""}.`
          : "Not configured. Enquiries are still saved here, but no email is sent until SMTP_HOST, SMTP_USER and SMTP_PASS are set on the server."}
      </p>
      <p style={{ margin: "0 0 12px", opacity: 0.75 }}>
        Allowed sender domains: {allowedSenderDomains().join(", ")}.
      </p>
      {configured && <TestEmailButton />}
    </div>
  );
}
