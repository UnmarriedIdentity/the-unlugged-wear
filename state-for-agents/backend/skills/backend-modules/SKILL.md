# Skill: Backend Modules (one domain, one folder, one public API)

Global authority for code in `packages/core/src/modules/<name>`. A change
to cart rules is made in the cart module and reaches both apps. Plan:
`DOC/backend/23-Backend-Implementation.md`; table ownership:
`3.Database-Schema.md` §4.

## Layout

```
modules/<name>/
  index.ts       public API — the only file other code imports
  service.ts     business rules
  repository.ts  Drizzle/SQL for this module's own tables only
  schemas.ts     zod input/output
  types.ts       DTOs (what leaves the module)
  events.ts      events it emits ('order.paid', 'stock.restocked')
```

## Rules

1. A module writes only the tables it owns. Need another module's data?
   Call that module's `index.ts`. Never import its repository.
2. Side effects in other modules go through events: `orders` emits
   `order.paid`; `fulfillment`, `notifications`, `gift-cards` subscribe.
   Adding a reaction never edits the emitter.
3. Services take `ctx` (who is acting) as the first argument and return DTOs,
   never raw rows. Money leaves as integer paise.
4. Rules shared by both apps (stock, prices, status changes) live here once;
   app code only calls them.
5. No UI, no `next/*` imports in services (cache tags are set by the caller).

## Good / bad

- ✅ `checkout.placeOrder(ctx, input)` calls `cart.lockForCheckout()` and
  `inventory.reserve()` through their `index.ts`.
- ❌ `orders/service.ts` running `UPDATE cart_items …` itself.
- ✅ `gift-cards` subscribes to `order.paid` to issue purchased cards.
- ❌ Adding gift-card code inside `orders.markPaid()`.

Related: `data-access`, `server-actions`, `background-jobs`.
