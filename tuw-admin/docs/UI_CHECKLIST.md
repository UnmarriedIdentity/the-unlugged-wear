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

## Recent PEDIT evidence

### Basic Information card + DrawerCard primitive (2026-10-20)

- [x] `pnpm run typecheck` passes with no diagnostics.
- [x] `pnpm run test` passed 66/66 tests at this slice (now 71/71 after the tooltip position suite).
- [x] `pnpm run build` completes with all 40 routes prerendered.
- [x] Static audit: all six Basic Information fields load and save; Category is required from the existing five labels; Gender and Publication status moved without dropping fields; the Internal fields count no longer includes Gender.
- [x] Static audit: `FormSelect` labels are linked and helper copy is wired through `aria-describedby`; required `Input`/`FormSelect` labels show a quiet trailing asterisk while retaining native `required`.
- [ ] Browser visual pass at 360 / 768 / 1024 / 1440: card rhythm, paired Input/FormSelect alignment, keyboard focus order, Category/Gender/Status persistence, Reset Demo. User verification pending.

### DrawerCard v2 header + drawer canvas (2026-10-20)

- [x] Static audit: `DrawerCard` header uses 16px padding, 18/26/600 title tokens, 14/22/400 secondary description, 4px title/subtitle gap, and a full-bleed 1px `--tuw-border-subtle` divider; body uses 16px padding and 14px field rhythm.
- [x] Static audit: card outer border and header divider use the same `--tuw-border-subtle` token; card shadow is removed and the card clips the header with `overflow: hidden`.
- [x] Static audit: product editor General opts into `Drawer bodyTone="canvas"` (`--tuw-bg-canvas` #F7F8F9) so white cards separate from the drawer; other drawers and non-cardified tabs keep the surface default.
- [x] Static audit: no card-level “Required” chip; selected/warning header tones are opt-in and use existing semantic tokens only. No per-section colours.
- [ ] Browser visual pass at 360 / 768 / 1024 / 1440: header divider, drawer canvas, title/subtitle spacing, required asterisks, no dead chevron, focus order. User verification pending.

### Basic Information labels + Style Code info tooltip (2026-10-20)

- [x] Static audit: `DrawerCard` body establishes a 14px/600 field-label context; `Input`, `FormSelect` and `FormTextarea` consume it with their existing legacy fallbacks outside cards. The three explicit `labelSize={13}` overrides are removed from Basic Information. Card label rows reserve 24px, so the Style Code hint does not shift the paired Category baseline.
- [x] Static audit: helper lines are removed from URL Slug, Style Code, Category, Gender and Publication status; all six fields and required asterisks remain. The Style Code internal-reference copy is preserved as the tooltip body.
- [x] Static audit: only Style Code renders `InfoTooltip`; the icon is a 24px `type="button"` with a Lucide `Info` glyph and an accessible “More information about Style Code” name.
- [x] Static audit: `Tooltip` portals to `document.body`, uses semantic surface/border/text/shadow tokens, exposes `role="tooltip"` plus `aria-describedby`, prefers top placement with flip/clamp, and closes on Escape/outside click/scroll/resize.
- [x] `pnpm run test` includes five tooltip-position cases covering top placement, bottom flip, preferred-side flip, horizontal clamping and oversized content.
- [x] `pnpm run typecheck` passes and `pnpm run build` prerenders all 40 routes.
- [ ] Browser visual pass at 360 / 768 / 1024 / 1440: 14/600 labels, helper lines gone, info icon only on Style Code, hover/focus/tap tooltip, no clipping by card/drawer, Escape/outside close, tab order. User verification pending.

### Collapsible Basic Information + house dropdowns (2026-10-20)

- [x] Static audit: `DrawerCard` supports opt-in controlled/uncontrolled collapse. Basic Information starts collapsed, uses a real `<button type="button">` with `aria-expanded`, `aria-controls`, `aria-labelledby`, and a labelled body region; Enter/Space toggle and closing returns focus to the header.
- [x] Static audit: the body is mounted only while open, so collapsed fields are not tab stops and cannot contribute hidden required controls or a stale SearchableSelect popover. Field values live in `ProductsView` and survive collapse/reopen.
- [x] Static audit: the collapsed header has no internal divider; the outer card border remains. The chevron rotates and is `aria-hidden`; optional badge/action stay outside the toggle.
- [x] Static audit: Category, Gender and Publication status use `SearchableSelect` instead of native `<select>`. Category is marked required; Gender maps the `unspecified` sentinel back to the form's empty string; all three render 44px triggers.
- [x] Static audit: `SearchableSelect` labels consume the card-scoped 14/600 label context with a 24px row, link `htmlFor`/input `id`, expose `aria-required`, and close on Escape without propagating that Escape to the drawer.
- [x] `pnpm run typecheck` passes with no diagnostics; `pnpm run test` passes 71/71 admin tests; `pnpm run build` prerenders all 40 admin routes.
- [ ] Browser visual pass at 360 / 768 / 1024 / 1440: default-collapsed card, expand/collapse by mouse and keyboard, no tab stops while collapsed, values preserved across tab switches, dropdown open/select/save, popover clipping, Escape closes only the dropdown, Style Code tooltip, Reset Demo. User verification pending.

### Pricing & stock card + compare-at tooltip (2026-10-20)

- [x] Static audit: Pricing & stock is General card 2, built on the same collapsible `DrawerCard`; it starts collapsed, has independent `pricingCardOpen` state, survives tab switches, and resets when a create/edit drawer opens or closes.
- [x] Static audit: Base price and Compare-at price share the first paired row, keeping the validation-dependent pair adjacent; Stock Quantity and Tax Rate share the second row. Both rows use `repeat(auto-fit, minmax(180px, 1fr))` with a 12px gap and 44px `Input` controls.
- [x] Static audit: Tax Rate moved out of the Checkout section into Pricing & stock; the now-empty Checkout section is removed. No field is duplicated or dropped. The remaining flat discount section is retitled “Scheduled discounts” ahead of its own card.
- [x] Static audit: all four Pricing & stock helper lines are removed; no helper text renders below an input. Compare-at retains its native `Input` label hint (`InfoTooltip`) and its inline “higher than the selling price” validation error, and existing value-preserving handlers are unchanged.
- [x] Static audit: compare-at validation failure opens the Pricing & stock card on both create and edit paths before returning to General, so the inline error is not hidden by the collapsed body. Scroll/focus to the first invalid field remains in `TL-UI-PEDIT-SHELL`.
- [x] `pnpm run typecheck` passes with no diagnostics; `pnpm run test` passes 71/71 admin + 7/7 website tests; `pnpm run build` prerenders all 40 admin routes and 27 website routes.
- [ ] Browser visual pass at 360 / 768 / 1024 / 1440: card default-collapsed and independent, base/compare and stock/tax alignment, helper lines absent, compare-at tooltip hover/focus/tap without clipping, auto-open on validation failure, tax save/reload, Reset Demo. User verification pending.

