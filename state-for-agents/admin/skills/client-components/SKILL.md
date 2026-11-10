# Skill: Client Components (editors, drawers, filters — leaves only)

Global authority for `'use client'` in `tuw-admin`. Interactive tools are
client leaves inside server-rendered pages.

## When to use one

1. Editing and interaction: product editor, variant pricing grid, status
   dropdowns, drawers/modals, date-range pickers, drag-and-drop ordering,
   chart hover, CSV upload progress.
2. Hooks (`useState`, `useActionState`, `useOptimistic`) or browser APIs.
3. Tables, cards, headers and read-only detail views stay Server Components.

## Rules

1. `'use client'` goes on the smallest file that needs it; it imports no
   data or server code (everything imported joins the bundle).
2. Data comes in as props; writes go through Server Actions guarded by a
   permission (`updateOrderStatusAction`).
3. Server-rendered content goes in as `children`
   (`<OrderDrawer><OrderTimeline id={id}/></OrderDrawer>`).
4. The staff member reaches client code through a `StaffProvider` fed an
   un-awaited promise (`use()`), placed around `{children}`, not `<html>`.
5. Forms keep every typed value on failure (`useActionState` returns field
   errors); pending buttons show progress, never a dead click.

## Good / bad

- ✅ Orders table is server-rendered; only `<StatusSelect>` per row is client.
- ❌ `'use client'` on the whole orders page to make one dropdown work.
- ✅ Status change uses `useOptimistic`, then the action's `updateTag` confirms.
- ❌ Client `fetch('/api/orders')` polling to refresh the table.

Related: `server-components`, `server-actions` (backend skills), `component-scalability`.
