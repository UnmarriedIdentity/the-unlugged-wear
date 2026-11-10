# Skill: Server Data, Mutations and Auth (Next.js 16 + packages/core)

How storefront code reads data, changes data and checks who the user is.
Plan: `DOC/backend/23-Backend-Implementation.md`. Module rules:
`4.API-Design.md`. Next.js source of truth: `node_modules/next/dist/docs/`.

## 1. Where code goes

| Layer | Lives in | Does |
|---|---|---|
| Page / Server Component | `src/app/**` | composes UI, calls the Data Access Layer (DAL) |
| Server Action | `src/app/**/actions.ts` (`'use server'`) | mutations from our own UI; thin |
| Route Handler | `src/app/api/**/route.ts` | public endpoints only: webhooks, cron, external callers |
| DAL + module services | `packages/core/src/modules/<name>` (`import 'server-only'`) | business rules, auth checks, SQL via Drizzle, returns DTOs |
| Integrations | `packages/core/src/integrations/<category>` | provider adapters behind a registry (mock until the integrations phase) |

Never fetch our own Route Handlers from a Server Component — call the
module function directly. Never use Server Actions to read data (they run
one at a time per client, over POST).

## 2. Guards are declared, not hand-written

```ts
'use server';
export const addToCart = action(
  { access: 'guestOrCustomer', input: AddToCartInput, idempotent: true },
  async ({ input, ctx }) => {
    const line = await cart.addItem(ctx, input);
    updateTag(`cart:${line.cartId}`);
    return line;
  },
);
```

- `action()` / `route()` from `@tuw/core/platform/guards` verify the
  session, check `access` (`public` | `guestOrCustomer` | `customer`) or a
  permission slug, validate input with zod, apply the `Idempotency-Key`,
  and map errors to the API envelope. Never skip them.
- **Re-check inside every action**: a page-level check does not protect the
  actions defined on that page (they are reachable by direct POST).
- Ownership (IDOR): accept an id, then re-read the record scoped to
  `ctx.user` / the guest session. Never trust ids from the client alone.
- Return minimal DTOs — never raw rows, password hashes or internal ids
  the UI does not need.

## 3. Session and the user

- `proxy.ts` does **optimistic** checks only (cookie present? → else
  redirect to `/login?next=`). It never reads the database and is never
  the security check.
- Real checks: DAL functions (`requireCustomer()`, `getCurrentUser()`) and
  every action/route guard.
- Under Cache Components, the session read must be inside `<Suspense>`;
  `getCurrentUser()` uses `'use cache: private'` (it may call `cookies()` and
  `redirect()`). No auth checks in layouts.
- Per-user cached data: resolve the user first, then call a **non-exported**
  `'use cache'` function with `user.id` and `cacheTag('orders:'+user.id)`;
  invalidate with `updateTag` in the action that changes it.
- Give Client Components the user by passing an un-awaited promise to a
  `'use client'` `UserProvider` and reading it with `use()`.

## 4. Forms

- `<form action={serverAction}>` works before hydration (progressive
  enhancement). Use `useActionState(action, initial)` →
  `[state, formAction, pending]` for errors and pending UI; `useOptimistic`
  for instant cart/wishlist feedback.
- On failure keep every typed value (AGENTS.md §5) — return field errors,
  never clear the form.
- After a deploy an old page may hit "Failed to find Server Action": show a
  retry message, never a dead button.

## 5. Money, ids, demo truth

- API/UI money: integer paise; DB: `DECIMAL(12,2)` rupees — convert only in
  module services.
- Ids are UUIDv7 from the server. `Idempotency-Key` is a client UUIDv7 per
  submit attempt (kept across retries of the same attempt).
- Until a provider is integrated (integrations phase), mock adapters must
  say so in the UI (e.g. "Demo payment — no money will be collected").

Related: `nextjs-rendering`, `backend-readiness`.
