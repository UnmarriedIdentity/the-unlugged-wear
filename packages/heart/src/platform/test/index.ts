// Integration-test harness (TL-BE-01.11): a throwaway schema on whatever
// database DATABASE_URL_UNPOOLED points at (Neon dev branch or a local
// Postgres), built from db/migrate + db/seed, dropped afterwards. Production
// is never touched: the schema name is unique per run and always dropped.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';
import { closeDb } from '../db/index.ts';

const ROOT = new URL('../../../../../', import.meta.url).pathname;
const MIGRATE = join(ROOT, 'db/migrate');
const SEED = join(ROOT, 'db/seed');

export const hasTestDatabase = (): boolean => Boolean(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);

export interface TestDatabase {
  schema: string;
  url: string;
  pool: pg.Pool;
  drop: () => Promise<void>;
}

function baseUrl(): string {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) throw new Error('Integration tests need DATABASE_URL_UNPOOLED (direct, not pooled).');
  return url.replace('sslmode=require', 'sslmode=verify-full');
}

/** Create + migrate + seed a fresh schema and point the shared db client at it. */
export async function createTestDatabase(): Promise<TestDatabase> {
  const schema = `tuw_test_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const admin = new pg.Client({ connectionString: baseUrl() });
  await admin.connect();
  try {
    await admin.query(`CREATE SCHEMA ${schema}`);
    await admin.query(`SET search_path TO ${schema}`);
    for (const dir of [MIGRATE, SEED]) {
      for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
        await admin.query(readFileSync(join(dir, file), 'utf8'));
      }
    }
  } catch (error) {
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`).catch(() => {});
    throw error;
  } finally {
    await admin.end();
  }

  const url = new URL(baseUrl());
  url.searchParams.set('options', `-c search_path=${schema}`);
  const previous = { DATABASE_URL: process.env.DATABASE_URL, DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED };
  process.env.DATABASE_URL = url.toString();
  await closeDb(); // next getDb()/getPool() binds to the test schema

  const pool = new pg.Pool({ connectionString: url.toString(), max: 2 });
  return {
    schema,
    url: url.toString(),
    pool,
    drop: async () => {
      await pool.end();
      await closeDb();
      process.env.DATABASE_URL = previous.DATABASE_URL;
      process.env.DATABASE_URL_UNPOOLED = previous.DATABASE_URL_UNPOOLED;
      const dropper = new pg.Client({ connectionString: baseUrl() });
      await dropper.connect();
      await dropper.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await dropper.end();
    },
  };
}
