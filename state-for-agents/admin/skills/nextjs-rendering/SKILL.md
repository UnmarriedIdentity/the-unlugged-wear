# Skill: Next.js Rendering Map (which part of each admin page is shell or hole)

Global authority for how each admin route splits into a prerendered shell
and streamed holes. Detail lives in `server-components`,
`client-components` and `cache-components`; this skill is the map.
Next.js 16.3.8 differs from older versions — read
`node_modules/next/dist/docs/` before using an unfamiliar API.

## Rules

1. Chrome (sidebar, header, page title, card frames) is the shell and paints
   instantly; staff data streams in.
2. One `<Suspense>` per card or table, with a same-size skeleton, so a slow
   query never blocks the rest of the page.
3. No session read in the layout; role-gated menu items stream in their own
   Suspense.
4. Sidebar `<Link>`s use the default prefetch; never `prefetch={true}` on
   hundreds of table rows.
5. Every data-backed route has its **own** boundary (`loading.tsx` in its
   folder, or `<Suspense>` in its page). A `loading.tsx` above sibling routes
   (e.g. `/settings/*` tabs) is already mounted when you move between them,
   so the navigation blocks and dev logs "uncached data … navigation".

## Route map

| Route | Shell | Holes |
|---|---|---|
| `/dashboard`, `/reports` | grid, card frames | each KPI / chart card |
| `/orders`, `/returns`, `/refunds`, `/payments`, `/shipments`, `/fulfillment`, `/abandoned` | filter bar | table + counts (`searchParams`) |
| `/products`, `/collections`, `/discounts`, `/designs` | chrome | lists; cached reference data in editors |
| `/customers`, `/support` | chrome | lists, threads, unread counts |
| `/content/*` | editor chrome | the document being edited (uncached) |
| `/settings/*`, `/team` | form chrome | current values (cached `settings`, refreshed on save) |
| `/login`, `/forgot-password`, `/reset-password`, `/accept-invite` | whole page | form result |

## Good / bad

- ✅ Dashboard: `<Suspense><RevenueCard/></Suspense>` per card.
- ❌ One await for every card at the top of the dashboard page.
- ✅ Dev overlay clean of `blocking-prerender-*` insights before commit.
- ❌ `export const dynamic = 'force-dynamic'` (errors under Cache Components).
