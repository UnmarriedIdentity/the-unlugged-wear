import 'server-only';
import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { getDb, getPool } from '../db/index.ts';
import { AppError } from '../errors/index.ts';
import { uuidv7 } from '../ids/index.ts';

// Request throttle shared by every app instance (rows, not memory). Keys are
// hashed with AUTH_SECRET, so the table never holds an IP or an email.

const hash = (bucket: string, key: string) => createHash('sha256').update(`${process.env.AUTH_SECRET ?? ''}:${bucket}:${key.trim().toLowerCase()}`).digest('hex');

export interface Limit { key: string; max: number; windowSeconds: number }

/**
 * Records one attempt under each key, then refuses when any key is over its
 * limit. Counting includes this attempt, so the max-th attempt still passes.
 */
export async function hitRateLimit(bucket: string, limits: Limit[], message = 'Too many attempts. Please wait a few minutes and try again.'): Promise<void> {
  const real = limits.filter((l) => l.key);
  if (!real.length) return;
  const db = getDb();
  const rows = real.map((l) => ({ id: uuidv7(), key_hash: hash(bucket, l.key) }));
  await db.execute(sql`INSERT INTO rate_limit_hits (id, bucket, key_hash) SELECT x.id, ${bucket}, x.key_hash FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) AS x(id uuid, key_hash text)`);
  for (const [i, l] of real.entries()) {
    const { rows: [n] } = await db.execute<{ n: number }>(sql`SELECT count(*)::int AS n FROM rate_limit_hits WHERE bucket = ${bucket} AND key_hash = ${rows[i]!.key_hash} AND created_at > now() - make_interval(secs => ${l.windowSeconds})`);
    if (n!.n > l.max) throw new AppError('RATE_LIMITED', message);
  }
}

/** Job platform.sweepRateLimits: nothing older than a day is needed. */
export async function sweepRateLimits(): Promise<number> {
  const { rowCount } = await getPool().query(`DELETE FROM rate_limit_hits WHERE created_at < now() - interval '1 day'`);
  return rowCount ?? 0;
}
