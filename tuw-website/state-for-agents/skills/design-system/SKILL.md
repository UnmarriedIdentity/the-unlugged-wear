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

## Good / bad

- ✅ Sourcing a new radius from the Figma frame, then tokenizing it.
- ❌ Eyeballing a hex "close enough" to a store token.
- ✅ Dark `#111111` purchase CTA with gold accent kept distinct.
- ❌ Unifying two 1-digit-different values to "simplify".
