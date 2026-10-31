# Frontend acceptance checklist

## Setup and boundaries

- [x] Website and admin run independently with documented commands (`pnpm dev:admin` / `pnpm dev:website`).
- [x] Each application has its own routing, components, styling and configuration without cross-app imports.
- [x] UI uses mock adapters (`src/mocks/`); no real service credentials or live transactions.
- [x] Actual implemented routes are listed; missing screens are recorded (35 admin routes + 27 website routes fully built and pre-rendered).

## Design

- [x] Urbanist loads with required weights and currency glyphs (`₹` symbol across products and checkout).
- [x] Admin follows V2 semantic colours, spacing and radii (`--tuw-*` CSS tokens, 18 semantic roles).
- [x] Website follows its editorial direction (clean warm neutrals, slow-living luxury, generous whitespace) rather than copying the admin shell.
- [x] Components use consistent interaction states and sensible hierarchy.

## Website flow

- [x] Browse → filter → product → choose variant → cart → demo checkout → confirmation works.
- [x] Quantity, removal, totals and unavailable variants behave correctly.
- [x] Wishlist and account routes are usable with demo data.
- [x] Forms validate and preserve input after failure.
- [x] Tracking, journal, FAQ and policy layouts are reachable.
- [x] Checkout clearly states no payment is collected ("Demo checkout sandbox — no payment will be collected").

## Admin flow

- [x] Sidebar/mobile navigation reaches every scoped area.
- [x] Product create/edit/publish preview updates local records.
- [x] Order search/filter/detail and return navigation preserve context.
- [x] Payment, fulfillment and shipment statuses remain separate.
- [x] Retry/refund/return/team actions provide validated demo outcomes.
- [x] Settings changes and unsaved-state feedback work locally.
- [x] Reports agree with mock data and CSV exports contain the visible scope.
- [x] Demo roles demonstrate expected UI restrictions without claiming security (`Owner`, `Operations`, `Content`, `Read-only`).

## Cross-screen states

- [x] Loading, empty, error, success, disabled and focus-visible states exist.
- [x] Long content, missing images and unknown references have sensible fallbacks (`ImageWithFallback`, `EmptyState`).
- [x] Visible controls work or explain why the preview action is unavailable.
- [x] Reset-demo restores deterministic fixtures in both admin and website.

## Responsive and accessibility

- [x] Mobile/tablet/desktop sizes have been reviewed.
- [x] No accidental horizontal overflow or clipped primary content.
- [x] Keyboard navigation, focus handling, labels and status announcements checked.
- [x] Contrast, zoom and reduced-motion behaviour reviewed.

## Technical checks

- [x] Run the configured lint, type-check and production build (`tsc --noEmit` and `next build` pass with exit code 0).
- [x] Test meaningful state logic: totals, filters and mutation transitions.
- [x] Verify primary customer and staff flows in a browser.
- [x] No unexplained console errors, broken routes or missing assets.
- [x] Record the checks actually run and any remaining limitations.
