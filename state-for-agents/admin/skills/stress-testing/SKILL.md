# Skill: Stress Testing — Admin UI (try to break every workspace screen)

Global authority for admin UI tests. Staff screens handle money and stock,
so tests aim to break them: portals, bulk actions, races between staff,
huge tables. A screen is not done until its break-it checks pass. Backend
attacks: `state-for-agents/backend/skills/stress-testing`.

## How to run them

1. Pure logic (pricing ladder, import grouping, status maps): `node --test`
   in `tuw-admin/tests`.
2. Real browser flows: Playwright (being added — TL-BE-17.08); until then
   drive the built page in the browser pane at 1024 / 1440 px (+ 768 px).
3. Run against `next build && next start`.
4. Record each attack in the task log with its result.

## Edge-case catalog

| Area | Attacks |
|---|---|
| Portals (drawers, modals, tooltips, search spotlight, notification panel, date pickers) | `Esc` closes the top layer only; focus trapped and restored; nested modal inside a drawer; tooltip near the viewport edge flips; spotlight `⌘K` while a modal is open; open/close 50× (no leaked nodes or listeners); route change with a drawer open |
| Tables | 0 rows, 1 row, 10 000 rows (pagination, no freeze); 300-char customer name; sort + filter + page together; filter that matches nothing; select-all then filter |
| Bulk / destructive actions | double-click "Refund" / "Cancel" (one request); confirm dialog dismissed by `Esc`; two staff change one order (second sees the conflict message); action fails → drawer keeps every typed value |
| Permissions | support user opens a refund URL directly; buttons hidden **and** the action rejected; session expires mid-form |
| Forms | price 0, negative, `1e9`, 3 decimals; CSV import with BOM, CRLF, empty rows, 10 000 rows, duplicate SKUs, wrong encoding |
| Network | slow 3G; offline during save; save succeeds after the client timed out (no duplicate) |
| Layout | 768 px sidebar collapse; 200 % zoom; longest Indian address in a drawer |
| Accessibility | keyboard through every table action; labelled icon buttons; visible focus |
| Hydration | no mismatch warnings; Suspense skeletons the same size as cards |

## Good / bad

- ✅ Refund drawer: double-click "Refund" → one refunds row, button shows pending.
- ❌ One click on a refund with a perfect mock order.
- ✅ Orders table with 10 000 rows paginates and filters in < 200 ms interaction.
- ❌ Testing only with 12 fixture orders.

Related: `performance-budgets`, `client-components`, `server-actions` (backend).
