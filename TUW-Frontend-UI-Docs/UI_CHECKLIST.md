# Frontend acceptance checklist

## Setup and boundaries

- [ ] Website and admin run independently with documented commands.
- [ ] Each application has its own routing, components, styling and configuration.
- [ ] UI uses mock adapters; no real service credentials or live transactions.
- [ ] Actual implemented routes are listed; missing screens are recorded.

## Design

- [ ] Urbanist loads with required weights and currency glyphs.
- [ ] Admin follows V2 semantic colours, spacing and radii.
- [ ] Website follows its editorial direction rather than copying the admin shell.
- [ ] Components use consistent interaction states and sensible hierarchy.

## Website flow

- [ ] Browse → filter → product → choose variant → cart → demo checkout → confirmation works.
- [ ] Quantity, removal, totals and unavailable variants behave correctly.
- [ ] Wishlist and account routes are usable with demo data.
- [ ] Forms validate and preserve input after failure.
- [ ] Tracking, journal, FAQ and policy layouts are reachable.
- [ ] Checkout clearly states no payment is collected.

## Admin flow

- [ ] Sidebar/mobile navigation reaches every scoped area.
- [ ] Product create/edit/publish preview updates local records.
- [ ] Order search/filter/detail and return navigation preserve context.
- [ ] Payment, fulfillment and shipment statuses remain separate.
- [ ] Retry/refund/return/team actions provide validated demo outcomes.
- [ ] Settings changes and unsaved-state feedback work locally.
- [ ] Reports agree with mock data and CSV exports contain the visible scope.
- [ ] Demo roles demonstrate expected UI restrictions without claiming security.

## Cross-screen states

- [ ] Loading, empty, error, success, disabled and focus-visible states exist.
- [ ] Long content, missing images and unknown references have sensible fallbacks.
- [ ] Visible controls work or explain why the preview action is unavailable.
- [ ] Reset-demo restores deterministic fixtures.

## Responsive and accessibility

- [ ] Mobile/tablet/desktop sizes have been reviewed.
- [ ] No accidental horizontal overflow or clipped primary content.
- [ ] Keyboard navigation, focus handling, labels and status announcements checked.
- [ ] Contrast, zoom and reduced-motion behaviour reviewed.

## Technical checks

- [ ] Run the configured lint, type-check and production build.
- [ ] Test meaningful state logic: totals, filters and mutation transitions.
- [ ] Verify primary customer and staff flows in a browser.
- [ ] No unexplained console errors, broken routes or missing assets.
- [ ] Record the checks actually run and any remaining limitations.
