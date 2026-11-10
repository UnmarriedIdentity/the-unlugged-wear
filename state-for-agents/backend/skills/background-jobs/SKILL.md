# Skill: Background Jobs (Vercel Cron today, any worker tomorrow)

Global authority for scheduled and deferred work. Jobs must run the same
way from Vercel Cron or from our own server later.

## Rules

1. A job is a plain async function in its module, registered by name in
   `platform/jobs` (`fulfillment.submitDue`, `fulfillment.syncOpen`,
   `notifications.sendQueued`, `inventory.notifyRestocked`,
   `giftCards.expireDue`).
2. Triggers only call `runJob(name)`: today `/api/cron/[job]` in the admin
   app (checks `CRON_SECRET`); later a Node worker on a timer. No job logic
   in the route.
3. Work comes from rows the module already has (`orders.cancellable_until`,
   `fulfillment_orders.status`, `email_logs.status`), claimed with
   `SELECT … FOR UPDATE SKIP LOCKED LIMIT n` so two runners never share a row.
4. Every job is safe to run twice: rely on the unique guards and status
   checks, not on "it only runs once".
5. Small batches per run; a failure marks that row (`last_error`, attempts)
   and moves on — one bad row never blocks the queue.
6. Jobs call providers only through integration adapters (mock until the
   integrations phase).

## Good / bad

- ✅ `submitDue` picks pending orders whose cancel window has passed, 20 at a time.
- ❌ Sending every pending order in one loop that dies on the first error.
- ✅ The same `runJob('giftCards.expireDue')` from Cron and from a CLI.
- ❌ Expiry logic written inside `app/api/cron/expire/route.ts`.

Related: `idempotency`, `integrations`, `route-handlers`.
