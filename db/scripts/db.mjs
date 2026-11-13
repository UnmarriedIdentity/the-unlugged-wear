#!/usr/bin/env node
// Database runner for any PostgreSQL (Neon, local, self-hosted).
//
//   pnpm db:status    list applied / pending migration files
//   pnpm db:migrate   apply pending db/migrate/*.sql in file order
//   pnpm db:seed      run db/seed/*.sql (re-runnable, ON CONFLICT DO NOTHING)
//   pnpm db:reset     DEV ONLY: drop + recreate the public schema, then migrate + seed
//
// Connection: DATABASE_URL_UNPOOLED (preferred for DDL) or DATABASE_URL,
// read from the environment or the repo-root .env.local (gitignored).
// Each migration runs in its own transaction and is recorded in
// schema_migrations with a SHA-256 checksum. A file that changes after it
// was applied is refused: write a new numbered file instead (or, on a dev
// database only, use db:reset).

import pg from 'pg';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATE_DIR = join(ROOT, 'migrate');
const SEED_DIR = join(ROOT, 'seed');
const LOCK_ID = 727001; // pg_advisory_lock key: one runner at a time

const sqlFiles = (dir) => readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
const sha256 = (text) => createHash('sha256').update(text).digest('hex');

function connectionString() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    console.error('Set DATABASE_URL_UNPOOLED or DATABASE_URL (e.g. in the repo-root .env.local).');
    process.exit(1);
  }
  // pg treats 'require' as 'verify-full' already; say so explicitly to avoid its warning.
  return url.replace('sslmode=require', 'sslmode=verify-full');
}

function hostOf(url) {
  try { return new URL(url).host; } catch { return 'unknown host'; }
}

async function withClient(fn) {
  const url = connectionString();
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  console.log(`Connected to ${hostOf(url)}`);
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID]);
    return await fn(client);
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]).catch(() => {});
    await client.end();
  }
}

async function ensureLedger(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   varchar(255) PRIMARY KEY,
      checksum   char(64)     NOT NULL,
      applied_at timestamptz  NOT NULL DEFAULT now()
    )`);
  const { rows } = await client.query('SELECT filename, checksum FROM schema_migrations');
  return new Map(rows.map((r) => [r.filename, r.checksum]));
}

function plan(applied) {
  const pending = [];
  for (const file of sqlFiles(MIGRATE_DIR)) {
    const text = readFileSync(join(MIGRATE_DIR, file), 'utf8');
    const checksum = sha256(text);
    const known = applied.get(file);
    if (known && known !== checksum) {
      throw new Error(
        `${file} changed after it was applied. Add a new numbered migration instead` +
          ' (on a development database you may run pnpm db:reset).',
      );
    }
    if (!known) pending.push({ file, text, checksum });
  }
  return pending;
}

async function migrate(client) {
  const pending = plan(await ensureLedger(client));
  if (pending.length === 0) return console.log('Nothing to apply — schema is up to date.');
  for (const { file, text, checksum } of pending) {
    await client.query('BEGIN');
    try {
      await client.query(text);
      await client.query('INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)', [file, checksum]);
      await client.query('COMMIT');
      console.log(`  applied ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`${file} failed and was rolled back: ${error.message}`);
    }
  }
  console.log(`Applied ${pending.length} migration(s).`);
}

async function seed(client) {
  for (const file of sqlFiles(SEED_DIR)) {
    await client.query('BEGIN');
    try {
      await client.query(readFileSync(join(SEED_DIR, file), 'utf8'));
      await client.query('COMMIT');
      console.log(`  seeded ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`${file} failed and was rolled back: ${error.message}`);
    }
  }
}

async function status(client) {
  const applied = await ensureLedger(client);
  for (const file of sqlFiles(MIGRATE_DIR)) {
    const text = readFileSync(join(MIGRATE_DIR, file), 'utf8');
    const known = applied.get(file);
    const state = !known ? 'pending' : known === sha256(text) ? 'applied' : 'CHANGED';
    console.log(`  ${state.padEnd(8)} ${file}`);
  }
  const { rows } = await client.query(`
    SELECT count(*)::int AS n FROM pg_class c JOIN pg_namespace s ON s.oid = c.relnamespace
    WHERE s.nspname = 'public' AND c.relkind IN ('r','p') AND NOT c.relispartition
      AND c.relname <> 'schema_migrations'`);
  console.log(`Tables in public (excluding schema_migrations): ${rows[0].n}`);
}

async function reset(client) {
  if (process.env.DB_ALLOW_RESET !== 'true' || !process.argv.includes('--yes')) {
    throw new Error('db:reset deletes every table. Run with DB_ALLOW_RESET=true and --yes, on a development database only.');
  }
  await client.query('DROP SCHEMA public CASCADE');
  await client.query('CREATE SCHEMA public');
  console.log('  public schema recreated');
  await migrate(client);
  await seed(client);
}

const commands = { migrate, seed, status, reset };
const command = process.argv[2];
if (!commands[command]) {
  console.error(`Usage: node db/scripts/db.mjs <${Object.keys(commands).join('|')}>`);
  process.exit(1);
}
try {
  await withClient(commands[command]);
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
