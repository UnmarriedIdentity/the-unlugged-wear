import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

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

describe('Deterministic local fonts (Windows == macOS)', () => {
  test('layout vendors Outfit 300-900 via next/font/local with zero Google fetch', () => {
    const layout = readFileSync(join(repoRoot, 'src/app/(storefront)/layout.tsx'), 'utf8');
    for (const weight of ['300', '400', '500', '600', '700', '800', '900']) {
      assert.ok(
        layout.includes(`outfit-latin-${weight}-normal.woff2`) && layout.includes(`weight: '${weight}'`),
        `missing vendored Outfit weight ${weight} in src/app/(storefront)/layout.tsx`,
      );
      assert.ok(
        existsSync(join(repoRoot, `src/app/(storefront)/fonts/outfit-latin-${weight}-normal.woff2`)),
        `missing file src/app/(storefront)/fonts/outfit-latin-${weight}-normal.woff2`,
      );
    }
    assert.ok(!layout.includes("from 'next/font/google'"), 'layout must not import next/font/google');
    assert.ok(!layout.includes('from "next/font/google"'), 'layout must not import next/font/google');
    assert.ok(!layout.includes('https://fonts.googleapis'), 'layout must not fetch Google Fonts at runtime');
    assert.ok(layout.includes("variable: '--font-outfit'"), 'layout must keep --font-outfit variable');
    assert.ok(!layout.includes('--font-jost'), 'layout must not load Jost (storefront is Outfit-only)');
  });

  test('body stack resolves Outfit first on every OS', () => {
    const css = readFileSync(join(repoRoot, 'src/app/(storefront)/globals.css'), 'utf8');
    const bodyDefs = [...css.matchAll(/--font-body:\s*([^;]+);/g)].map((m) => m[1].trim());
    assert.ok(bodyDefs.length >= 2, 'expected @theme and :root --font-body definitions');
    for (const def of bodyDefs) {
      assert.ok(
        def.startsWith('var(--font-outfit)'),
        `body stack must start with Outfit variable, got: ${def}`,
      );
    }
  });

  test('heading stack resolves Outfit first on every OS (no named-fallback divergence)', () => {
    const css = readFileSync(join(repoRoot, 'src/app/(storefront)/globals.css'), 'utf8');
    const headingDefs = [...css.matchAll(/--font-heading:\s*([^;]+);/g)].map((m) => m[1].trim());
    assert.ok(headingDefs.length >= 2, 'expected @theme and :root --font-heading definitions');
    const banned = ['Jost', 'Futura', 'Playfair', 'Trebuchet', 'Segoe', 'San Francisco', 'Helvetica', 'Arial', 'Tahoma', 'Verdana'];
    for (const def of headingDefs) {
      assert.ok(
        def.startsWith('var(--font-outfit)'),
        `heading stack must start with Outfit variable, got: ${def}`,
      );
      for (const name of banned) {
        assert.ok(
          !def.includes(name),
          `heading stack must not name ${name}: ${def}`,
        );
      }
    }
    assert.ok(css.includes('font-synthesis-weight: none'), 'css must disable faux-weight synthesis');
  });

  test('all product slugs are concise, clean, and bounded (<= 45 characters)', () => {
    const fixturesContent = readFileSync(join(repoRoot, 'src/storefront/mocks/fixtures.ts'), 'utf8');
    const slugMatches = [...fixturesContent.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
    assert.ok(slugMatches.length >= 14, 'expected at least 14 product/collection slugs');

    for (const slug of slugMatches) {
      assert.ok(
        slug.length <= 45,
        `slug exceeds 45 characters: "${slug}" (${slug.length} chars)`,
      );
      assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, `slug must be clean kebab-case: "${slug}"`);
    }

    // Catalog follows the Qikink listing; pre-Qikink slugs stay reachable as aliases.
    assert.ok(fixturesContent.includes('slug: "acid-wash-hoodie"'));
    assert.ok(fixturesContent.includes('aliases: ["architectural-zip-hoodie"]'));
  });
  test('ProductCard and FilterBar conform to Figma Shop All v4 specs and zero admin purple', () => {
    const cardContent = readFileSync(join(repoRoot, 'src/storefront/components/commerce/ProductCard.tsx'), 'utf8');
    const filterContent = readFileSync(join(repoRoot, 'src/storefront/components/commerce/FilterBar.tsx'), 'utf8');
    const gridContent = readFileSync(join(repoRoot, 'src/storefront/components/commerce/ProductGrid.tsx'), 'utf8');

    // Invariant: Zero admin purple (#7539FF) in storefront card and filter components
    assert.ok(!cardContent.includes('#7539FF'), 'ProductCard must not contain admin purple #7539FF');
    assert.ok(!filterContent.includes('#7539FF'), 'FilterBar must not contain admin purple #7539FF');

    // Normal state invariants: collection label, wishlist heart, product image
    assert.ok(cardContent.includes('collectionLabel'), 'ProductCard must compute and display collectionLabel');
    assert.ok(cardContent.includes('toggleWishlist'), 'ProductCard must support toggleWishlist');

    // ProductCard Luxury Bordered Frame & Motion Invariants
    assert.ok(cardContent.includes('rounded-2xl'), 'ProductCard has rounded-2xl corners');
    assert.ok(cardContent.includes('border-store-card-border'), 'ProductCard has store-card-border');
    assert.ok(cardContent.includes('handlePrevImage'), 'ProductCard must support handlePrevImage');
    assert.ok(cardContent.includes('handleNextImage'), 'ProductCard must support handleNextImage');
    assert.ok(cardContent.includes('activeColorObj'), 'ProductCard must resolve active color');
    assert.ok(cardContent.includes('handleQuickAdd'), 'ProductCard must support handleQuickAdd size selection');

    // ProductCard Silky Slow-Living Luxury Motion Invariants
    assert.ok(cardContent.includes('tuw-card-expand'), 'ProductCard must use tuw-card-expand for smooth grid accordion size bar');
    assert.ok(cardContent.includes('tuw-size-enter'), 'ProductCard must use tuw-size-enter for smooth size glide');
    assert.ok(cardContent.includes('tuw-droplet-size'), 'ProductCard must use tuw-droplet-size for water-drop size buttons ripple');
    assert.ok(cardContent.includes('tuw-droplet-swatch'), 'ProductCard must use tuw-droplet-swatch for water-drop swatches ripple');
    assert.ok(cardContent.includes('tuw-droplet-color-label'), 'ProductCard must use tuw-droplet-color-label for active color glide');
    assert.ok(cardContent.includes('tuw-nav-arrow-left'), 'ProductCard must use tuw-nav-arrow-left for smooth carousel chevron glide');
    assert.ok(cardContent.includes('tuw-nav-arrow-right'), 'ProductCard must use tuw-nav-arrow-right for smooth carousel chevron glide');
    assert.ok(cardContent.includes('tuw-dashes-reveal'), 'ProductCard must use tuw-dashes-reveal for smooth carousel dashes reveal');
    assert.ok(cardContent.includes('tuw-crossfade-idle'), 'ProductCard must use tuw-crossfade-idle for seamless eyebrow cross-fade');
    assert.ok(cardContent.includes('tuw-crossfade-hover'), 'ProductCard must use tuw-crossfade-hover for seamless swatches cross-fade');

    // Shop grid shows products only (owner removed the editorial banners)
    assert.ok(!gridContent.includes('Acid Wash Collection'), 'no Acid Wash banner in the product grid');
    assert.ok(!gridContent.includes('The Minimal Frame'), 'no Minimal Frame banner in the product grid');

    // Figma Filter & Sort by drawer invariants (Figma Node frame specs)
    assert.ok(filterContent.includes('FIGMA_FILTER_COLORS'), 'FilterBar must export FIGMA_FILTER_COLORS');
    assert.ok(filterContent.includes('FIGMA_SORT_OPTIONS'), 'FilterBar must export FIGMA_SORT_OPTIONS');
    assert.ok(filterContent.includes('FIGMA_PRICE_RANGES'), 'FilterBar must export FIGMA_PRICE_RANGES');
    assert.ok(filterContent.includes('Clear all'), 'FilterBar must provide Clear all outline pill CTA');
    assert.ok(filterContent.includes('results'), 'FilterBar must provide Show results pill CTA');
    assert.ok(filterContent.includes('Bottle Green'), 'FilterBar must include Bottle Green in Figma colors');
    assert.ok(filterContent.includes('Light Baby Pink'), 'FilterBar must include Light Baby Pink in Figma colors');
    // Rolls-Royce luxury typography reveal invariants
    const cssContent = readFileSync(join(repoRoot, 'src/app/(storefront)/globals.css'), 'utf8');
    assert.ok(cssContent.includes('tuw-stagger-reveal'), 'globals.css must define tuw-stagger-reveal keyframes');
    assert.ok(cssContent.includes('.tuw-reveal-item'), 'globals.css must define .tuw-reveal-item');
    assert.ok(filterContent.includes('tuw-reveal-item'), 'FilterBar must apply tuw-reveal-item to drawer elements');
    assert.ok(filterContent.includes('tuw-delay-'), 'FilterBar must apply staggered animation delays');

    // Luxury Toast Notification & Deduplication Invariants
    const storeContent = readFileSync(join(repoRoot, 'src/storefront/mocks/store.tsx'), 'utf8');
    const toastContent = readFileSync(join(repoRoot, 'src/storefront/components/ui/Toast.tsx'), 'utf8');
    assert.ok(storeContent.includes('lastToastRef'), 'store.tsx must have lastToastRef deduplication guard');
    assert.ok(storeContent.includes('<Toast'), 'store.tsx must render Toast component');
    assert.ok(toastContent.includes('tuw-toast-enter'), 'Toast.tsx must apply tuw-toast-enter animation');
    assert.ok(toastContent.includes('tuw-toast-progress'), 'Toast.tsx must render progress depletion bar');
    assert.ok(cssContent.includes('tuw-toast-enter'), 'globals.css must define tuw-toast-enter');

    // ProductCard Silky Slow-Living Luxury Motion Invariants
    assert.ok(cssContent.includes('.tuw-card-expand'), 'globals.css must define .tuw-card-expand');
    assert.ok(cssContent.includes('.tuw-size-enter'), 'globals.css must define .tuw-size-enter');
    assert.ok(cssContent.includes('.tuw-droplet-size'), 'globals.css must define .tuw-droplet-size');
    assert.ok(cssContent.includes('.tuw-droplet-swatch'), 'globals.css must define .tuw-droplet-swatch');

    // Figma Canonical Checkout Invariants (media_1793276628297_7100bb4c.png)
    const checkoutContent = readFileSync(join(repoRoot, 'src/app/(storefront)/checkout/page.tsx'), 'utf8');
    const paymentContent = readFileSync(join(repoRoot, 'src/storefront/components/commerce/PaymentSimulationPanel.tsx'), 'utf8');

    assert.ok(!checkoutContent.includes('#7539FF'), 'checkout/page.tsx must not contain admin purple #7539FF');
    assert.ok(!paymentContent.includes('#7539FF'), 'PaymentSimulationPanel.tsx must not contain admin purple #7539FF');
    assert.ok(checkoutContent.includes('bg-store-checkout-teal'), 'checkout must use Figma dark teal bg-store-checkout-teal');
    assert.ok(checkoutContent.includes('bg-store-checkout-gold'), 'checkout must use Figma gold bg-store-checkout-gold');
    assert.ok(paymentContent.includes('Card Holder'), 'PaymentSimulationPanel must render Card Holder in card mockup');
    assert.ok(checkoutContent.includes('Details'), 'checkout must provide 3-step indicator with Details');
    assert.ok(checkoutContent.includes('lg:sticky'), 'checkout order summary must be sticky on desktop');
    assert.ok(checkoutContent.includes('COUPON CODE'), 'checkout order summary must include COUPON CODE label');
    assert.ok(checkoutContent.includes('unlocked free shipping'), 'checkout must include free shipping progress banner');
  });
});

describe('Demo sign-in and checkout flow', () => {
  const read = (relative) => readFileSync(join(repoRoot, relative), 'utf8');

  test('login only accepts the seeded demo account and account pages need a session', () => {
    const auth = read('src/storefront/mocks/auth.ts');
    const login = read('src/app/(storefront)/login/page.tsx');
    const accountLayout = read('src/app/(storefront)/account/layout.tsx');
    assert.ok(/export const DEMO_ACCOUNT = \{[\s\S]*email: '[^']+@[^']+',[\s\S]*password: '[^']+'/.test(auth), 'demo account is seeded in src/storefront/mocks/auth.ts');
    assert.ok(login.includes('checkDemoCredentials(email, password)'), 'login checks the demo credentials');
    assert.ok(!login.includes('any email and password will work'), 'login no longer accepts any credentials');
    assert.ok(accountLayout.includes('<AccountGate>'), 'account routes are wrapped in the sign-in gate');
  });

  test('express delivery replaces the standard fee instead of adding to it', () => {
    const checkout = read('src/app/(storefront)/checkout/page.tsx');
    assert.ok(checkout.includes("deliverySpeed === 'express' ? EXPRESS_FEE : shippingFee"), 'one delivery fee is chosen');
    assert.ok(!/total \+ \(deliverySpeed/.test(checkout), 'express must not be added on top of the total');
    // Same arithmetic as the page: ₹2,399 tee below the free-shipping threshold.
    const total = (subtotal, discount, speed) => subtotal - discount + (speed === 'express' ? 250 : subtotal - discount >= 3000 ? 0 : 150);
    assert.equal(total(2399, 0, 'standard'), 2549);
    assert.equal(total(2399, 0, 'express'), 2649);
  });

  test('order amounts stored in rupees are converted to paise before formatting', () => {
    const files = [
      'src/app/(storefront)/checkout/success/page.tsx',
      'src/app/(storefront)/account/orders/page.tsx',
      'src/app/(storefront)/account/orders/[id]/page.tsx',
    ];
    for (const file of files) {
      const calls = [...read(file).matchAll(/formatINR\(([^)]*)\)/g)].map((m) => m[1]);
      for (const arg of calls) {
        assert.ok(/\* 100|MinorINR/.test(arg), `${file}: formatINR(${arg}) must receive paise`);
      }
    }
  });

  test('new orders keep payment and fulfilment status separate', () => {
    const store = read('src/storefront/mocks/store.tsx');
    assert.ok(store.includes("paymentStatus: isCashOnDelivery ? 'pending' : 'paid'"), 'COD orders stay payment-pending');
    assert.ok(store.includes("fulfillmentStatus: 'queued'"), 'new orders start in the print queue');
    assert.ok(store.includes('while (taken.has(orderNumber))'), 'order numbers never reuse an existing reference');
  });
});
