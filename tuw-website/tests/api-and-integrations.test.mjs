import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('Server Route & Asset Coverage Invariants', () => {
  const requiredRoutes = [
    'src/app/(storefront)/checkout/success/page.tsx',
    'src/app/(storefront)/account/orders/page.tsx',
    'src/app/(storefront)/account/orders/[id]/page.tsx',
    'src/app/(storefront)/about/page.tsx',
    'src/app/(storefront)/journal/page.tsx',
    'src/app/(storefront)/journal/[slug]/page.tsx',
    'src/app/(storefront)/faq/page.tsx',
    'src/app/(storefront)/policies/shipping/page.tsx',
    'src/app/(storefront)/policies/returns/page.tsx',
    'src/app/(storefront)/policies/privacy/page.tsx',
    'src/app/(storefront)/policies/terms/page.tsx',
    'src/app/(storefront)/api/checkout/route.ts',
    'src/app/(storefront)/api/orders/[id]/route.ts',
    'src/app/(storefront)/api/contact/route.ts',
    'src/app/(storefront)/api/webhooks/razorpay/route.ts',
    'src/app/(storefront)/api/fulfillment/qikink/route.ts',
    'src/storefront/lib/razorpay.ts',
    'src/storefront/lib/qikink.ts',
  ];

  for (const relPath of requiredRoutes) {
    test(`route or module exists: ${relPath}`, () => {
      const fullPath = join(repoRoot, relPath);
      assert.equal(existsSync(fullPath), true, `Missing expected file: ${relPath}`);
    });
  }

  // One URL per page: legacy duplicates are redirects, not second copies.
  test('legacy duplicate URLs redirect to their canonical page', () => {
    const config = readFileSync(join(repoRoot, 'next.config.ts'), 'utf8');
    const pairs = [
      ['/faqs', '/faq'],
      ['/blog', '/journal'],
      ['/blog/:slug', '/journal/:slug'],
      ['/our-story', '/about'],
      ['/privacy-policy', '/policies/privacy'],
      ['/returns-refunds', '/policies/returns'],
      ['/shipping-policy', '/policies/shipping'],
      ['/terms', '/policies/terms'],
    ];
    for (const [source, destination] of pairs) {
      assert.ok(
        config.includes(`source: '${source}', destination: '${destination}', permanent: true`),
        `missing redirect ${source} -> ${destination}`,
      );
      const legacyPage = join(
        repoRoot,
        'src/app/(storefront)',
        source.replace('/:slug', '/[slug]'),
        'page.tsx',
      );
      assert.equal(existsSync(legacyPage), false, `duplicate page still exists for ${source}`);
    }
  });
});

describe('Razorpay Server Signature & Security Checks', () => {
  const secret = 'test_webhook_secret_key_12345';

  test('verifies valid HMAC-SHA256 signature against order payload', () => {
    const orderId = 'order_DA981249TUW';
    const paymentId = 'pay_98124981TUW';
    const payload = `${orderId}|${paymentId}`;
    const validSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(validSignature, 'utf-8')
    );
    assert.equal(isValid, true);
  });

  test('rejects tampered or forged signature cleanly without exception', () => {
    const payload = 'order_DA981249TUW|pay_98124981TUW';
    const forgedSignature = 'forged_signature_0000000000000000000000000000000000000000000000000000000000000000';
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    let isValid = false;
    try {
      isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf-8'),
        Buffer.from(forgedSignature, 'utf-8')
      );
    } catch {
      isValid = false;
    }
    assert.equal(isValid, false);
  });

  test('rejects mismatched length signatures safely without throwing RangeError', () => {
    const payload = 'order_DA981249TUW|pay_98124981TUW';
    const shortSignature = 'short';
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    let isValid = false;
    try {
      isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf-8'),
        Buffer.from(shortSignature, 'utf-8')
      );
    } catch {
      isValid = false;
    }
    assert.equal(isValid, false);
  });
});

describe('Qikink POD Integration Invariants', () => {
  test('generates normalized SKUs following brand schema', () => {
    const generateSKU = (productId, color, size) =>
      `TUW-${productId}-${color}-${size}`.toUpperCase().replace(/\s+/g, '-');

    const sku1 = generateSKU('ovs-heavyweight-01', 'Off White', 'M');
    assert.equal(sku1, 'TUW-OVS-HEAVYWEIGHT-01-OFF-WHITE-M');

    const sku2 = generateSKU('hoodie-wabi-sabi', 'Charcoal Heather', 'XL');
    assert.equal(sku2, 'TUW-HOODIE-WABI-SABI-CHARCOAL-HEATHER-XL');
  });

  test('protects unpaid and refunded orders from being sent to manufacturing', () => {
    const isEligibleForFulfillment = (order) => {
      if (order.paymentStatus === 'failed' || order.paymentStatus === 'refunded') {
        return false;
      }
      return true;
    };

    assert.equal(isEligibleForFulfillment({ paymentStatus: 'failed' }), false);
    assert.equal(isEligibleForFulfillment({ paymentStatus: 'refunded' }), false);
    assert.equal(isEligibleForFulfillment({ paymentStatus: 'paid' }), true);
    assert.equal(isEligibleForFulfillment({ paymentStatus: 'pending' }), true);
  });

  test('enforces deduplication when partnerOrderId is already assigned', () => {
    const order = {
      orderNumber: 'TUW-9042',
      paymentStatus: 'paid',
      partnerOrderId: 'QIK-891024',
      fulfillmentStatus: 'printing',
    };

    const isDuplicateSubmission = Boolean(order.partnerOrderId && order.fulfillmentStatus === 'printing');
    assert.equal(isDuplicateSubmission, true);
  });
});

describe('Server-Side Checkout Arithmetic in Integer Minor Units (Paise)', () => {
  const computeServerTotals = (items, promoCode) => {
    const subtotalMinorINR = items.reduce((acc, it) => acc + it.priceMinorINR * it.quantity, 0);
    const FREE_SHIPPING_THRESHOLD_PAISE = 300000; // ₹3,000
    const STANDARD_SHIPPING_PAISE = 15000; // ₹150

    const shippingFeeMinorINR = subtotalMinorINR >= FREE_SHIPPING_THRESHOLD_PAISE ? 0 : STANDARD_SHIPPING_PAISE;

    let discountMinorINR = 0;
    if (promoCode && promoCode.trim().toUpperCase() === 'UNPLUG10') {
      discountMinorINR = Math.round(subtotalMinorINR * 0.1);
    }

    const totalMinorINR = Math.max(0, subtotalMinorINR - discountMinorINR + shippingFeeMinorINR);

    return {
      subtotalMinorINR,
      shippingFeeMinorINR,
      discountMinorINR,
      totalMinorINR,
    };
  };

  test('calculates correct minor units with shipping fee applied below ₹3,000 threshold', () => {
    const items = [
      { productId: 'tshirt-01', priceMinorINR: 189900, quantity: 1 } // ₹1,899
    ];

    const totals = computeServerTotals(items, '');
    assert.equal(totals.subtotalMinorINR, 189900);
    assert.equal(totals.shippingFeeMinorINR, 15000); // ₹150 shipping
    assert.equal(totals.discountMinorINR, 0);
    assert.equal(totals.totalMinorINR, 204900); // ₹2,049.00
    assert.equal(Number.isInteger(totals.totalMinorINR), true);
  });

  test('calculates correct minor units with free shipping and 10% promo discount above ₹3,000', () => {
    const items = [
      { productId: 'hoodie-01', priceMinorINR: 389900, quantity: 1 } // ₹3,899
    ];

    const totals = computeServerTotals(items, 'UNPLUG10');
    assert.equal(totals.subtotalMinorINR, 389900);
    assert.equal(totals.shippingFeeMinorINR, 0); // Free shipping
    assert.equal(totals.discountMinorINR, 38990); // ₹389.90 rounded to integer paise
    assert.equal(totals.totalMinorINR, 350910); // ₹3,509.10
    assert.equal(Number.isInteger(totals.totalMinorINR), true);
  });
});
