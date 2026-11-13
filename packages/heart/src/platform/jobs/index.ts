import 'server-only';
import { getPool } from '../db/index.ts';
import type pg from 'pg';

// Background jobs (background-jobs skill). A job is a plain function; any
// trigger — Vercel Cron today (/api/cron/[job] in tuw-admin), a Node worker
// on our own server later — just calls runJob(name).

export interface JobResult {
  processed: number;
  failed?: number;
  note?: string;
}

export interface JobDefinition {
  name: string; // '<module>.<verb>', e.g. 'fulfillment.submitDue'
  description: string;
  run: () => Promise<JobResult>;
}

export interface JobRun extends JobResult {
  name: string;
  ok: boolean;
  ms: number;
  error?: string;
}

const registry = new Map<string, JobDefinition>();

export function registerJob(job: JobDefinition): void {
  if (!/^[a-z][a-zA-Z]*\.[a-z][a-zA-Z]*$/.test(job.name)) throw new Error(`Bad job name: ${job.name}`);
  registry.set(job.name, job);
}

export const listJobs = (): JobDefinition[] => [...registry.values()];

export async function runJob(name: string): Promise<JobRun> {
  const job = registry.get(name);
  if (!job) return { name, ok: false, ms: 0, processed: 0, error: 'Unknown job' };
  const started = Date.now();
  try {
    const result = await job.run();
    return { name, ok: true, ms: Date.now() - started, ...result };
  } catch (error) {
    console.error(`[jobs] ${name} failed`, error);
    return { name, ok: false, ms: Date.now() - started, processed: 0, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Claim up to `limit` rows with FOR UPDATE SKIP LOCKED inside one transaction
 * and hand them to `handle` one by one. Two runners never get the same row.
 * `handle` returns false (or throws) to count a row as failed; the batch goes on.
 */
export async function processClaimed<Row extends pg.QueryResultRow>(
  claimSql: string,
  params: unknown[],
  handle: (row: Row, client: pg.PoolClient) => Promise<boolean | void>,
): Promise<JobResult> {
  const client = await getPool().connect();
  let processed = 0;
  let failed = 0;
  try {
    await client.query('BEGIN');
    const { rows } = await client.query<Row>(claimSql, params);
    for (const row of rows) {
      await client.query('SAVEPOINT job_row');
      try {
        const ok = await handle(row, client);
        await client.query('RELEASE SAVEPOINT job_row');
        if (ok === false) failed += 1; else processed += 1;
      } catch (error) {
        await client.query('ROLLBACK TO SAVEPOINT job_row');
        failed += 1;
        console.error('[jobs] row failed', error);
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
  return { processed, failed };
}

/** Tests only. */
export function clearJobs(): void {
  registry.clear();
}
