# Skill: Server Actions (every UI mutation, declared with a guard)

Global authority for `'use server'` code in both apps. Actions are public
POST endpoints, so each one guards itself. Docs:
`node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`.

## Rules

1. Wrap every action in `action({...}, handler)` from `@tuw/heart/platform/guards`:
   `access` (`public` | `guestOrCustomer` | `customer`) or `role` /
   `permission` (admin), a zod `input`, and `idempotent: true` for anything
   that creates money, stock or order rows.
2. The handler is thin: call one module service, set cache tags, return a
   small result. No SQL, no business rules in the action file.
3. Re-check ownership inside the service: take an id, re-read it scoped to
   `ctx.user` or the guest session (stops one shopper editing another's cart).
4. After the write: `updateTag(tag)` (actions only), then `redirect()` if
   needed — revalidation must come first because `redirect` throws.
5. Return field errors, never throw raw errors to the form; the form keeps
   every typed value. Show a retry message for "Failed to find Server Action"
   after a deploy.
6. Never use an action to read data; reads belong in Server Components.

## Good / bad

- ✅ `export const addToCart = action({ access: 'guestOrCustomer', input: AddToCartInput, idempotent: true }, …)`.
- ❌ A bare `export async function addToCart(fd)` with no guard or validation.
- ✅ `refundOrder` declared with `permission: 'order.refund'`.
- ❌ Checking `isAdmin` only in the page that renders the refund button.

Related: `auth-guards`, `idempotency`, `cache-components`.
