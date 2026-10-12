# Skill: Theme Tokens (`@theme`)

Global authority for design-token naming, declaration, and reuse in
`tuw-website/src/app/globals.css` (`@theme` block).

> **PROVISIONAL — Figma pending.** Palettes below are working examples, NOT
> finalized values. When Figma references land, update this skill first
> (per skill-maintenance), then retokenize. Never present these numbers as
> final to a reviewer.

## Grammar

`--<namespace>-<system>-<role>[-<variant>]` where system is `store`
(storefront). Working form: `--color-<role>` / `--radius-<role>` /
`--text-<role>` over the store roles (`brand`, `accent`, `store-canvas`,
`store-surface`, `store-text-*`, `store-border`, `store-action-*`).

- NEVER a page name (`shop-`, `cart-`, `pdp-`) in a token name. Name the UI
  role (`button`, `line`, `input`, `price`), not the page that introduced it.
- One token per **value + role**. Same hex in two roles = two tokens (they
  diverge later). Same hex + same role across pages = one shared token.
- Page outlier = base name + suffix (`-hover`, `-active`, `-focus`, `-sm`,
  `-deep`, `-alt`, `-subtle`) + `/* used by: <page/block> */` comment.
- Shared use is recorded in comments, never encoded in names.
- Admin purple (`#7539FF`) must never enter storefront tokens — purchase
  buttons stay dark per root AGENTS.md §3.

## Declare vs reuse

Before declaring: grep the token file for the value AND the role. Value exists
under another role → still declare (roles diverge). Role exists with another
value → new suffixed token. Neither exists → declare per grammar.

## Conformance

Any token outside the grammar gets a reconciliation entry
(old → new → reference migration → deletion). Never write new code against a
non-conforming token.

## Good / bad

- ✅ `bg-store-surface` for card fills on shop, PDP, and journal cards.
- ❌ `var(--brand-teal)` — pre-system name; use the role token.
- ✅ New `--color-store-guide-active` with `/* used-by comment */`.
- ❌ New `--color-store-line2` duplicating `store-line` — reuse instead.
