import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb, type Transaction } from '../../platform/db/index.ts';
import { uuidv7 } from '../../platform/ids/index.ts';
import { usersWithPermission } from '../auth/index.ts';

// In-app bell (DOC/backend/15). The first slice serves staff inventory alerts;
// the rest of the bell lands with TL-BE-14. dedupe_key is unique across the
// table, so each recipient's key carries their id.

export type NotificationKind = 'order' | 'cart' | 'inventory' | 'payment' | 'system' | 'marketing' | 'refund';

export interface StaffNotice {
  kind: NotificationKind;
  title: string;
  body?: string;
  link?: string;
  /** Same key on the same day never rings twice. */
  dedupeKey: string;
}

export interface NotificationDto {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  dedupeKey: string | null;
  createdAt: string;
}

/** Rings every active staff member holding `permission`, inside the caller's transaction. */
export async function notifyStaff(tx: Transaction, permission: string, notices: StaffNotice[]): Promise<number> {
  if (!notices.length) return 0;
  const recipients = await usersWithPermission(permission, tx);
  if (!recipients.length) return 0;
  const rows = recipients.flatMap((userId) => notices.map((n) => ({
    id: uuidv7(), user_id: userId, kind: n.kind, title: n.title.slice(0, 150), body: n.body ?? null, link: n.link ?? null, dedupe_key: `${n.dedupeKey}:${userId}`,
  })));
  const { rowCount } = await tx.execute(sql`INSERT INTO notifications (id, user_id, kind, title, body, link, dedupe_key)
    SELECT x.id, x.user_id, x.kind, x.title, x.body, x.link, x.dedupe_key
    FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) AS x(id uuid, user_id uuid, kind text, title text, body text, link text, dedupe_key text)
    ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING`);
  return rowCount ?? 0;
}

export async function listNotifications(userId: string, limit = 50): Promise<NotificationDto[]> {
  const { rows } = await getDb().execute<{ id: string; kind: NotificationKind; title: string; body: string | null; link: string | null; read_at: string | null; dedupe_key: string | null; created_at: string }>(
    sql`SELECT id, kind, title, body, link, read_at, dedupe_key, created_at FROM notifications WHERE user_id = ${userId} ORDER BY created_at DESC, id DESC LIMIT ${limit}`,
  );
  return rows.map((r) => ({ id: r.id, kind: r.kind, title: r.title, body: r.body ?? '', link: r.link, read: r.read_at !== null, dedupeKey: r.dedupe_key, createdAt: new Date(r.created_at).toISOString() }));
}

/** Only the owner can mark their own row; anyone else's id changes nothing. */
export async function markNotificationRead(userId: string, id: string): Promise<void> {
  await getDb().execute(sql`UPDATE notifications SET read_at = now() WHERE id = ${id} AND user_id = ${userId} AND read_at IS NULL`);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await getDb().execute(sql`UPDATE notifications SET read_at = now() WHERE user_id = ${userId} AND read_at IS NULL`);
}
