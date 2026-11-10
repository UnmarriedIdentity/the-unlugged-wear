import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb, withTransaction, type Transaction } from '../../platform/db/index.ts';
import { AppError, type ErrorDetail } from '../../platform/errors/index.ts';
import { recordAudit } from '../../platform/audit/index.ts';
import { SETTING_KEYS, isSettingKey, keysInGroup, type SettingGroup, type SettingKey, type SettingsValues } from './keys.ts';

// Settings module (DOC/backend/23 §7). Owns store_settings. Reads never
// throw on a bad or missing row — they fall back and log — so a typo in the
// table cannot take the storefront down. Writes validate every key, store
// only what changed, and audit the diff in the same transaction.

type Db = Transaction | ReturnType<typeof getDb>;
const ALL_KEYS = Object.keys(SETTING_KEYS) as SettingKey[];
const KEY_LIST = sql.join(ALL_KEYS.map((k) => sql`${k}`), sql`, `);

function parseStored<K extends SettingKey>(key: K, raw: unknown): SettingsValues[K] {
  const def = SETTING_KEYS[key];
  const parsed = def.schema.safeParse(raw);
  if (parsed.success) return parsed.data as SettingsValues[K];
  console.warn(`[settings] stored value for "${key}" is invalid; using the fallback`);
  return def.fallback as SettingsValues[K];
}

const toStored = (key: SettingKey, value: unknown): unknown => {
  const store = (SETTING_KEYS[key] as { store?: (v: unknown) => unknown }).store;
  return store ? store(value) : value;
};

async function readAll(db: Db, forUpdate = false): Promise<{ values: SettingsValues; updatedAt: Partial<Record<SettingKey, string>> }> {
  const { rows } = await db.execute<{ key: string; value: unknown; updated_at: string }>(
    forUpdate
      ? sql`SELECT key, value, updated_at FROM store_settings WHERE key IN (${KEY_LIST}) FOR UPDATE`
      : sql`SELECT key, value, updated_at FROM store_settings WHERE key IN (${KEY_LIST})`,
  );
  const values = Object.fromEntries(ALL_KEYS.map((k) => [k, SETTING_KEYS[k].fallback])) as SettingsValues;
  const updatedAt: Partial<Record<SettingKey, string>> = {};
  for (const row of rows) {
    if (!isSettingKey(row.key)) continue;
    (values as Record<string, unknown>)[row.key] = parseStored(row.key, row.value);
    updatedAt[row.key] = new Date(row.updated_at).toISOString();
  }
  return { values, updatedAt };
}

/** Every setting (staff screens). */
export async function getSettings(): Promise<SettingsValues> {
  return (await readAll(getDb())).values;
}

export async function getSetting<K extends SettingKey>(key: K): Promise<SettingsValues[K]> {
  return (await getSettings())[key];
}

export interface PublicSettings {
  storeName: string;
  supportEmail: string;
  currency: 'INR';
  timezone: string;
  tagline: string;
  taxIncluded: boolean;
  shipping: { freeThresholdPaise: number; standardFeePaise: number; codFeePaise: number };
  cancelWindowMinutes: number;
  exchangeWindowDays: number;
  giftCardValidityMonths: number;
}

export function toPublic(v: SettingsValues): PublicSettings {
  return {
    storeName: v['store.name'],
    supportEmail: v['store.support_email'],
    currency: v['store.currency'],
    timezone: v['store.timezone'],
    tagline: v['brand.tagline'],
    taxIncluded: v['tax.included'],
    shipping: {
      freeThresholdPaise: v['shipping.free_threshold'],
      standardFeePaise: v['shipping.standard_fee'],
      codFeePaise: v['shipping.cod_fee'],
    },
    cancelWindowMinutes: v['orders.cancel_window_minutes'],
    exchangeWindowDays: v['exchange.window_days'],
    giftCardValidityMonths: v['gift_card.validity_months'],
  };
}

/** Same-for-everyone settings the storefront may cache and show. */
export async function getPublicSettings(): Promise<PublicSettings> {
  return toPublic(await getSettings());
}

/** Fallback values only (database unreachable). */
export const fallbackPublicSettings = (): PublicSettings =>
  toPublic(Object.fromEntries(ALL_KEYS.map((k) => [k, SETTING_KEYS[k].fallback])) as SettingsValues);

export interface SettingsSaveResult {
  values: Partial<SettingsValues>;
  changed: SettingKey[];
}

/**
 * Save one admin tab. Unknown keys, keys from another tab and read-only keys
 * are refused (never silently dropped); every invalid field is reported.
 */
export async function updateSettings(group: SettingGroup, input: Record<string, unknown>, actorId: string): Promise<SettingsSaveResult> {
  const allowed = new Set(keysInGroup(group));
  const errors: ErrorDetail[] = [];
  const parsed: Partial<Record<SettingKey, unknown>> = {};
  for (const [key, raw] of Object.entries(input)) {
    if (!isSettingKey(key) || !allowed.has(key)) {
      errors.push({ field: key, message: 'This setting cannot be changed here.' });
      continue;
    }
    if ((SETTING_KEYS[key] as { readOnly?: boolean }).readOnly) {
      errors.push({ field: key, message: 'This setting is fixed.' });
      continue;
    }
    const result = SETTING_KEYS[key].schema.safeParse(raw);
    if (!result.success) errors.push({ field: key, message: result.error.issues[0]?.message ?? 'Invalid value' });
    else parsed[key] = result.data;
  }
  if (errors.length) {
    const first = errors[0]!.message.replace(/\.$/, '');
    throw new AppError('VALIDATION_FAILED', `${first}${errors.length > 1 ? ` (and ${errors.length - 1} more)` : ''}.`, errors);
  }

  return withTransaction(async (tx) => {
    const { values: current } = await readAll(tx, true);
    const diff: Record<string, { from: unknown; to: unknown }> = {};
    for (const [key, next] of Object.entries(parsed) as [SettingKey, unknown][]) {
      const from = toStored(key, current[key]);
      const to = toStored(key, next);
      if (JSON.stringify(from) === JSON.stringify(to)) continue;
      diff[key] = { from, to };
      await tx.execute(sql`INSERT INTO store_settings (key, value, updated_at, updated_by)
        VALUES (${key}, ${JSON.stringify(to)}::jsonb, now(), ${actorId})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now(), updated_by = EXCLUDED.updated_by`);
    }
    const changed = Object.keys(diff) as SettingKey[];
    if (changed.length) await recordAudit(tx, { actorId, action: 'settings.update', entity: 'store_settings', diff });
    const { values } = await readAll(tx);
    return { values: Object.fromEntries(keysInGroup(group).map((k) => [k, values[k]])) as Partial<SettingsValues>, changed };
  });
}
