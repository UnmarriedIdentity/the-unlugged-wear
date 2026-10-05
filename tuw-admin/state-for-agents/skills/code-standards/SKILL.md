# Skill: Code Standards (TS/React in admin UI)

Global authority for how component code is written in `tuw-admin`.

## Rules

- `cn()` for every conditional class list; ternaries over `&&` for
  same-property state pairs; `aria-hidden` + `aria-label` on icon-only
  controls; `key` on mapped children; `alt` + explicit dimensions on images.
- Lucide icons: `color="currentColor"` + `className="text-<token>"`; size via
  props (`size={17}`); decorative SVGs get `stroke="currentColor"` with
  presentation attributes as props.
- No dead props (declared-but-unrendered), no unused imports (e.g. importing
  `Button` without rendering it), no `useState` initializers that read the
  browser (hydration rule — initialize deterministically, sync in effects).
- Collapsed/mobile variants must preserve information (icons reappear,
  tooltips via `title`) — never render empty interactive boxes.
- Preserve behavior on conversion: OTP auto-advance/paste/Backspace,
  `inputMode`/`maxLength`, `autoComplete`, `noValidate`, alert copy, focus
  order, input retention on failed submit.

## Good / bad

- ✅ `{isCollapsed ? <Icon/> : <Spacer/>}` (collapsed stays usable).
- ❌ Unconditionally removing icons (collapsed rows go empty).
- ✅ `title={isCollapsed ? 'Dashboard' : undefined}` preserving tooltips.
- ❌ `import { Button }` in a file that never renders it.
