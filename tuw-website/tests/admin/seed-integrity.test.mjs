import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------
// Static seed guard. The seed must be re-runnable on every deploy and must
// never introduce credentials or fabricated business data. Both rules are
// invisible until a real database runs the file twice, so they are asserted
// here instead.
// ---------------------------------------------------------------

const HERE = dirname(fileURLToPath(import.meta.url));
const SEED_FILE = join(HERE, '..', '..', 'src', 'server', 'db', 'seed', '001-seed-core.sql');

const raw = readFileSync(SEED_FILE, 'utf8');
const sql = raw.replace(/--.*$/gm, '');

// Statements carry no semicolons inside string literals, so a split is safe.
const statements = sql
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

const inserts = statements.filter((s) => /^INSERT\s+INTO/i.test(s));

const insertFor = (table) => {
  const found = inserts.filter((s) => new RegExp(`^INSERT\\s+INTO\\s+${table}\\b`, 'i').test(s));
  assert.equal(found.length, 1, `expected exactly one INSERT INTO ${table}, found ${found.length}`);
  return found[0];
};

// Every seeded row in this file carries a literal id, so counting row-leading
// ids counts rows for the table-shaped inserts. Anchoring on the leading `(`
// matters: `attribute_values` rows carry the definition id as well as their
// own, so a bare id count would double.
const rowCount = (statement) =>
  (statement.match(/^\s*\(\s*'00000000-0000-4000-8000-[0-9a-f]{12}'/gm) ?? []).length;

describe('seed integrity', () => {
  test('the seed file exists and only inserts', () => {
    assert.equal(existsSync(SEED_FILE), true, 'seed file is missing');
    assert.equal(/^\s*(UPDATE|DELETE|DROP|TRUNCATE|ALTER)\b/im.test(sql), false);
    assert.equal(inserts.length, 13);
  });

  test('every statement is idempotent', () => {
    const conflicts = (sql.match(/ON\s+CONFLICT/gi) ?? []).length;
    assert.equal(conflicts, inserts.length, 'an INSERT has no ON CONFLICT clause');
    for (const statement of inserts) {
      assert.match(statement, /DO\s+NOTHING\s*$/i, `not idempotent: ${statement.slice(0, 60)}…`);
    }
  });

  test('RBAC seeds the four DB roles and the 19 permissions', () => {
    const roles = insertFor('roles');
    assert.equal(rowCount(roles), 4);
    for (const slug of ['admin', 'support', 'warehouse', 'customer']) {
      assert.match(roles, new RegExp(`'${slug}'`), `role ${slug} missing`);
    }
    // The invented "manager" persona is not a DB role.
    assert.equal(/'manager'/.test(roles), false);

    assert.equal(rowCount(insertFor('permissions')), 19);
  });

  test('attribute library seeds 9 definitions and 22 values', () => {
    assert.equal(rowCount(insertFor('attribute_definitions')), 9);
    assert.equal(rowCount(insertFor('attribute_values')), 22);
  });

  test('styling seeds 6 slots and the 30-row complement matrix', () => {
    assert.equal(rowCount(insertFor('styling_slots')), 6);
    assert.equal(rowCount(insertFor('styling_slot_rules')), 30);
    // Direction matters: 6 x 6 minus the 6 diagonals.
    assert.match(insertFor('styling_slot_rules'), /JOIN styling_slots s ON s\.slug = v\.source_slug/i);
  });

  test('settings rows are single-row and secret-free', () => {
    assert.equal(rowCount(insertFor('cms_settings')), 1);
    assert.equal(rowCount(insertFor('navigation_settings')), 1);

    const storeSettings = insertFor('store_settings');
    assert.equal((storeSettings.match(/^\s*\('/gm) ?? []).length, 14);
    for (const key of [
      'store.name',
      'brand.color',
      'shipping.free_threshold',
      'fulfillment.partner',
      'payments.stripe_live_mode',
    ]) {
      assert.match(storeSettings, new RegExp(`'${key.replace(/\./g, '\\.')}'`), `${key} missing`);
    }
    assert.equal(/api_key|secret|password|token/i.test(storeSettings), false, 'a secret key reached store_settings');
  });

  test('coupons carry no fabricated redemption counts or expiry windows', () => {
    assert.equal(rowCount(insertFor('discount_codes')), 3);
    // Three rows, each with uses_count 0.
    assert.equal((insertFor('discount_codes').match(/,\s*0,\s*true\)/g) ?? []).length, 3);
  });

  test('no credentials, no fake activity, no event data', () => {
    for (const table of [
      'users',
      'profiles',
      'login_attempts',
      'refresh_tokens',
      'password_reset_tokens',
      'email_verification_tokens',
      'idempotency_keys',
      'webhook_events',
      'email_logs',
      'orders',
      'stock_movements',
      'audit_logs',
    ]) {
      assert.equal(
        new RegExp(`INSERT\\s+INTO\\s+${table}\\b`, 'i').test(sql),
        false,
        `the seed must not write ${table}`,
      );
    }
    assert.equal(/argon2|\$argon2id\$/i.test(sql), false, 'no password hashes in the seed');
  });
});
