# Skill: Auth Token Refactor (Tailwind v4 + `@theme`)

Session skill for the pixel-perfect migration of auth CSS (`login-*`, `signup-*`)
to token utilities. Applies to every block pass until the auth surface is done.

## 1. Goal

Replace custom auth CSS with Tailwind v4 utilities backed by `@theme` tokens.
Zero hex codes and zero `[...]` arbitrary values in JSX/TSX. No visual delta
at 360px / 768px / 1024px / 1440px+. No dependency changes (AGENTS.md).

## 2. Naming convention — roles, not pages

Token grammar: `--<namespace>-auth-<role>[-<variant>]`.

- NEVER `login-` / `signup-` in a token name. Name the UI role (`button`,
  `line`, `input`, `check`), not the page that introduced it.
- One token per **value + role**. Same hex in two roles = two tokens (they
  diverge later). Same hex + same role across pages = one shared token.
- Page outlier = base name + suffix + `/* used by: <page/block> */` comment.
  Suffixes: `-hover`, `-active`, `-focus`, `-sm` (smaller), `-deep` (stronger),
  `-alt` (second outlier).
- Shared use is recorded in comments, never encoded in names.
- Auth (`--*-auth-*`) and admin (`--color-*`, `--radius-*`) tokens never
  cross-use. Admin palette stays on the 18-role V2 system.

## 3. Token taxonomy (`src/app/globals.css` → `@theme`)

| Namespace | Generates | Example |
|---|---|---|
| `--color-auth-<role>[-variant]` | `bg-*` / `text-*` / `border-*` | `--color-auth-button: #242424` → `bg-auth-button` |
| `--radius-auth-<role>` | `rounded-<role>` | `--radius-auth-social: 14px` |
| `--text-auth-<role>` + `--text-auth-<role>--line-height` | `text-<role>` (size + leading in one class) | `--text-auth-btn: 16px`, lh `22.4px` |
| `--tracking-auth-<role>` | `tracking-<role>` | `--tracking-auth-social: 0.14px` |
| `--container-auth-<role>` | `max-w-<role>` | `--container-auth-form: 568px` |
| `--spacing-auth-<role>` | `m-*` / `p-*` / `gap-*` (any CSS value, incl. `clamp()`) | `--spacing-auth-field-gap: clamp(16px, 2.2vh, 24px)` |
| `--shadow-auth-<role>` | `shadow-<role>` | OTP focus ring |
| Scale-native (no token needed) | bare multiples of `--spacing` | `h-13` = 52px, `px-3.5` = 14px, `h-4.5` = 18px, `gap-2.5` = 10px, `pb-17` = 68px |
| Framework tokens (allowed) | defaults | `bg-white`, `text-white`, `rounded-xl` (12px), `rounded-full`, `h-12`, `font-bold` |

Lucide icons: `color="currentColor"` + `className="text-<token>"` — never hex
props. Inline `style`: colors only as `var(--color-*)`; geometry stays until
its block pass. Figma canvas fractions (`49.444%` / `50.556%`) stay arbitrary —
exact math, not themeable.

## 4. Layer law (why login buttons once went invisible)

Tailwind v4 emits utilities into `@layer utilities`. ANY unlayered author CSS
beats them regardless of order. Rules:

- All global resets live in `@layer base`. Never write unlayered `button` / `*`
  resets touching `background` / `border` / `padding`.
- State overrides (`:hover`, error, active) use **ternary class swaps**
  (`active ? 'border-auth-teal' : 'border-auth-line'`), never additive
  same-property utilities (intra-layer order is not author-controlled).
- Never invent focus rings or hover states that never existed.

## 5. Block workflow (repeat per block)

1. Convert JSX `className`s → token utilities. IDs, handlers, state logic,
   copy (incl. typos), and `next/image` props stay untouched.
2. Delete replaced CSS; leave a migration comment naming removed selectors.
3. Gates (all must pass):
   - `grep #[hex]` = 0 and `grep \[...\]` = 0 in touched lines;
   - `pnpm --dir tuw-admin typecheck` clean;
   - `pnpm --dir tuw-admin test` 4/4;
   - `pnpm --dir tuw-admin build` 38/38 routes;
   - every new utility present in `.next/static` production CSS;
   - screenshots vs production for all `?state=` variants at 360/1024/1440px.
4. Commit exact paths only (`git add <files>` — NEVER `git add .` /
   `git commit -a`). Push `origin v2` only on explicit approval.
   `main` is never touched.

## 6. Standing exceptions (art, not system — keep, documented)

- `.login-heroOverlay`: 5-stop 511px fade (no utility equivalent).
- Form radial washes: one `bg-[radial-gradient(...),radial-gradient(...)]`.
- `Password comparisson failed` typo preserved verbatim.

## 7. Forbidden

- Downgrading any dependency (AGENTS.md §1).
- Touching `tuw-website/`, committing CRLF-only noise or unrelated leftovers.
- Bulk file rewrites / unzipping old backups over the tree.
- Committing without the §5 gates green.
