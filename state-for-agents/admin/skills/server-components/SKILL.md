# Skill: Server Components (the default for every admin file)

Global authority for what runs on the server in `tuw-admin`. Every component
is a Server Component unless it needs the browser. Source of truth:
`node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`.

## Rules

1. Pages, layouts, tables and KPI cards are Server Components. They call
   `@tuw/core` module functions (`orders.list`, `analytics.revenueSummary`)
   directly — never `fetch('/api/...')` to our own routes.
2. Modules that touch the DB, env secrets or provider keys start with
   `import 'server-only'`. Qikink / Razorpay keys never reach a client file.
3. Request data (`cookies()`, `searchParams` for filters and pagination) is
   read inside a `<Suspense>` child. Pass the `searchParams` promise down to
   the table and `await` it there.
4. No auth checks in layouts. Each data section calls the DAL
   (`requireStaff('order.read')`); the sidebar hides links a role cannot use,
   but the guard is what protects the data.
5. Pass Client Components narrow DTOs (row fields the table shows), never full
   rows with internal notes, cost prices or customer contact data they do
   not display.
6. Independent cards each own their data call — no single `Promise.all` at
   the top of the page.

## Good / bad

- ✅ `orders/page.tsx`: static filter bar + `<Suspense><OrdersTable searchParams={searchParams}/></Suspense>`.
- ❌ `const orders = await orders.list(await searchParams)` at the top of the page.
- ✅ `RevenueCard` fetches its own summary inside its own Suspense.
- ❌ Dashboard waits for every card's query before painting anything.
- ✅ `<OrderRow order={toRowDto(o)} />` with number, customer name, status, total.
- ❌ Passing the order with `shipping_address` and `notes` to a list row.

Related: `client-components`, `cache-components`, `nextjs-rendering`.
