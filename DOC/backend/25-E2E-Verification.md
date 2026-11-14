# End-to-end verification — 2026-11-14

Manual walk-through of every flow that runs on the database so far
(TL-BE-00…09), both apps running locally against Neon (storefront :3025,
admin :3024). Test identities only (`@example.com`, Indiranagar addresses).

## Automated gates

Typecheck clean · admin tests 75/75 · heart integration tests 174/174 · storefront tests 54/55 (hero pause control, below) · both production builds clean.

PDF: `DOC/backend/E2E-Test-Report-2026-11-14.pdf`.

## Storefront

| Flow | Result |
| --- | --- |
| Home, shop (155 items), product page (one `h1`) render from the database | ✅ |
| Add to bag → drawer, change quantity, bag survives page change | ✅ |
| Promo codes: unknown code refused; `MINIMAL10` / `UNPLUGGED10` applied; server total matches the drawer (₹2,129.10) | ✅ |
| Guest cash-on-delivery checkout → order `TUW-261114-QKU84` | ✅ |
| Guest order tracking by number + email (email case-insensitive) | ✅ |
| Sign in → wishlist kept; card checkout with promo → order `TUW-261114-TS4QZ` | ✅ |
| Customer cancels inside the window → order cancelled, refund raised | ✅ |
| Store settings change in admin (free-delivery threshold) shows on the storefront after save | ✅ |
| 360 px and 768 px: no horizontal page scroll on home, shop, product, bag, checkout, tracking, account | ✅ |

## Admin

| Flow | Result |
| --- | --- |
| All 34 dashboard routes return 200 | ✅ |
| Product save → storefront refreshes (10 s / 42 queries on dev latency, was 25 s / 75) | ✅ |
| Order deep link `/orders?open=<number>` opens the drawer on a full page load | ✅ |
| Order walk: pending → confirmed → printing → shipped → delivered; storefront tracking follows each step | ✅ |
| COD: mark cash collected → UPI payout (destination stored masked) → completed with a UTR | ✅ |
| Over-refund refused; one UTR proves only one payout | ✅ |

## Fixed during this pass

- Money in the bag, drawer, checkout and payment button now always shows paise
  as two digits (₹779.80, not ₹779.8) — `formatRupees` in `storefront/lib/format.ts`.
- Checkout discount labels name the applied code instead of a fixed "10%".
- Free-delivery threshold copy (announcement bar, header ticker, checkout) reads
  the live setting instead of a hard-coded ₹3,000.
- "1 items" → "1 item" on the account order page.
- Shipped/delivered orders with no tracking code no longer say one "is added when it ships".
- Product page purchase row no longer overflows at 360 px.

## Open, needs the owner

- `tests/homepage-typography.test.mjs` still expects a pause control on the
  looping hero video (WCAG 2.2.2). The control was removed on purpose; either
  restore it or change the test.
- The applied promo code lives in memory, so a full page reload clears it
  (the server re-prices at checkout, so totals stay correct).
- FAQ fixture copy still quotes ₹3,000 / ₹150 as draft rates.
- Dev latency: Neon from India is ~300 ms per round trip, so admin saves take
  seconds locally; in production next to the database they take milliseconds.
