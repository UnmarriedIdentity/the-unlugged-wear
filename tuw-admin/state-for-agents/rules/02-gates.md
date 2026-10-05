# Rule 02 — Verification Gates (inviolable)

No code commit lands unless every applicable gate passes on the final tree:

1. `pnpm --dir tuw-admin typecheck` — clean (`tsc --noEmit`).
2. `pnpm --dir tuw-admin test` — 4/4 (`node --test` business logic).
3. `pnpm --dir tuw-admin build` — all routes prerender.
4. Zero hex codes and zero `[...]` arbitraries in touched JSX lines
   (documented geometry exceptions only: Figma fractions, px art).
5. Every new utility proven present in `.next/static` production CSS at
   SELECTOR level (`\.util\{` escaped) — substring counts are invalid because
   token definitions contaminate them (this exact mistake once "proved"
   utilities that were never generated).
6. Screenshots vs production for affected states/routes at 360/1024/1440px.

## Good / bad

- ✅ `\.bg-auth-button` matched in built CSS + screenshot matrix attached.
- ❌ `bg-auth-button=1` via substring (matches nothing meaningful).
- ❌ Committing after typecheck alone ("build takes too long").

## Enforcement

Every work report must state: "gates: typecheck/test/build/css-proof/screenshots —
<pass details>". A report without it is incomplete.
