# Skill: Stylesheet Anatomy (`globals.css`)

Global authority for what lives in `tuw-website/src/app/globals.css` — the ONLY
css file (imported once in `src/app/layout.tsx`; never create a second one
until it exceeds 500 lines, per its own header).

## Current contents (high level)

1. `@import "tailwindcss"` + `@theme` (store tokens: `brand`, `accent`,
   `store-*` roles, radii, type, shadows).
2. `:root` legacy aliases (`--tuw-store-*` duplicates, spacing scale,
   control height).
3. `@layer base` resets (see cascade-layers).
4. Retained custom CSS: type utilities (`.tuw-type-*`), `.tuw-tabular-nums`,
   `.no-scrollbar`, `.clamp-2`, keyframes, reduced-motion reset.

## When custom CSS is allowed

Pseudo-elements, `calc()` geometry, keyframes, hidden scrollbars,
cubic-bezier motion, multi-stop art gradients, line clamps. Everything else
must be a utility. Every deletion leaves a `/* Removed: … */` comment.

## Good / bad

- ✅ Keeping a `::before` overlay a utility cannot draw.
- ❌ New `.myWidget` layout class (use utilities).
- ✅ Migration comment listing removed selectors + consuming component.
- ❌ Silent deletion (future agents can't trace it).
