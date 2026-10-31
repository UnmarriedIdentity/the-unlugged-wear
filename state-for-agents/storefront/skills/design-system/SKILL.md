# Skill: Design System (storefront)

Global authority for look-and-feel sources of truth in `tuw-website`.

> **PROVISIONAL — Figma pending.** Values below are working examples from the
> current tokens and docs, NOT finalized. When Figma references land, update
> this skill first (per skill-maintenance), then retokenize. Nothing here
> finalizes a color, radius, or type size.

## Sources

- `tuw-website/docs/DESIGN_SYSTEM.md` (storefront system) + `COMPONENTS.md`.
- Storefront (working values): warm ivory canvas `#FAF9F6`, charcoal type
  `#1A1A1A`, dark purchase CTAs `#111111`, refined gold accents `#C8A96A`.
- Calm editorial slow-living luxury: generous whitespace, quiet surfaces,
  restrained motion. Type utilities `.tuw-type-*`; tabular figures
  `.tuw-tabular-nums`; clamps `.clamp-2`.

## Rules

- Tone: zero discount banners, countdowns, urgency, or fabricated reviews.
- Admin purple never appears on storefront purchase buttons (separate app).
- New values come from Figma first; near-duplicates stay verbatim with
  suffixed tokens until Figma rules.
- Fictitious demo identities only (`@example.com`, Indian mobiles).

## Homepage type roles (size and weight only)

Authority: `docs/DESIGN_SYSTEM.md` → "Storefront homepage type roles". Weight
and size only — colour, letter spacing, spacing, borders and radii never move
under this heading.

| Role | Size | Weight |
|---|---|---|
| Section H2 | `text-[clamp(1.75rem,4vw+0.5rem,3rem)]` (28–48px) | 500 |
| Section eyebrow | `text-base` (16px) | 500 |
| Product card name | `text-lg @[22rem]:text-xl` (card-width container query) | 500 |
| Product card price | `text-base` + `tuw-tabular-nums` | 400 |
| Fitting room name / price | `text-base` (+ `tuw-tabular-nums`) | 500 |
| Editorial card title | `text-lg` | 600 |
| Card body | `text-base` | 400 |
| Section description | 16px, 18px or 16→20px as chosen per section | 400 |
| CTA label | `text-xs` (14px Stratosphere CTA) | 500 (600 emphasis/Stratosphere) |
| Meta | `text-xs` | 400 |
| Hero display / subtitle | 28–40px, 14px | 400 / 300 |
| Footer signature | brand mark | 900 exception |

- Allowed weights are 300, 400, 500, 600 and 900 (signature only). Homepage
  sections contain no `font-bold` or `font-extrabold`.
- `.philosophy-headline` (Playfair Display, 40–80px/400) is a display
  exception pending a font-family decision.
- Guarded by `tests/homepage-typography.test.mjs`.

## Good / bad

- ✅ Sourcing a new radius from the Figma frame, then tokenizing it.
- ❌ Eyeballing a hex "close enough" to a store token.
- ✅ Dark `#111111` purchase CTA with gold accent kept distinct.
- ❌ Unifying two 1-digit-different values to "simplify".
