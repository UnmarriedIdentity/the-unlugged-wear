import 'server-only';
import pg from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as tables from './generated/schema.ts';
import * as relations from './generated/relations.ts';

const schema = { ...tables, ...relations };

// One pg pool per server instance (reused across hot reloads in dev).
// pg speaks the standard Postgres protocol, so Neon, a local Postgres or a
// self-hosted server all work — only DATABASE_URL changes.

export type Database = NodePgDatabase<typeof schema>;
export { tables };
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

const globalForDb = globalThis as unknown as { __tuwPool?: pg.Pool; __tuwDb?: Database };

export function connectionString(env: NodeJS.ProcessEnv = process.env): string {
  const url = env.DATABASE_URL ?? env.DATABASE_URL_UNPOOLED;
  if (!url) throw new Error('DATABASE_URL is not set (see .env.example).');
  // pg already treats sslmode=require as verify-full; say so explicitly.
  return url.replace('sslmode=require', 'sslmode=verify-full');
}

export function getPool(): pg.Pool {
  globalForDb.__tuwPool ??= new pg.Pool({
    connectionString: connectionString(),
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    idleTimeoutMillis: 10_000,
  });
  return globalForDb.__tuwPool;
}

export function getDb(): Database {
  globalForDb.__tuwDb ??= drizzle(getPool(), { schema });
  return globalForDb.__tuwDb;
}

/** Run fn in one transaction; rolled back if it throws. */
export function withTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
  return getDb().transaction(fn);
}

export async function closeDb(): Promise<void> {
  await globalForDb.__tuwPool?.end();
  globalForDb.__tuwPool = undefined;
  globalForDb.__tuwDb = undefined;
}

export { schema };
export { sql } from 'drizzle-orm';
