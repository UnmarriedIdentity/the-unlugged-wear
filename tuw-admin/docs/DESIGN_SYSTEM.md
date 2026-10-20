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

The product editor General tab uses a stacked card layout. Basic Information is the first card. The card header and body are one shared `DrawerCard` pattern, not per-card markup.

- Drawer field: the product editor General tab opts into `Drawer bodyTone="canvas"`. The body uses `--tuw-bg-canvas` (`#F7F8F9`), so white cards separate without a second neutral token or extra shadows. Other drawers and the not-yet-cardified product tabs keep the surface background until reviewed.
- Container: `DrawerCard` built on `SurfaceCard`; white surface, 12px radius, 1px `--tuw-border-subtle` border, no shadow, `overflow: hidden`, zero outer padding. Do not nest cards inside cards.
- Header: 16px padding, white by default. Title is the card-heading scale (18px/26px/600) using the `--tuw-type-heading-card-*` tokens; description is body-default (14px/22px/400) secondary text, 4px below. A full-bleed 1px `--tuw-border-subtle` divider separates header from body.
- Header emphasis: neutral is the default. A `selected` or `warning` tone may tint the header with the matching semantic background and show an 8px semantic dot; use it only for a real selected or attention state, never to colour-code sections.
- Body: 16px padding, 14px column gap. Full-width fields for title and slug; paired fields use `repeat(auto-fit, minmax(180px, 1fr))` with a 12px gap, collapsing to one column below roughly 420px of content width.
- Controls: `Input` and `FormSelect` stay 44px high when paired in a card row; the 40px `FormSelect` treatment remains for dense standalone drawer rows. Labels are 13px/500 primary; helper and error text are 12px/18px secondary/error, with generated ids wiring helper copy to the control.
- Required fields: no card-level “Required” label or badge. Required controls keep native `required` and show a quiet trailing `*` on their field label; invalid states must remain visible without relying on colour alone.
- Header actions: optional badge/action align right on wide cards and wrap below on narrow ones. A chevron or collapse control is not rendered until collapsing actually works (PEDIT-SHELL); no dead affordances.
- Card rhythm: 16px between cards, 14px between fields, 16px inside header and body. No extra shadow or collapsible behaviour in this slice.

## Component states

Every interactive component needs default, hover, focus-visible, active, disabled and applicable loading states. Fields additionally support populated, required, invalid and read-only states. Focus must remain visible against adjacent surfaces. Disabled controls should explain why when the reason is not obvious.

## Layout and imagery

Website: editorial imagery, generous space, intentional catalog and consistent image ratios. Admin: compact information hierarchy, predictable alignment and visible operational statuses. Use licensed/local sample assets or clearly identified placeholders. Do not use another brand's marks or fabricate endorsements.

## Assets

V2 SVGs and the companion plugin are references for the admin foundations. Shared styles must be explicitly applied in code; SVG import alone does not create a functioning component library. Dark mode is outside this phase unless explicitly added later.
