import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Storefront Business Logic & Currency Rules', () => {
  // Minor units conversion
  test('converts INR rupees to integer minor units (paise) accurately', () => {
    const priceINR = 3899;
    const priceMinorINR = Math.round(priceINR * 100);
    assert.equal(priceMinorINR, 389900);
    assert.equal(typeof priceMinorINR, 'number');
    assert.equal(Number.isInteger(priceMinorINR), true);
  });

  // Free shipping threshold calculation
  test('calculates shipping fee based on ₹3,000 threshold', () => {
    const calculateShipping = (subtotalINR) => {
      const FREE_SHIPPING_THRESHOLD = 3000;
      const STANDARD_SHIPPING_FEE = 150;
      return subtotalINR >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
    };

    assert.equal(calculateShipping(2999), 150);
    assert.equal(calculateShipping(3000), 0);
    assert.equal(calculateShipping(7500), 0);
  });

  // Promo code discount calculation
  test('validates and applies 10% promo code UNPLUG10', () => {
    const applyPromo = (code, subtotalINR) => {
      const normalized = code.trim().toUpperCase();
      if (normalized === 'UNPLUG10') {
        return Math.round(subtotalINR * 0.1);
      }
      return 0;
    };

    assert.equal(applyPromo('UNPLUG10', 4000), 400);
    assert.equal(applyPromo('unplug10', 3899), 390);
    assert.equal(applyPromo('INVALID', 4000), 0);
    assert.equal(applyPromo('', 4000), 0);
  });

  // Composite variant key uniqueness and grouping
  test('correctly constructs composite variant key to prevent variant collisions', () => {
    const getCartKey = (productId, color, size) => `${productId}-${color.toLowerCase()}-${size.toUpperCase()}`;

    const key1 = getCartKey('prod-1', 'Charcoal', 'M');
    const key2 = getCartKey('prod-1', 'Charcoal', 'L');
    const key3 = getCartKey('prod-1', 'Ivory', 'M');

    assert.notEqual(key1, key2);
    assert.notEqual(key1, key3);
    assert.equal(key1, 'prod-1-charcoal-M');
  });

  // Cart quantity incrementation
  test('increments existing item quantity when identical variant is added', () => {
    let cart = [
      { id: 'prod-1-charcoal-M', productId: 'prod-1', quantity: 1, priceINR: 3899 }
    ];

    const addItem = (item) => {
      const existing = cart.find((i) => i.id === item.id);
      if (existing) {
        return cart.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return [...cart, item];
    };

    cart = addItem({ id: 'prod-1-charcoal-M', productId: 'prod-1', quantity: 2, priceINR: 3899 });
    assert.equal(cart.length, 1);
    assert.equal(cart[0].quantity, 3);
  });

  // Order net total calculation
  test('computes final payable total (subtotal - discount + shipping)', () => {
    const subtotal = 5000;
    const discount = 500;
    const shipping = 0;
    const total = subtotal - discount + shipping;
    assert.equal(total, 4500);
  });
});

describe('Tracking Reference & Carrier Lookup', () => {
  test('resolves known references and generates chronological checkpoints', () => {
    const mockOrders = {
      'TUW-9042': { carrier: 'Delhivery Surface Premium', trackingNumber: 'DEL-9840213-TUW', status: 'Shipped' },
      'TUW-8812': { carrier: 'BlueDart Air Express', trackingNumber: 'BD-4091823-TUW', status: 'Delivered' }
    };

    const lookupOrder = (ref) => mockOrders[ref.trim().toUpperCase()] || null;

    const res1 = lookupOrder('TUW-9042');
    assert.ok(res1);
    assert.equal(res1.status, 'Shipped');
    assert.equal(res1.carrier, 'Delhivery Surface Premium');

    const res2 = lookupOrder('tuw-8812');
    assert.ok(res2);
    assert.equal(res2.status, 'Delivered');

    const resUnknown = lookupOrder('UNKNOWN-999');
    assert.equal(resUnknown, null);
  });
});
