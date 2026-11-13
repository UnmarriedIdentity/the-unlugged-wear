// Order totals in integer paise (DOC/backend/06, AGENTS §6). Pure: no
// database, so the same numbers come out of checkout, the order record and
// the tests. The discount applies first, then delivery, then tax.

export interface PricingLine {
  unitPaise: number;
  qty: number;
  /** GST percent for the product; null when unknown (counts as 0). */
  taxRate: number | null;
}

export type DiscountRule = { type: 'percent'; percent: number } | { type: 'fixed'; paise: number };

export interface ShippingRates {
  freeThresholdPaise: number;
  standardFeePaise: number;
  expressFeePaise: number;
  codFeePaise: number;
}

export interface PricingInput {
  lines: PricingLine[];
  discount: DiscountRule | null;
  rates: ShippingRates;
  speed: 'standard' | 'express';
  cashOnDelivery: boolean;
  /** Prices already include GST (store setting tax.included). */
  taxIncluded: boolean;
}

export interface Totals {
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  giftCardPaise: number;
  grandTotalPaise: number;
}

const whole = (n: number, what: string) => {
  if (!Number.isSafeInteger(n) || n < 0) throw new RangeError(`${what} must be a whole, non-negative number of paise`);
  return n;
};

export function priceOrder(input: PricingInput): Totals {
  if (!input.lines.length) throw new RangeError('An order needs at least one line');
  const subtotal = input.lines.reduce((sum, l) => {
    if (!Number.isInteger(l.qty) || l.qty < 1) throw new RangeError('Quantities must be whole numbers above zero');
    return sum + whole(l.unitPaise, 'unit price') * l.qty;
  }, 0);

  let discount = 0;
  if (input.discount?.type === 'percent') discount = Math.round((subtotal * Math.min(100, Math.max(0, input.discount.percent))) / 100);
  else if (input.discount?.type === 'fixed') discount = Math.min(subtotal, whole(input.discount.paise, 'discount'));

  const afterDiscount = subtotal - discount;
  const r = input.rates;
  let shipping = input.speed === 'express' ? whole(r.expressFeePaise, 'express fee') : afterDiscount >= r.freeThresholdPaise ? 0 : whole(r.standardFeePaise, 'standard fee');
  if (input.cashOnDelivery) shipping += whole(r.codFeePaise, 'COD fee');

  // Tax-inclusive prices already carry GST; the invoice shows the split.
  // Otherwise each line pays its rate on its share of the discounted subtotal.
  const tax = input.taxIncluded || subtotal === 0 ? 0 : input.lines.reduce((sum, l) => {
    const rate = l.taxRate ?? 0;
    return sum + Math.round((l.unitPaise * l.qty * afterDiscount * rate) / (subtotal * 100));
  }, 0);

  return { subtotalPaise: subtotal, discountPaise: discount, shippingPaise: shipping, taxPaise: tax, giftCardPaise: 0, grandTotalPaise: afterDiscount + shipping + tax };
}
