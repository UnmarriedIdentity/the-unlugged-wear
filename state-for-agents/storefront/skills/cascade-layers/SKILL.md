# Skill: Cascade Layers (Tailwind v4 `@layer`)

Global authority for beating — and never losing to — the CSS cascade in
`tuw-website`.

## Law

Tailwind v4 emits utilities into `@layer utilities`. **ANY unlayered author CSS
beats them regardless of source order.** Consequences:

1. All global resets live in `@layer base`. Never write unlayered `button` /
   `*` resets touching `background` / `border` / `padding`.
2. Component CSS being migrated is deleted, not layered — utilities then apply
   unopposed. Legacy unmigrated classes stay unlayered (they keep working).
3. Preflight (`@layer base`) already zeroes margins/padding on standard
   elements — do not re-reset what it owns.

## Good / bad

- ✅ `@layer base { button { font-family: inherit; cursor: pointer; } }`.
- ❌ `button { border: none; background: none; }` unlayered (kills all `bg-*`).
- ✅ Deleting a legacy class when its JSX moves to utilities.
- ❌ Keeping the old class "just in case" (it would still beat utilities).

## Case log

- (Seed: first cascade incident lands here with route + evidence.)
