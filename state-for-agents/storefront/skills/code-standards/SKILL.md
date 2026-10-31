# Skill: Code Standards (TS/React in storefront UI)

Global authority for how component code is written in `tuw-website`.

## Rules

- `cn()` for every conditional class list; ternaries over `&&` for
  same-property state pairs; `aria-hidden` + `aria-label` on icon-only
  controls; `key` on mapped children; `alt` + explicit dimensions on images.
- Lucide icons: `color="currentColor"` + `className="text-<token>"`; size via
  props; decorative SVGs get `stroke="currentColor"` with presentation
  attributes as props.
- No dead props (declared-but-unrendered), no unused imports, no `useState`
  initializers that read the browser (hydration rule — initialize
  deterministically, sync in effects).
- Mobile variants must preserve information — never render empty interactive
  boxes (icons reappear, tooltips via `title`).
- Preserve behavior on conversion: auth input behavior, `inputMode`,
  `autoComplete`, `noValidate`, focus order, and input retention on failed
  submit (root AGENTS.md §5 — demo failures must never wipe typed input).

## Good / bad

- ✅ Mobile menu trigger keeps its label for screen readers when collapsed.
- ❌ Unconditionally removing icons (collapsed rows go empty).
- ✅ Failed demo checkout keeps every typed field intact.
- ❌ `import { Button }` in a file that never renders it.
