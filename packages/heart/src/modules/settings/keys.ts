import { z } from 'zod';
import { toPaise, toRupees } from '../../platform/money/index.ts';

// The store_settings key registry (DOC/backend/23 §7). One entry per key:
// how it is validated, what it falls back to when the row is missing, which
// admin tab edits it, and whether the storefront may read it.
//
// Money keys hold rupees as a decimal string ("150.00") in jsonb — never a
// float — and are exposed to code as integer paise. The seed's older numeric
// values (150) still parse.

const rupees = z
  .union([z.string(), z.number()])
  .transform((v, ctx) => {
    try {
      const paise = toPaise(typeof v === 'number' ? String(v) : v.replace(/[₹,\s]/g, ''));
      if (paise < 0) throw new RangeError();
      return paise;
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter an amount in rupees, e.g. 150 or 149.50' });
      return z.NEVER;
    }
  })
  .refine((p) => p <= toPaise('100000'), 'Amounts above ₹1,00,000 are not allowed here');

const int = (min: number, max: number, unit: string) =>
  z.coerce.number({ invalid_type_error: `Enter a whole number of ${unit}` })
    .int(`Enter a whole number of ${unit}`)
    .min(min, `At least ${min} ${unit}`)
    .max(max, `At most ${max} ${unit}`);

const text = (max: number, label: string) => z.string().trim().min(1, `Enter ${label}`).max(max, `${label} is too long`);
const email = z.string().trim().toLowerCase().email('Enter a valid email').max(255);
const bool = z.union([z.boolean(), z.enum(['true', 'false', 'on', 'off'])]).transform((v) => v === true || v === 'true' || v === 'on');

// Ask Intl itself: supportedValuesOf() lists canonical IDs only (ICU still
// spells India "Asia/Calcutta"), so aliases like Asia/Kolkata must pass too.
const isTimeZone = (v: string) => {
  try { new Intl.DateTimeFormat('en', { timeZone: v }); return v.includes('/') || v === 'UTC'; } catch { return false; }
};
const timezone = z.string().trim().refine(isTimeZone, 'Choose a valid time zone (e.g. Asia/Kolkata)');

// GSTIN: 2-digit state + PAN (5 letters, 4 digits, 1 letter) + entity + Z + check.
const gstin = z
  .string().trim().toUpperCase()
  .refine((v) => v === '' || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v), 'Enter a valid 15-character GSTIN')
  .transform((v) => (v === '' ? null : v));

export type SettingGroup = 'general' | 'brand' | 'shipping' | 'taxes' | 'policies' | 'notifications';

interface KeyDef<T> {
  group: SettingGroup;
  /** Storefront may read it (cached, same for everyone). */
  public: boolean;
  /** Shown but not editable (single-currency store). */
  readOnly?: boolean;
  /** Parses an incoming value (admin form or stored jsonb) into the code value. */
  schema: z.ZodType<T, z.ZodTypeDef, unknown>;
  /** Code value → jsonb for storage. */
  store?: (value: T) => unknown;
  /** Fallback when the row is missing — never business data (seller details live in the seed). */
  fallback: T;
}

const def = <T>(d: KeyDef<T>) => d;
const money = (fallback: string) => def({ group: 'shipping', public: true, schema: rupees, store: (p: number) => toRupees(p), fallback: toPaise(fallback) });

export const SETTING_KEYS = {
  'store.name': def({ group: 'general', public: true, schema: text(100, 'a store name'), fallback: 'The Unplugged Wear' }),
  'store.legal_entity': def({ group: 'general', public: false, schema: text(200, 'the legal entity'), fallback: 'The Unplugged Wear' }),
  'store.support_email': def({ group: 'general', public: true, schema: email, fallback: 'care@theunpluggedwear.com' }),
  'store.currency': def({ group: 'general', public: true, readOnly: true, schema: z.literal('INR'), fallback: 'INR' as const }),
  'store.timezone': def({ group: 'general', public: true, schema: timezone, fallback: 'Asia/Kolkata' }),
  'brand.tagline': def({ group: 'brand', public: true, schema: z.string().trim().max(160, 'Keep the tagline under 160 characters'), fallback: '' }),
  // Admin accent only — the storefront never uses it on purchase buttons.
  'brand.color': def({ group: 'brand', public: false, schema: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit hex colour, e.g. #7539FF').transform((v) => v.toUpperCase()), fallback: '#7539FF' }),
  'shipping.free_threshold': money('3000'),
  'shipping.standard_fee': money('150'),
  'shipping.cod_fee': money('0'),
  'shipping.express_fee': money('250'),
  'tax.included': def({ group: 'taxes', public: true, schema: bool, fallback: true }),
  'invoice.seller_legal_name': def({ group: 'taxes', public: false, schema: z.string().trim().max(200), fallback: '' }),
  'invoice.seller_address': def({ group: 'taxes', public: false, schema: z.string().trim().max(500), fallback: '' }),
  'invoice.seller_state_code': def({ group: 'taxes', public: false, schema: z.string().trim().regex(/^(\d{2})?$/, 'Two-digit GST state code, e.g. 24'), fallback: '' }),
  'invoice.seller_gstin': def({ group: 'taxes', public: false, schema: z.union([gstin, z.null()]), fallback: null as string | null }),
  'orders.cancel_window_minutes': def({ group: 'policies', public: true, schema: int(0, 1440, 'minutes'), fallback: 60 }),
  'exchange.window_days': def({ group: 'policies', public: true, schema: int(0, 60, 'days'), fallback: 7 }),
  'gift_card.validity_months': def({ group: 'policies', public: true, schema: int(1, 60, 'months'), fallback: 6 }),
  'inventory.low_stock_threshold': def({ group: 'policies', public: false, schema: int(0, 10000, 'units'), fallback: 10 }),
  'notifications.order_email': def({ group: 'notifications', public: false, schema: email, fallback: 'orders@theunpluggedwear.com' }),
} as const;

export type SettingKey = keyof typeof SETTING_KEYS;
type Out<K extends SettingKey> = (typeof SETTING_KEYS)[K]['fallback'];
export type SettingsValues = { -readonly [K in SettingKey]: Out<K> };

export const isSettingKey = (key: string): key is SettingKey => Object.prototype.hasOwnProperty.call(SETTING_KEYS, key);
export const keysInGroup = (group: SettingGroup): SettingKey[] =>
  (Object.keys(SETTING_KEYS) as SettingKey[]).filter((k) => SETTING_KEYS[k].group === group);
