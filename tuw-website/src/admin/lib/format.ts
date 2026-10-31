// Formatters — currency, dates, order ids. Pure functions only.
export function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);
}

export function formatDate(d: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(d));
}

export function formatDateTime(d: string | Date): string {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}
