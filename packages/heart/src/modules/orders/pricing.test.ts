import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priceOrder, type PricingInput } from './pricing.ts';

const rates = { freeThresholdPaise: 300_000, standardFeePaise: 15_000, expressFeePaise: 25_000, codFeePaise: 4_000 };
const base = (over: Partial<PricingInput> = {}): PricingInput => ({ lines: [{ unitPaise: 99_900, qty: 2, taxRate: 5 }], discount: null, rates, speed: 'standard', cashOnDelivery: false, taxIncluded: true, ...over });

test('subtotal, standard delivery below the free threshold, free at or above it', () => {
  assert.deepEqual(priceOrder(base()), { subtotalPaise: 199_800, discountPaise: 0, shippingPaise: 15_000, taxPaise: 0, giftCardPaise: 0, grandTotalPaise: 214_800 });
  assert.equal(priceOrder(base({ lines: [{ unitPaise: 150_000, qty: 2, taxRate: 5 }] })).shippingPaise, 0, 'exactly the threshold ships free');
  assert.equal(priceOrder(base({ lines: [{ unitPaise: 149_999, qty: 2, taxRate: 5 }] })).shippingPaise, 15_000, 'one paisa short pays');
});

test('the discount comes first and can take an order back under the free threshold', () => {
  const t = priceOrder(base({ lines: [{ unitPaise: 160_000, qty: 2, taxRate: 5 }], discount: { type: 'percent', percent: 10 } }));
  assert.deepEqual([t.subtotalPaise, t.discountPaise, t.shippingPaise, t.grandTotalPaise], [320_000, 32_000, 15_000, 303_000]);
});

test('percent rounds to the paisa; fixed never exceeds the subtotal; nothing goes negative', () => {
  assert.equal(priceOrder(base({ lines: [{ unitPaise: 333, qty: 1, taxRate: null }], discount: { type: 'percent', percent: 10 } })).discountPaise, 33);
  assert.equal(priceOrder(base({ discount: { type: 'percent', percent: 150 } })).discountPaise, 199_800, 'a bad percent is clamped');
  const all = priceOrder(base({ discount: { type: 'fixed', paise: 10_000_000 } }));
  assert.deepEqual([all.discountPaise, all.grandTotalPaise], [199_800, 15_000]);
});

test('express is a flat fee; cash on delivery adds its fee', () => {
  assert.equal(priceOrder(base({ speed: 'express', lines: [{ unitPaise: 500_000, qty: 1, taxRate: 5 }] })).shippingPaise, 25_000, 'express is charged even above the threshold');
  assert.equal(priceOrder(base({ cashOnDelivery: true })).shippingPaise, 19_000);
});

test('tax-exclusive prices: each line pays its own rate on its share after the discount', () => {
  const t = priceOrder(base({ taxIncluded: false, lines: [{ unitPaise: 100_000, qty: 1, taxRate: 5 }, { unitPaise: 100_000, qty: 1, taxRate: 12 }], discount: { type: 'fixed', paise: 20_000 } }));
  // 180,000 after discount split evenly: 90,000 × 5% + 90,000 × 12%.
  assert.deepEqual([t.taxPaise, t.grandTotalPaise], [4_500 + 10_800, 180_000 + 15_000 + 15_300]);
});

test('money stays in whole paise: floats, negatives and empty orders are refused', () => {
  assert.throws(() => priceOrder(base({ lines: [{ unitPaise: 999.5, qty: 1, taxRate: 5 }] })), RangeError);
  assert.throws(() => priceOrder(base({ lines: [{ unitPaise: -1, qty: 1, taxRate: 5 }] })), RangeError);
  assert.throws(() => priceOrder(base({ lines: [{ unitPaise: 100, qty: 0, taxRate: 5 }] })), RangeError);
  assert.throws(() => priceOrder(base({ lines: [] })), RangeError);
  for (let i = 0; i < 200; i++) {
    const t = priceOrder(base({ lines: [{ unitPaise: 1 + Math.floor(Math.random() * 500_000), qty: 1 + (i % 7), taxRate: [0, 5, 12, 18][i % 4]! }], discount: i % 2 ? { type: 'percent', percent: i % 100 } : null, taxIncluded: i % 3 === 0 }));
    for (const v of Object.values(t)) assert.ok(Number.isSafeInteger(v) && v >= 0, JSON.stringify(t));
    assert.equal(t.grandTotalPaise, t.subtotalPaise - t.discountPaise + t.shippingPaise + t.taxPaise);
  }
});
