# Skill: Stress Testing — Storefront UI (try to break every screen)

Global authority for storefront UI tests. The goal is to break the screen
— portals, forms, slow networks, odd data — not to confirm the happy path.
A screen is not done until its break-it checks pass. Backend attacks:
`state-for-agents/backend/skills/stress-testing`.

## How to run them

1. Pure logic (totals, variant keys, validators, formatters): `node --test`
   in `tuw-website/tests`.
2. Real browser flows: Playwright (being added — TL-BE-17.08); until then
   drive the built page in the browser pane at 360 / 768 / 1024 / 1440 px.
3. Run against `next build && next start`, never only `next dev`.
4. Record each attack in the task log with its result.

## Edge-case catalog

| Area | Attacks |
|---|---|
| Portals (cart drawer, modals, size guide, toasts, menus) | open → `Esc` closes and focus returns to the trigger; `Tab` never leaves the open dialog; page behind does not scroll; open two (drawer + toast + modal) — stacking and `aria-modal` stay right; navigate while open (no orphan overlay, scroll lock released); back button closes it; open at 360 px with the keyboard up; open/close 30× fast (no leaked listeners, no duplicated nodes) |
| Hidden routes (Cache Components `<Activity>`) | go PDP → cart → back: drawer and form state are deliberately reset or kept, never half-open; stale cart count after an action in another tab |
| Forms (checkout, login, contact, returns) | double-click submit (one request); submit with JS disabled (form still posts); server error → every typed value kept; paste 10 000 chars; emoji / RTL names; autofill; invalid PIN code; Indian phone with +91, spaces, 0-prefix |
| Network | slow 3G, offline mid-submit, request succeeds after a client timeout, action replay after deploy ("Failed to find Server Action" shows a retry) |
| Data | 0 products, 1 product, 500 products; title 200 chars; missing image; price ₹0; out-of-stock every size; collection with no products; journal with no articles |
| Layout | 360 px with longest name + 3XL size; 200 % browser zoom; dark-mode OS setting; `prefers-reduced-motion`; RTL text in a card |
| Accessibility | keyboard only through PDP → bag → checkout; screen-reader names on icon buttons; focus ring visible on every control; colour contrast ≥ 4.5:1 |
| Hydration | no "text content does not match" warnings; no `Date`/`Math.random` during render; Suspense fallbacks the same size as content (no CLS) |
| Multi-tab | bag changed in tab A while tab B checks out; logout in one tab |

## Good / bad

- ✅ Cart drawer test: open → `Tab` ×20 stays inside → `Esc` → focus back on the bag icon.
- ❌ "Drawer opens" screenshot as the only test.
- ✅ Checkout double-submit produces one order and one toast.
- ❌ Testing only with the demo fixtures' perfect data.

Related: `performance-budgets`, `seo`, `client-components`, `server-actions` (backend).
