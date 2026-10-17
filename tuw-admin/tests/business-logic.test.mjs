import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------
// Mirrors of mocks/variants.ts R1 pricing-ladder rules (self-contained
// per this file's convention):
// effective = explicit override ?? base + Σ adjustments (additive, 2dp).
// ---------------------------------------------------------------
const roundPrice = (n) => Math.round(n * 100) / 100;
const adjustmentKey = (attr, value) => `${attr}:${value}`;
const sumAdjustments = (adjustments, parts) => {
  if (!adjustments) return 0;
  let sum = 0;
  for (const { attr, value } of parts) {
    if (!value) continue;
    const n = adjustments[adjustmentKey(attr, value)];
    if (typeof n === 'number' && Number.isFinite(n)) sum += n;
  }
  return roundPrice(sum);
};
const deriveVariantPrice = (base, adjustments, color, size) => {
  const sum =
    base +
    sumAdjustments(adjustments, [
      { attr: 'Color', value: color },
      { attr: 'Size', value: size },
    ]);
  return roundPrice(sum);
};
const recomputeVariants = (base, adjustments, variants) =>
  variants.map((v) => {
    if (v.priceOverridden) return v;
    const price = deriveVariantPrice(base, adjustments, v.color, v.size);
    return price === v.price ? v : { ...v, price };
  });
const minFromPrice = (variants) =>
  variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : 0;
const hasPriceSpread = (variants) => {
  if (variants.length < 2) return false;
  const first = variants[0].price;
  return variants.some((v) => v.price !== first);
};
const pruneAdjustments = (adjustments, attributes) => {
  if (!adjustments) return { next: {}, dropped: [] };
  const valid = new Set();
  for (const a of attributes) for (const v of a.values) valid.add(adjustmentKey(a.name, v));
  const next = {};
  const dropped = [];
  for (const [key, n] of Object.entries(adjustments)) {
    if (!valid.has(key)) {
      dropped.push(key);
      continue;
    }
    if (!Number.isFinite(n) || n <= 0) continue;
    next[key] = roundPrice(n);
  }
  return { next, dropped };
};

describe('Admin Operational Business Logic', () => {
  // State separation invariant
  test('maintains strict independence between paymentStatus, fulfillmentStatus, and returnStatus', () => {
    const order = {
      orderNumber: 'TUW-7701',
      paymentStatus: 'paid',
      fulfillmentStatus: 'queued',
      status: 'Printing'
    };

    // Updating fulfillment status does not implicitly alter payment status
    const updateFulfillment = (ord, newStatus) => ({ ...ord, fulfillmentStatus: newStatus });
    const updated = updateFulfillment(order, 'printing');

    assert.equal(updated.fulfillmentStatus, 'printing');
    assert.equal(updated.paymentStatus, 'paid');
    assert.notEqual(updated.fulfillmentStatus, updated.paymentStatus);
  });

  // Dynamic KPI aggregation from active orders
  test('dynamically computes Gross Sales and Pending Counts without hardcoded values', () => {
    const orders = [
      { id: '1', totalINR: 5000, fulfillmentStatus: 'queued', paymentStatus: 'paid' },
      { id: '2', totalINR: 3500, fulfillmentStatus: 'delivered', paymentStatus: 'paid' },
      { id: '3', totalINR: 4200, fulfillmentStatus: 'submission_failed', paymentStatus: 'paid' },
      { id: '4', totalINR: 2000, fulfillmentStatus: 'queued', paymentStatus: 'failed' }
    ];

    const grossSales = orders
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.totalINR, 0);

    const pendingFulfillment = orders.filter((o) => o.fulfillmentStatus === 'queued').length;
    const failedFulfillment = orders.filter((o) => o.fulfillmentStatus === 'submission_failed').length;

    assert.equal(grossSales, 12700);
    assert.equal(pendingFulfillment, 2);
    assert.equal(failedFulfillment, 1);
  });

  // Refund validation rules
  test('validates refund amounts ensuring they do not exceed order total or drop below 0', () => {
    const validateRefund = (orderTotal, requestedRefund) => {
      if (typeof requestedRefund !== 'number' || isNaN(requestedRefund)) {
        return { valid: false, error: 'Refund must be a valid number' };
      }
      if (requestedRefund <= 0) {
        return { valid: false, error: 'Refund amount must be greater than zero' };
      }
      if (requestedRefund > orderTotal) {
        return { valid: false, error: `Refund cannot exceed order total of ₹${orderTotal}` };
      }
      return { valid: true, error: null };
    };

    assert.equal(validateRefund(5000, 2500).valid, true);
    assert.equal(validateRefund(5000, 5000).valid, true);
    assert.equal(validateRefund(5000, 5500).valid, false);
    assert.equal(validateRefund(5000, 0).valid, false);
    assert.equal(validateRefund(5000, -100).valid, false);
  });

  // Role permissions checking
  test('correctly restricts destructive actions based on demo staff role', () => {
    const permissions = {
      Owner: { canPublishProduct: true, canRefund: true, canEditStaff: true },
      Operations: { canPublishProduct: true, canRefund: true, canEditStaff: false },
      Content: { canPublishProduct: true, canRefund: false, canEditStaff: false },
      'Read-only': { canPublishProduct: false, canRefund: false, canEditStaff: false }
    };

    const hasPermission = (role, action) => permissions[role]?.[action] ?? false;

    assert.equal(hasPermission('Owner', 'canEditStaff'), true);
    assert.equal(hasPermission('Operations', 'canEditStaff'), false);
    assert.equal(hasPermission('Operations', 'canRefund'), true);
    assert.equal(hasPermission('Content', 'canRefund'), false);
    assert.equal(hasPermission('Read-only', 'canPublishProduct'), false);
  });
});

describe('Product Variant Matrix', () => {
  // Mirror of mocks/variants.ts rules (self-contained per this file's convention)
  const buildVariantSku = (productId, colorIdx, size) => `${productId}-${colorIdx}-${size}`;
  const distributeStock = (stock, count) => {
    if (count <= 0) return [];
    const base = Math.floor(stock / count);
    const remainder = stock % count;
    return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
  };
  const synthesize = (p) => {
    const combos = [];
    p.colors.forEach((color, colorIdx) => {
      p.sizes.forEach((size) => combos.push({ color, colorIdx, size }));
    });
    const stocks = distributeStock(p.stock, combos.length);
    const base = p.basePrice ?? p.price;
    return combos.map((c, i) => ({
      id: `${p.id}-V${i + 1}`,
      color: c.color,
      size: c.size,
      sku: buildVariantSku(p.id, c.colorIdx, c.size),
      price: deriveVariantPrice(base, p.priceAdjustments, c.color, c.size),
      stock: stocks[i],
    }));
  };

  const sample = {
    id: 'PRD-01',
    price: 48.0,
    stock: 42,
    colors: ['Jet Black', 'Bone Chalk', 'Washed Olive'],
    sizes: ['S', 'M', 'L', 'XL'],
  };

  test('synthesizes the full color×size matrix with unique SKUs', () => {
    const variants = synthesize(sample);
    assert.equal(variants.length, 12);
    const skus = variants.map((v) => v.sku);
    assert.equal(new Set(skus).size, 12);
    assert.equal(skus[0], 'PRD-01-0-S');
  });

  test('distributes stock conserving the product total exactly', () => {
    const variants = synthesize(sample);
    const total = variants.reduce((n, v) => n + v.stock, 0);
    assert.equal(total, 42);
    assert.ok(variants.every((v) => v.stock >= 3 && v.stock <= 4));
  });

  test('per-variant price overrides leave siblings untouched', () => {
    const variants = synthesize(sample);
    const next = variants.map((v) =>
      v.id === 'PRD-01-V1' ? { ...v, price: 52.0 } : v
    );
    assert.equal(next[0].price, 52.0);
    assert.ok(next.slice(1).every((v) => v.price === 48.0));
    assert.equal(next.reduce((n, v) => n + v.stock, 0), 42);
  });
});

describe('Price Ladder (R1)', () => {
  const base = 48.0;
  const adj = { 'Color:Washed Olive': 4, 'Size:XL': 6 };
  const cells = [
    { id: 'PRD-01-V1', color: 'Jet Black', size: 'S', sku: 'PRD-01-0-S', price: 48.0, stock: 4 },
    { id: 'PRD-01-V2', color: 'Washed Olive', size: 'S', sku: 'PRD-01-2-S', price: 52.0, stock: 4 },
    { id: 'PRD-01-V3', color: 'Jet Black', size: 'XL', sku: 'PRD-01-0-XL', price: 54.0, stock: 3 },
    { id: 'PRD-01-V4', color: 'Washed Olive', size: 'XL', sku: 'PRD-01-2-XL', price: 58.0, stock: 3 },
  ];

  test('derives base + single adjustment on one value', () => {
    assert.equal(deriveVariantPrice(base, adj, 'Washed Olive', 'S'), 52.0);
    assert.equal(deriveVariantPrice(base, adj, 'Jet Black', 'S'), 48.0);
  });

  test('additive combos sum both adjustments (no multiplication)', () => {
    assert.equal(deriveVariantPrice(base, adj, 'Washed Olive', 'XL'), 58.0);
  });

  test('absent and zero adjustments are identical (0 ≡ NULL ≡ cleared)', () => {
    assert.equal(deriveVariantPrice(base, undefined, 'Washed Olive', 'XL'), 48.0);
    assert.equal(deriveVariantPrice(base, { 'Size:XL': 0 }, 'Jet Black', 'XL'), 48.0);
  });

  test('rounds to 2dp — no float dust in derived prices', () => {
    assert.equal(deriveVariantPrice(10, { 'Size:XL': 0.1, 'Color:Red': 0.2 }, 'Red', 'XL'), 10.3);
  });

  test('explicit overrides stay pinned through recompute; siblings re-derive', () => {
    const pinned = cells.map((v) => ({ ...v }));
    pinned[2] = { ...pinned[2], price: 61.5, priceOverridden: true };
    const next = recomputeVariants(base, adj, pinned);
    assert.equal(next[2].price, 61.5); // pinned — untouched
    assert.equal(next[2].priceOverridden, true);
    assert.equal(next[3].price, 58.0); // derived
  });

  test('a pinned override persists even when it equals the derived value', () => {
    const equalPin = [{ ...cells[1], priceOverridden: true }];
    const next = recomputeVariants(base, adj, equalPin);
    assert.equal(next[0].price, 52.0);
    assert.equal(next[0].priceOverridden, true); // flag never auto-clears
  });

  test('recompute is idempotent', () => {
    const once = recomputeVariants(base, adj, cells);
    const twice = recomputeVariants(base, adj, once);
    assert.deepEqual(twice, once);
  });

  test('listed price is the lowest cell (From semantics)', () => {
    assert.equal(minFromPrice(cells), 48.0);
    assert.equal(hasPriceSpread(cells), true);
    assert.equal(hasPriceSpread(cells.map((v) => ({ ...v, price: 48.0 }))), false);
  });

  test('base edit re-derives unpinned cells only', () => {
    const withPin = cells.map((v, i) => (i === 0 ? { ...v, price: 41.0, priceOverridden: true } : v));
    const next = recomputeVariants(50, adj, withPin);
    assert.equal(next[0].price, 41.0); // pinned
    assert.equal(next[1].price, 54.0); // 50 + 4
    assert.equal(next[3].price, 60.0); // 50 + 10
  });

  test('editing an adjustment re-derives only the affected cells', () => {
    const next = recomputeVariants(base, { 'Size:XL': 10 }, [
      { color: 'Jet Black', size: 'S', price: 48.0 },
      { color: 'Jet Black', size: 'XL', price: 54.0 },
      { color: 'Washed Olive', size: 'S', price: 48.0 },
    ]);
    assert.equal(next[0].price, 48.0); // untouched
    assert.equal(next[1].price, 58.0); // 48 + 10
    assert.equal(next[2].price, 48.0); // old Olive adj gone — cells follow the new sidecar
  });

  test('pruning drops stale keys (reported) and cleans no-effect entries (silent)', () => {
    const attrs = [
      { name: 'Color', values: ['Jet Black', 'Washed Olive'] },
      { name: 'Size', values: ['S', 'XL'] },
    ];
    const pruned = pruneAdjustments(
      { 'Color:Washed Olive': 4, 'Color:Retired': 9, 'Size:XL': 0, 'Size:S': -3 },
      attrs
    );
    assert.deepEqual(pruned.next, { 'Color:Washed Olive': 4 });
    assert.deepEqual(pruned.dropped, ['Color:Retired']);
  });

  test('legacy migration: differing cells pin, equal cells stay derived', () => {
    const loaded = [
      { color: 'Jet Black', size: 'S', price: 48.0 }, // equal → derived
      { color: 'Washed Olive', size: 'S', price: 57.0 }, // differs → pinned
    ];
    const migrated = loaded.map((v) =>
      deriveVariantPrice(base, undefined, v.color, v.size) === v.price
        ? v
        : { ...v, priceOverridden: true }
    );
    assert.equal(migrated[0].priceOverridden, undefined);
    assert.equal(migrated[1].priceOverridden, true);
  });
});
