# Skill: Theme Tokens (`@theme`)

Global authority for design-token naming, declaration, and reuse in
`tuw-admin/src/app/globals.css` (`@theme` block).

## Grammar

`--<namespace>-<system>-<role>[-<variant>]` where system is `tuw` (admin V2)
or `auth` (Storeflow auth). Admin canonical form stays `--color-<role>` /
`--radius-<role>` / `--text-<role>` (18-role V2 system).

- NEVER a page name (`login-`, `signup-`, `home-`) in a token name. Name the UI
  role (`button`, `line`, `input`, `check`), not the page that introduced it.
- One token per **value + role**. Same hex in two roles = two tokens (they
  diverge later). Same hex + same role across pages = one shared token.
- Page outlier = base name + suffix (`-hover`, `-active`, `-focus`, `-sm`,
  `-deep`, `-alt`, `-subtle`) + `/* used by: <page/block> */` comment.
- Shared use is recorded in comments, never encoded in names.
- Auth (`--*-auth-*`) and admin tokens never cross-use.

## Taxonomy

| Namespace | Generates | Example |
|---|---|---|
| `--color-<sys>-<role>[-variant]` | `bg-*` / `text-*` / `border-*` | `--color-auth-button: #242424` → `bg-auth-button` |
| `--radius-<sys>-<role>` | `rounded-<role>` | `--radius-auth-social: 14px` |
| `--text-<sys>-<role>` + `--text-<sys>-<role>--line-height` | `text-<role>` (size + leading) | `--text-auth-btn: 16px`, lh `22.4px` |
| `--tracking-<sys>-<role>` | `tracking-<role>` | `--tracking-auth-social: 0.14px` |
| `--container-<sys>-<role>` | `max-w-<role>` | `--container-auth-form: 568px` |
| `--spacing-<sys>-<role>` | `m-*` / `p-*` / `gap-*` (any value, incl. `clamp()`) | `--spacing-auth-field-gap: clamp(16px,2.2vh,24px)` |
| `--shadow-<sys>-<role>` | `shadow-<role>` | OTP focus ring |

## Declare vs reuse

Before declaring: grep the token file for the value AND the role. Value exists
under another role → still declare (roles diverge). Role exists with another
value → new suffixed token. Neither exists → declare per grammar.

## Conformance

Any token outside the grammar gets a reconciliation entry
(old → new → reference migration → deletion). Never write new code against a
non-conforming token. Compatibility aliases (`--color-primary` etc.) are
documented at definition and preferred over renaming call sites.

## Good / bad

- ✅ `bg-auth-button` for `#242424` button fills on login, signup, and recovery.
- ❌ `var(--brand-teal)` — pre-V2 name; use `var(--color-action-primary)`.
- ✅ New `--color-nav-guide-active: #c4c4c4` with `/* stem-to-active segments */`.
- ❌ New `--color-auth-line2: #E9E9E9` duplicating `auth-line` — reuse instead.
- ✅ `--text-auth-lead` shared by heroSubtitle + formSubtitle (identical 20/28 spec).
- ❌ `--tuw-color-*` mirroring `--tuw-*` 1:1 — deleted, never reintroduced.
