# Frontend design system

## Font

Use Urbanist throughout the V2 admin interface and as the website default in this UI phase. Use separate app-level typography tokens so website styling can evolve independently. Source: https://fonts.google.com/specimen/Urbanist . Include the license if self-hosting. Do not mix Montserrat, Plus Jakarta Sans or Inter into V2 specimens.

## Type scale

| Role | Size | Line height | Weight |
|---|---:|---:|---:|
| Editorial display | 40–48px | 48–56px | 600 |
| Admin page title | 32px | 40px | 600 |
| Section heading | 24px | 32px | 600 |
| Subsection | 20px | 28px | 600 |
| Card heading | 18px | 26px | 600 |
| Body large | 16px | 24px | 400 |
| Body/table | 14px | 22px | 400 |
| Navigation/control | 14px | 20–22px | 500 |
| Metadata | 12px | 18px | 400 |

Use 700 sparingly for emphasis. Default letter spacing is zero. Use sentence case. Align numeric table columns right and use tabular numerals when supported. Check rupee symbols and long product names with the actual loaded font. Make display sizes responsive without shrinking essential body content.

## Admin semantic colours

| Role | Value |
|---|---|
| Canvas | #F7F8F9 |
| Surface | #FFFFFF |
| Primary text | #262626 |
| Secondary text | #5D6772 |
| Subtle divider/card border | #E9E9E9 |
| Control border | #E9E9E9 |
| Primary action | #7539FF |
| Primary hover | #6025DB |
| Selected background | #F8F5FF |
| On-primary text | #FFFFFF |
| Info text/background | #175CD3 / #F4F9FE |
| Success text/background | #187343 / #F4FBF7 |
| Warning text/background | #856300 / #FEFBF5 |
| Error text/background | #C91818 / #FEF4F4 |

Name tokens by role, for example `--color-text-primary`, not only by hex. The values above mirror the implementation tokens in `src/app/globals.css`; use the semantic role rather than adding near-duplicate neutrals. Status badges always include text. A selected background also needs a clear text/icon or structural selection cue.

## Website colour direction

Use white and light neutral backgrounds, dark text and subdued borders. Use dark primary purchase buttons with readable white labels. Purple is an admin interaction accent; do not automatically apply it across the editorial storefront. Status colours may share semantic meaning without sharing all surface styling.

## Spacing and shape

Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64px. Admin radii: 4px small elements, 8px controls, 12px cards, 16px modals and fully rounded pills. Standard controls are 44px high; dense desktop rows may be shorter when their interactive targets remain usable. Use subtle borders rather than excessive shadows. Modal elevation may use a restrained shadow and scrim.

## Product editor drawer cards (PEDIT pattern)

The product editor General tab uses a stacked card layout. Basic Information (including Description) is the first card, Pricing & stock is the second, Scheduled discounts is the third, Fulfillment & shipping is the fourth, and Attributes & values is the fifth. The Clothing Specs tab uses the same `DrawerCard` pattern; its four cards are documented in the Clothing Specs drawer cards section below. The card header and body are one shared `DrawerCard` pattern, not per-card markup.

- Drawer field: the product editor General and Clothing Specs tabs opt into `Drawer bodyTone="canvas"`. The body uses `--tuw-bg-canvas` (`#F7F8F9`), so white cards separate without a second neutral token or extra shadows. Other drawers and the not-yet-cardified product tabs (Media, Variants & Stock) keep the surface background until reviewed.
- Container: `DrawerCard` built on `SurfaceCard`; white surface, 12px radius, 1px `--tuw-border-subtle` border, no shadow, `overflow: hidden`, zero outer padding. Do not nest cards inside cards.
- Header: 16px padding, white by default. Title is the card-heading scale (18px/26px/600) using the `--tuw-type-heading-card-*` tokens; description is body-default (14px/22px/400) secondary text, 4px below. A full-bleed 1px `--tuw-border-subtle` divider separates header from body while expanded; a collapsed card has no internal divider.
- Header emphasis: neutral is the default. A `selected` or `warning` tone may tint the header with the matching semantic background and show an 8px semantic dot; use it only for a real selected or attention state, never to colour-code sections.
- Body: 16px padding, 14px column gap. Full-width fields for title, slug, and Description; paired fields use `repeat(auto-fit, minmax(180px, 1fr))` with a 12px gap, collapsing to one column below roughly 420px of content width.
- Controls: `Input` and `SearchableSelect` stay 44px high when paired in a card row. Basic Information uses `SearchableSelect` for Category, Gender and Publication status rather than a native `<select>`; Fulfillment & shipping uses it for Print partner and Print placement. The 40px `FormSelect` treatment remains for dense standalone drawer rows. Field labels inside a `DrawerCard` are 14px/600 primary, inherited from the card body; outside-card labels keep their legacy 13–14px/500 treatments. Basic Information keeps its required asterisks but carries no helper lines; the Style Code label owns its info hint. Pricing & stock pairs Base price with Compare-at price and Stock Quantity with Tax Rate, keeping the validation-dependent price pair adjacent; it also carries no helper lines. Compare-at guidance lives in its info hint and inline validation, while error text remains 12px/18px with generated ids wiring it to the control.
- Basic Information + Description: Description stays inside Basic as a full-width, 4-row `FormTextarea` after URL Slug. It is plain product copy with no independent lifecycle, so it does not get a one-field card. `FormTextarea` labels are linked to their controls with a generated `id`; the control uses 14px text and 10×12px padding inside the card. Style Code/Category and Gender/Publication status remain paired below it. Gender includes Female, Male, Unisex, Kids, Boy and Girl; Category options are derived from the base list plus any imported category.
- Pricing & stock: base price is required and text/decimal so money keystrokes stay clean; compare-at is optional and validated above the current selling price (base on create, lowest variant on edit); stock is the required total across variants; tax is optional and checkout-only; HSN/SAC is optional, 4–8 digits, strips non-digits while typing, and fails save with a warning toast while opening Pricing & stock when malformed. The collapsed card opens automatically when compare-at or HSN validation fails so the error is not hidden. Full scroll/focus handling remains the SHELL task.
- Workbook identity: Basic Information appends a quiet 12/18 line with the internal S.No only when a product came from a workbook row. It is display-only and never a form control. The line leaves the approved field pair alignment intact and does not add a helper line below any input.
- Scheduled discounts: card 3 uses flat bordered rows inside the card, not nested cards. Each row pairs Type (`SearchableSelect`) with Value and Starts with Ends, with a visible Active switch and a row-scoped remove target. Rows are labelled groups with unique field ids; removal returns focus to Add Discount. The header shows a neutral count badge only when rows exist, and the empty state states that the product uses its normal selling price. There are no helper lines. Switching to Percent clamps the value to 100. Date-window requiredness and `endsAt >= startsAt` validation remain a separate follow-up.
- Fulfillment & shipping: card 4 pairs Print partner with Print placement (`SearchableSelect`) and Weight with Shipping weight (`Input`), with Package dimensions full width. It carries no helper lines and no header badge. Weight, shipping weight, and dimensions are product-level defaults; an imported variant may carry a row-level override and falls back to these values when blank. They moved out of the Internal disclosure; that disclosure is removed, with internal-only attributes now grouped in card 5.
- Attributes & values: card 5 is a collapsible `DrawerCard` with a two-row action strip and two flat groups: Storefront and Internal only. Row 1 pairs the Link from library dropdown with a Manage library outline `LinkButton`; row 2 pairs new attribute name with Add. Rows are bordered groups, not nested cards; values render as wrapping chips with inline remove, swatch chips use the shared 20px circular `.tuw-color-swatch` input without hex text, and radio chips show a dot preview. The swatch class resets native input appearance and rounds both the control and the WebKit/Firefox inner swatch, with a visible focus ring. The display type is read-only from the linked library record (Pill / Color swatch / Radio select); unlinked legacy attributes fall back to Pill with an `Unlinked` warning. The old per-product display dropdown and value table are removed. Link/value add/remove, known-value picking, default-attribute protection, and product-local swatch colors remain; no helper lines.
- Expanded card layout: Compact view keeps the General cards in one column. Expanded matrix and Full canvas switch to two columns at 900px and above: cards 1+2, then 3+4, with card 5 spanning both columns. A 16px gap and top alignment keep collapsed cards from stretching, and `minmax(0, 1fr)` prevents overflow. Inside card 5, Storefront rows use a three-column attribute grid at the same breakpoint; Internal only always remains a separate group below, even when the Storefront row has an empty third slot. Below 900px everything stays one column. DOM order remains 1–5.
- Required fields: no card-level “Required” label or badge. Native controls keep `required`; custom comboboxes expose `aria-required`. Both show a quiet trailing `*` on their field label, and invalid states must remain visible without relying on colour alone.
- Collapse: product-editor cards are collapsible through `DrawerCard` and start collapsed. The heading/description area is one `h4 > button` with a trailing 18px chevron; optional badge/action stay outside the toggle. `aria-expanded`/`aria-controls` and a labelled `region` wire the body; Enter/Space toggle and closing returns focus to the header. The body mounts only while open, so collapsed fields are not tab stops, cannot trap native validation, and cannot leave a listbox open. Open state is controlled by the editor, survives tab switches, and resets when a product/create drawer opens.
- Header actions: optional badge/action align right on wide cards and wrap below on narrow ones; actions remain outside the collapse button. The chevron is rendered only for collapsible cards.
- Card rhythm: 16px between cards, 14px between fields, 16px inside header and body. No extra shadow. Expanded bodies mount with the shared 180ms `popoverIn` opacity fade; reduced motion follows the global rule.

## Clothing Specs drawer cards

Clothing Specs reuses the same `DrawerCard` stack and responsive contract as General:

- Cards: 1 Display options, 2 Clothing specifications, 3 Size chart, and 4 Monogram & custom embroidery. Card 4 mounts only while the Display options switch is on. Each card is independently collapsible, starts collapsed, resets when a create/edit drawer opens or closes, and keeps its open state across tab switches.
- Display options: the “Monogram & embroidery” switch continues to control whether the monogram card is shown; it stays a quiet single-control card so turning the monogram card off never hides the switch that brings it back.
- Clothing specifications: Fabric Composition & GSM, Cut & Silhouette, Model Dimensions, and Care & Wash Instructions. Size-chart assignment moved out to card 3. Fields use the card body rhythm and `repeat(auto-fit, minmax(180px, 1fr))` where paired.
- Size chart: the Associated Size Chart Template link, the Size Chart `DropdownMenu`, and the size-charts `Disclosure` live here. Size-chart entries are flat bordered groups inside the card, not nested cards; the measurement table scrolls horizontally inside its card when the column is narrow. Chart create, rename-free row add/remove, cell editing, and the “chart in use” guard are unchanged.
- Monogram & custom embroidery: the Offer monogramming switch, then Max Characters and Upcharge paired with the auto-fit grid while enabled.
- Expanded layout: Compact keeps one card per row. Expanded matrix and Full canvas switch to two columns at 900px and above, pairing 1+2 and 3+4 (Display options + Clothing specifications, then Size chart + Monogram & custom embroidery). `align-items: start` and `minmax(0, 1fr)` keep collapsed cards top-aligned and overflow-free; below 900px everything returns to one column. DOM order remains 1–4.

## Tooltip and label hints

Use a tooltip only for supplementary, non-blocking guidance. Do not hide validation, required instructions or essential copy inside a tooltip.

- Trigger: a 24px `InfoTooltip` button beside the label, with a 14px Lucide `Info` icon. Default icon colour is secondary text; hover/focus uses primary action. Keep a visible focus ring and `type="button"`. The card label row reserves 24px, so a hinted field keeps the same baseline as its paired field.
- Surface: white `--tuw-bg-surface`, 1px `--tuw-border-control` border, primary text, 12px/18px/500, 8px radius, 8px × 10px padding, maximum width 240px, `--shadow-popover` elevation. No arrow. Offset 8px from the trigger.
- Behaviour: hover opens after 120ms; keyboard focus opens immediately; tap toggles; Escape, outside click, scroll or resize closes. Top placement is preferred, with automatic bottom flip and viewport clamping. Portal the tooltip to `document.body` so drawer/card `overflow: hidden` never clips it. Reduced motion follows the global rule.
- Accessibility: the tooltip uses `role="tooltip"` with a unique id; the trigger gets `aria-describedby` and a descriptive `aria-label` such as “More information about Style Code”. The tooltip is not interactive and stays out of the tab order.
- Current use: Style Code in Basic Information and Compare-at price in Pricing & stock. The Compare-at hint explains the optional reference price and strike-through behaviour; the required “higher than selling price” validation remains inline, not hidden in the tooltip. Other fields use labels alone.

## Component states

Every interactive component needs default, hover, focus-visible, active, disabled and applicable loading states. Fields additionally support populated, required, invalid and read-only states. Focus must remain visible against adjacent surfaces. Disabled controls should explain why when the reason is not obvious.

## Layout and imagery

Website: editorial imagery, generous space, intentional catalog and consistent image ratios. Admin: compact information hierarchy, predictable alignment and visible operational statuses. Use licensed/local sample assets or clearly identified placeholders. Do not use another brand's marks or fabricate endorsements.

## Assets

V2 SVGs and the companion plugin are references for the admin foundations. Shared styles must be explicitly applied in code; SVG import alone does not create a functioning component library. Dark mode is outside this phase unless explicitly added later.
