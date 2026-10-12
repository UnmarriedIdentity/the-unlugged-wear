# Skill: Theme Token Refactor (Tailwind v4 + `@theme`) — GLOBAL

Applies to the whole `tuw-admin` frontend: auth (`login-*`, `signup-*`),
primitives, `sub-*` pages, and shell chrome. The auth passes piloted it;
everything below is the global rule from here on.

## 1. Goal

Replace custom CSS with Tailwind v4 utilities backed by `@theme` tokens.
Zero hex codes and zero `[...]` arbitrary values in JSX/TSX (art exceptions in
§6 only). No visual delta at 360px / 768px / 1024px / 1440px+. No dependency
changes (AGENTS.md §1).

## 2. Naming convention — roles, not pages

Token grammar: `--<namespace>-<system>-<role>[-<variant>]`, where system is
`tuw` (admin V2) or `auth` (Storeflow auth). Admin canonical form stays
`--color-<role>` / `--radius-<role>` / `--text-<role>` (18-role V2 system).

- NEVER a page name (`login-`, `signup-`, `home-`) in a token name. Name the UI
  role (`button`, `line`, `input`, `check`), not the page that introduced it.
- One token per **value + role**. Same hex in two roles = two tokens (they
  diverge later). Same hex + same role across pages = one shared token.
- Page outlier = base name + suffix + `/* used by: <page/block> */` comment.
  Suffixes: `-hover`, `-active`, `-focus`, `-sm` (smaller), `-deep` (stronger),
  `-alt` (second outlier), `-subtle`.
- Shared use is recorded in comments, never encoded in names.
- Auth (`--*-auth-*`) and admin tokens never cross-use.
- **Conformance rule:** any token outside this grammar gets a reconciliation
  entry (old → new → reference migration → deletion). Never write new code
  against a non-conforming token.

## 3. Token taxonomy (`src/app/globals.css` → `@theme`)

| Namespace | Generates | Example |
|---|---|---|
| `--color-<sys>-<role>[-variant]` | `bg-*` / `text-*` / `border-*` | `--color-auth-button: #242424` → `bg-auth-button` |
| `--radius-<sys>-<role>` | `rounded-<role>` | `--radius-auth-social: 14px` |
| `--text-<sys>-<role>` + `--text-<sys>-<role>--line-height` | `text-<role>` (size + leading in one class) | `--text-auth-btn: 16px`, lh `22.4px` |
| `--tracking-<sys>-<role>` | `tracking-<role>` | `--tracking-auth-social: 0.14px` |
| `--container-<sys>-<role>` | `max-w-<role>` | `--container-auth-form: 568px` |
| `--spacing-<sys>-<role>` | `m-*` / `p-*` / `gap-*` (any CSS value, incl. `clamp()`) | `--spacing-auth-field-gap: clamp(16px,2.2vh,24px)` |
| `--shadow-<sys>-<role>` | `shadow-<role>` | OTP focus ring |
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
  Ternaries must enumerate ALL state-varying properties INCLUDING `bg-*`:
  a base `bg-white` plus a conditional second bg is a silent conflict
  (white sorts last — checked/error fills never appear), not an override.
- Never invent focus rings or hover states that never existed.

## 5. Examples (wrong → right)

- ❌ `style={{ color: '#E94845' }}` → ✅ `className="text-auth-error"`
- ❌ `var(--brand-teal)` → ✅ `var(--color-action-primary)`, then `bg-action-primary`
- ❌ `var(--tuw-status-danger, #EF4444)` (ghost: undefined token) → ✅ define
  `--color-status-danger` per §2, then `text-status-danger`
- ❌ `border-radius: 6px` one-off (Pagination) → ✅ `rounded-control` (8px, after
  design sign-off) — or a `--radius-<sys>-<role>` token if owned elsewhere
- ❌ `className="flex h-[52px] … border-[#E9E9E9]"` → ✅ `className="flex h-13 …
  border-auth-line"` (scale-native + role token)
- ❌ `color="#009E5C"` on `<CircleCheck>` → ✅ `color="currentColor"`
  `className="text-auth-success"`
- ❌ additive `border-auth-line ${active && 'border-auth-teal'}` → ✅ ternary
  `${active ? 'border-auth-teal' : 'border-auth-line'}`
- ❌ unlayered `button { border: none; background: none }` → ✅ `@layer base`
  scoped reset (see §4)

## 6. Block workflow (repeat per block)

1. Convert JSX `className`s → token utilities. IDs, handlers, state logic,
   copy (incl. typos), and `next/image` props stay untouched.
2. Delete replaced CSS; leave a migration comment naming removed selectors.
3. Gates (all must pass):
   - `grep #[hex]` = 0 and `grep \[...\]` = 0 in touched lines;
   - `pnpm --dir tuw-admin typecheck` clean;
   - `pnpm --dir tuw-admin test` 4/4;
   - `pnpm --dir tuw-admin build` (38 routes);
   - every new utility present in `.next/static` production CSS, proven at
     SELECTOR level (`\.util\{` escaped — substring counts are invalid in a file
     containing token definitions, e.g. `border-subtle` matches
     `--color-border-subtle`; short names like `bg-primary`/`text-primary`
     generate NOTHING unless a matching `--color-*` token exists — add a
     documented compatibility alias instead of renaming call sites);
   - screenshots vs production for all `?state=` variants at 360/1024/1440px.
4. Update the JSON tracker (status/log/design_match/key_decisions/verified/
   finished + summary counts) in the SAME commit as the block.
5. Commit exact paths only (`git add <files>` — NEVER `git add .` /
   `git commit -a`). Push `origin v2` only on explicit approval.
   `main` is never touched.

## 7. Standing exceptions (art, not system — keep, documented)

- `.login-heroOverlay`: 5-stop 511px fade (no utility equivalent).
- Form radial washes: one `bg-[radial-gradient(...),radial-gradient(...)]`.
- `Password comparisson failed` typo preserved verbatim.

## 8. Forbidden

- Downgrading any dependency (AGENTS.md §1).
- Touching `tuw-website/`, committing CRLF-only noise or Bucket-B leftovers.
- Bulk file rewrites / unzipping old backups over the tree.
- Committing without the §6 gates green.
