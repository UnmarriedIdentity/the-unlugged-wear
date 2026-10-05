# Skill: Design System (admin V2 + auth)

Global authority for look-and-feel sources of truth in `tuw-admin`.

## Sources

- Figma file `WmpPcdGcXerVgqNpgr6Q6S` (V2 Urbanist); exported SVGs in
  `tuw-admin/design/`; `tuw-admin/docs/DESIGN_SYSTEM.md` (18-role color system).
- Admin: Urbanist everywhere (single `@theme` stack), canvas `#F7F8F9`,
  action purple `#7539FF`, control radius `8px`, card `12px`, modal `16px`.
- Auth (Storeflow): ink `#242424`, teal `#115D5D`, line `#E9E9E9`, dark buttons
  (`12px` login / `10px` signup / `14px` social), OTP lime line.
- Nav chrome: ink text `#111827`, guides `#dddddd`→`#c4c4c4`, active edge
  `inset 0 -2px 0 #d6d6d6`, dock `#0F0F12`.

## Rules

- Tone: zero discount banners, countdowns, urgency, or fabricated reviews.
- Admin purple never appears on storefront purchase buttons (separate app).
- New values come from Figma first; near-duplicates (`#E7EEEE` vs `#E7EFEF`,
  `5px` vs `6px`, hover `#000` vs `#141414`) stay verbatim with suffixed tokens.
- Fictitious demo identities only (`@example.com`, Indian mobiles).

## Good / bad

- ✅ Sourcing a new radius from the Figma frame, then tokenizing it.
- ❌ Eyeballing `#EAEAEA` "close enough" to `auth-line`.
- ✅ Keeping `submitButton:hover #000000` distinct from login `#141414`.
- ❌ Unifying two 1-digit-different values to "simplify".
