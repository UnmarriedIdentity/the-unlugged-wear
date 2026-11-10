// Drift guard: the generated Drizzle types must match the live database built
// from db/migrate. Fails after a migration until `pnpm db:types` is re-run.
// Read-only; skipped when no DATABASE_URL is configured.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { getTableConfig, type PgTable } from 'drizzle-orm/pg-core';
import * as tables from './generated/schema.ts';
import { getPool, closeDb } from './index.ts';

const hasDb = Boolean(process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED);
after(() => closeDb());

test('generated Drizzle types match the live schema', { skip: !hasDb && 'no DATABASE_URL' }, async () => {
  const generated = new Map<string, string[]>();
  for (const value of Object.values(tables)) {
    if (value && typeof value === 'object' && Symbol.for('drizzle:IsDrizzleTable') in value) {
      const cfg = getTableConfig(value as PgTable);
      generated.set(cfg.name, cfg.columns.map((c) => c.name).sort());
    }
  }
  const { rows } = await getPool().query<{ table_name: string; columns: string[] }>(`
    SELECT c.table_name, array_agg(c.column_name::text ORDER BY c.column_name) AS columns
      FROM information_schema.columns c
      JOIN pg_class k ON k.relname = c.table_name
      JOIN pg_namespace n ON n.oid = k.relnamespace AND n.nspname = c.table_schema
     WHERE c.table_schema = 'public' AND k.relkind = 'r' AND NOT k.relispartition
       AND c.table_name <> 'schema_migrations'
     GROUP BY c.table_name`);
  const live = new Map(rows.map((r) => [r.table_name, [...r.columns].sort()]));
  assert.deepEqual([...generated.keys()].sort(), [...live.keys()].sort(), 'table list differs — run pnpm db:types');
  for (const [name, cols] of live) assert.deepEqual(generated.get(name), cols, `${name} columns differ — run pnpm db:types`);
});
