# Skill: Stylesheet Anatomy (`globals.css`)

Global authority for what lives in `tuw-admin/src/app/globals.css` — the ONLY
css file (imported once in `src/app/layout.tsx`; never create a second one).

## Current contents (high level)

1. `@import "tailwindcss"` + `@theme` (admin 18-role tokens, auth namespace,
   nav tokens, radii, type, tracking, containers, spacing, shadows).
2. `:root` legacy aliases (being reconciled — see theme-tokens conformance).
3. `@layer base` resets (see cascade-layers).
4. Retained custom CSS: pseudo-element systems (nav stems/curves/overlays),
   `100dvh` fallback stacks, hidden scrollbars, keyframes, bezier curves,
   art gradients (hero overlay, form washes).
5. `sub-*` shared page styles, `home-*` content classes, `signup-*/login-*`
   remnants being migrated, each deletion leaving a migration comment naming
   removed selectors.

## When custom CSS is allowed

Pseudo-elements, `calc()` geometry, keyframes, `100dvh` order, hidden
scrollbars, cubic-bezier motion, multi-stop art gradients. Everything else
must be a utility. Every deletion leaves a `/* Removed: … */` comment.

## Good / bad

- ✅ Keeping `.navTree::before` (no utility draws pseudos).
- ❌ New `.myWidget` layout class (use utilities).
- ✅ Migration comment listing removed selectors + consuming component.
- ❌ Silent deletion (future agents can't trace it).
