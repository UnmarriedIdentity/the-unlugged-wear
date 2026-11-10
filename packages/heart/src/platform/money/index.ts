// Money: DECIMAL(12,2) rupees in the database, integer paise everywhere in
// code (DOC/backend/01 §2). Convert only at the database boundary.

/** Paise (integer) from a DB DECIMAL value ("3899.00", "12.5", 3899). */
export function toPaise(rupees: string | number): number {
  const text = typeof rupees === 'number' ? rupees.toFixed(2) : rupees.trim();
  const match = /^(-)?(\d+)(?:\.(\d{1,2}))?$/.exec(text);
  if (!match) throw new TypeError(`Not a money amount: ${String(rupees)}`);
  const [, sign, whole, fraction = ''] = match;
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(paise)) throw new RangeError(`Amount too large: ${text}`);
  return sign ? -paise : paise;
}

/** DB DECIMAL string ("3899.00") from integer paise. */
export function toRupees(paise: number): string {
  assertPaise(paise);
  const sign = paise < 0 ? '-' : '';
  const abs = Math.abs(paise);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

export function assertPaise(value: number): void {
  if (!Number.isSafeInteger(value)) throw new TypeError(`Paise must be an integer: ${value}`);
}

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** "₹3,899" / "₹3,899.50" for display. */
export const formatINR = (paise: number): string => {
  assertPaise(paise);
  return INR.format(paise / 100);
};

/** Percentage of an amount, rounded half-up to whole paise. */
export function percentOf(paise: number, percent: number): number {
  assertPaise(paise);
  return Math.round((paise * percent) / 100);
}

/** Taxable value inside a GST-inclusive price: price ÷ (1 + rate). */
export function taxableFromInclusive(paise: number, ratePercent: number): number {
  assertPaise(paise);
  return Math.round((paise * 100) / (100 + ratePercent));
}
