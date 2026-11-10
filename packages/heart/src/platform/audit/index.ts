import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb, type Transaction } from '../db/index.ts';
import { uuidv7 } from '../ids/index.ts';

// Append-only staff audit trail (audit_logs, 001-auth.sql). Cross-cutting
// platform table: any module records "who changed what" here, inside the
// same transaction as the change, so a rolled-back change leaves no entry.

export interface AuditEntry {
  actorId: string | null;
  action: string;   // 'settings.update', 'integration.update', …
  entity: string;   // table or aggregate name
  entityId?: string | null;
  diff: Record<string, { from: unknown; to: unknown }>;
}

export async function recordAudit(db: Transaction | ReturnType<typeof getDb>, entry: AuditEntry): Promise<void> {
  await db.execute(sql`INSERT INTO audit_logs (id, actor_id, action, entity, entity_id, diff)
    VALUES (${uuidv7()}, ${entry.actorId}, ${entry.action}, ${entry.entity}, ${entry.entityId ?? null}, ${JSON.stringify(entry.diff)}::jsonb)`);
}
