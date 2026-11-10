import 'server-only';
import { createHash } from 'node:crypto';
import { getPool } from '../db/index.ts';
import { AppError } from '../errors/index.ts';

// Layer-1 retry guard (DOC/backend/21 §2). claim() decides whether a request
// runs or replays; complete()/fail() record the outcome. Keys are unique per
// (scope, actor_ref, key), so one caller can never replay another's response.

export type Claim =
  | { kind: 'execute'; id: string }
  | { kind: 'replay'; status: number; body: unknown };

export interface ClaimInput {
  scope: string;
  actorRef: string; // 'user:<uuid>' | 'guest:<session id>'
  key: string;
  requestHash: string;
  userId?: string | null;
  ttlHours?: number; // 24 for checkout, 168 (7 days) otherwise
  leaseSeconds?: number;
}

const KEY_PATTERN = /^[A-Za-z0-9_-]{8,255}$/;

export function hashRequest(scope: string, payload: unknown): string {
  return createHash('sha256').update(scope).update('\n').update(canonicalJson(payload)).digest('hex');
}

/** JSON with sorted object keys, so equal payloads hash equally. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : 1));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
}

export async function claim(input: ClaimInput): Promise<Claim> {
  if (!KEY_PATTERN.test(input.key)) {
    throw new AppError('VALIDATION_FAILED', 'A valid Idempotency-Key is required.', [{ field: 'idempotencyKey', message: 'Missing or malformed key' }]);
  }
  const ttl = input.ttlHours ?? 168;
  const lease = input.leaseSeconds ?? 60;
  const pool = getPool();

  const inserted = await pool.query<{ id: string }>(
    `INSERT INTO idempotency_keys (id, scope, actor_ref, key, user_id, request_hash, status, locked_until, expires_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'in_progress', now() + make_interval(secs => $6), now() + make_interval(hours => $7))
     ON CONFLICT (scope, actor_ref, key) DO NOTHING
     RETURNING id`,
    [input.scope, input.actorRef, input.key, input.userId ?? null, input.requestHash, lease, ttl],
  );
  if (inserted.rows[0]) return { kind: 'execute', id: inserted.rows[0].id };

  const { rows } = await pool.query<{ id: string; status: string; request_hash: string; response_code: number | null; response_body: unknown; lease_live: boolean }>(
    `SELECT id, status, request_hash, response_code, response_body, (locked_until > now()) AS lease_live
       FROM idempotency_keys WHERE scope = $1 AND actor_ref = $2 AND key = $3`,
    [input.scope, input.actorRef, input.key],
  );
  const row = rows[0];
  if (!row) throw new AppError('IDEMPOTENCY_CONFLICT', 'Please retry the request.');
  if (row.request_hash !== input.requestHash) {
    throw new AppError('IDEMPOTENCY_KEY_REUSED', 'This request key was already used for a different request.');
  }
  if (row.status === 'completed') return { kind: 'replay', status: row.response_code ?? 200, body: row.response_body };
  if (row.status === 'in_progress' && row.lease_live) {
    throw new AppError('REQUEST_IN_PROGRESS', 'This request is already being processed.');
  }
  // Failed, or an in-progress lease that expired: take it over.
  const taken = await pool.query(
    `UPDATE idempotency_keys SET status = 'in_progress', locked_until = now() + make_interval(secs => $2)
      WHERE id = $1 AND (status = 'failed' OR locked_until <= now())`,
    [row.id, lease],
  );
  if (taken.rowCount === 0) throw new AppError('REQUEST_IN_PROGRESS', 'This request is already being processed.');
  return { kind: 'execute', id: row.id };
}

export async function complete(id: string, status: number, body: unknown, resource?: { table: string; id: string }): Promise<void> {
  await getPool().query(
    `UPDATE idempotency_keys SET status = 'completed', response_code = $2, response_body = $3,
            resource_table = $4, resource_id = $5, completed_at = now(), locked_until = NULL
      WHERE id = $1`,
    [id, status, JSON.stringify(body ?? null), resource?.table ?? null, resource?.id ?? null],
  );
}

/** 5xx / unexpected failures stay retryable; terminal 4xx are stored and replayed. */
export async function fail(id: string, status: number, body: unknown): Promise<void> {
  if (status >= 500) {
    await getPool().query(`UPDATE idempotency_keys SET status = 'failed', locked_until = NULL WHERE id = $1`, [id]);
  } else {
    await complete(id, status, body);
  }
}

/** Housekeeping job: drop expired keys. */
export async function sweepExpired(): Promise<number> {
  const { rowCount } = await getPool().query(`DELETE FROM idempotency_keys WHERE expires_at < now()`);
  return rowCount ?? 0;
}
