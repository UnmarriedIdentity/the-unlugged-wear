import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

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
    return combos.map((c, i) => ({
      id: `${p.id}-V${i + 1}`,
      color: c.color,
      size: c.size,
      sku: buildVariantSku(p.id, c.colorIdx, c.size),
      price: p.price,
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
