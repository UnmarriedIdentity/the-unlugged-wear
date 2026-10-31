/**
 * Product pricing helpers shared by the admin editor.
 *
 * The admin catalog model stores rupee floats (the storefront owns the
 * integer minor-unit / paise representation). Amounts are rounded to paise
 * precision here so repeated edits never accumulate float dust.
 */

export interface ParsedComparePrice {
  /** Rounded amount when the input is valid and present; omitted to clear. */
  value?: number;
  /** Validation message shown inline when the input is unusable. */
  error?: string;
}

/**
 * Parse the optional compare-at (was) price.
 *
 * Empty input clears the field. A provided amount must be a positive number
 * strictly above the selling price — a compare price at or below the selling
 * price would render a strikethrough that is not a real saving.
 */
export function parseCompareAtPrice(raw: string, sellingPrice: number): ParsedComparePrice {
  const trimmed = raw.trim();
  if (trimmed === '') return {};

  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: 'Enter a valid amount, or leave it empty.' };
  }
  if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
    return { error: 'Set a valid selling price first.' };
  }
  if (amount <= sellingPrice) {
    return { error: `Must be higher than the selling price (₹${sellingPrice.toFixed(2)}).` };
  }

  return { value: Math.round(amount * 100) / 100 };
}
