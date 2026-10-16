// The part of nodemailer 9 that lib/mail.ts uses (the package has no types).
declare module "nodemailer" {
  export type Address = { name: string; address: string };

  export type SmtpTransportOptions = {
    host: string;
    port: number;
    secure: boolean;
    requireTLS?: boolean;
    ignoreTLS?: boolean;
    name?: string;
    auth?: { user: string; pass: string };
    tls?: { servername?: string; rejectUnauthorized?: boolean; minVersion?: string };
    connectionTimeout?: number;
    greetingTimeout?: number;
    socketTimeout?: number;
    disableFileAccess?: boolean;
    disableUrlAccess?: boolean;
    logger?: boolean;
    debug?: boolean;
  };

  export type MailMessage = {
    from?: string | Address;
    to?: string | Address | (string | Address)[];
    cc?: string | Address | (string | Address)[];
    bcc?: string | Address | (string | Address)[];
    replyTo?: string | Address | (string | Address)[];
    subject?: string;
    text?: string;
    html?: string;
    [key: string]: unknown;
  };

  export type SentMessageInfo = {
    accepted: (string | Address)[];
    rejected: (string | Address)[];
    messageId?: string;
    response?: string;
  };

  export interface Transporter {
    verify(): Promise<true>;
    sendMail(message: MailMessage): Promise<SentMessageInfo>;
    close(): void;
  }

  export function createTransport(options: SmtpTransportOptions): Transporter;

  const nodemailer: { createTransport: typeof createTransport };
  export default nodemailer;
}
