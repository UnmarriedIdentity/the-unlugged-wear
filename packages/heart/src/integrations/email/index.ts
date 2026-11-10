import 'server-only';
import { getPool } from '../../platform/db/index.ts';
import { uuidv7 } from '../../platform/ids/index.ts';

// Email sender registry (integrations skill). Only the mock adapter exists
// until the integrations phase (TL-INT-EMAIL): it records the message in
// email_logs and sends nothing. dedupe_key makes a retried producer a no-op.

export interface EmailMessage {
  to: string;
  subject: string;
  template: string; // 'auth.verify' | 'auth.reset' | 'auth.invite' | …
  link?: string;
  dedupeKey?: string;
}

export interface EmailSender {
  slug: string;
  send(message: EmailMessage): Promise<{ logId: string | null; delivered: boolean }>;
}

const mockSender: EmailSender = {
  slug: 'mock_email',
  async send(message) {
    const id = uuidv7();
    const { rowCount } = await getPool().query(
      `INSERT INTO email_logs (id, recipient, subject, template, status, dedupe_key)
       VALUES ($1, $2, $3, $4, 'sent', $5)
       ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING`,
      [id, message.to, message.subject, message.template, message.dedupeKey ?? null],
    );
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[mock email] ${message.template} → ${message.to}${message.link ? ` · ${message.link}` : ''}`);
    }
    return { logId: rowCount ? id : null, delivered: false };
  },
};

const senders = new Map<string, EmailSender>([[mockSender.slug, mockSender]]);

export function getEmailSender(slug = process.env.EMAIL_PROVIDER ?? 'mock_email'): EmailSender {
  const sender = senders.get(slug);
  if (!sender) throw new Error(`No email adapter for "${slug}" (integrations phase: TL-INT-EMAIL).`);
  return sender;
}

/** Demo links are shown on screen only when explicitly allowed (never in production). */
export const showDevLinks = (): boolean =>
  process.env.AUTH_SHOW_DEV_LINKS === 'true' && process.env.NODE_ENV !== 'production';
