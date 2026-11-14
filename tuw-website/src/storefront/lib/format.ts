// Formatters + price helpers. Pure functions only.
export function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);
}

export function formatDate(d: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(d));
}

/** Whole rupees without ".00" (₹6,098); paise shown only when present (₹6,098.50). */
export function formatPaise(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

/** Calendar date as "29 Sep 2026". */
// Fixed month names: Intl's "short" month is "Sept" in some locales/runtimes.
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function formatShortDate(d: string | Date): string {
  const date = new Date(d);
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** Rupee amounts held as numbers in the bag: ₹779.80, never ₹779.8. */
export function formatRupees(rupees: number): string {
  return formatPaise(Math.round(rupees * 100));
}
