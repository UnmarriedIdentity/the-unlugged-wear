# Skill: Cascade Layers (Tailwind v4 `@layer`)

Global authority for beating — and never losing to — the CSS cascade in
`tuw-admin`.

## Law

Tailwind v4 emits utilities into `@layer utilities`. **ANY unlayered author CSS
beats them regardless of source order.** Consequences:

1. All global resets live in `@layer base`. Never write unlayered `button` /
   `*` resets touching `background` / `border` / `padding` (an unlayered
   `button { background: none }` once made every migrated login button
   invisible — white text on transparent).
2. Component CSS being migrated is deleted, not layered — utilities then apply
   unopposed. Legacy unmigrated classes stay unlayered (they keep working).
3. Preflight (`@layer base`) already zeroes margins/padding on standard
   elements — do not re-reset what it owns.

## Good / bad

- ✅ `@layer base { button { font-family: inherit; cursor: pointer; } }`.
- ❌ `button { border: none; background: none; }` unlayered (kills all `bg-*`).
- ✅ Deleting `.login-primaryButton` when its JSX moves to utilities.
- ❌ Keeping the old class "just in case" (it would still beat utilities).

## Case log

- Login buttons invisible (white-on-transparent): unlayered reset vs utilities.
- Checked/error fills missing: same-layer additive conflict (see ternary rule).
- Black 1px borders site-wide: `border-subtle`-style short utilities that were
  never generated fell back to dark `currentColor`.
