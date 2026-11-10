# Skill: Route Handlers (public endpoints only)

Global authority for `src/app/api/**/route.ts` in both apps. Route handlers
exist for callers that are not our own UI. Docs:
`node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`.

## When to use one

1. Provider webhooks (Razorpay, Qikink, email), each verified by signature
   and recorded in `webhook_events` before acting.
2. Cron entry points (`/api/cron/[job]`, admin app) checking `CRON_SECRET`.
3. Cross-app cache refresh (`POST /api/revalidate` on the storefront,
   secret-protected).
4. Any future external API client. Our own UI uses Server Actions and
   Server Components instead.

## Rules

1. Wrap with `route({ role | secret | signature, input }, handler)` — same
   guard layer as actions; errors use the envelope
   `{ error: { code, message, details }, requestId, timestamp }`.
2. Handlers stay under ~30 lines: verify → call one service/job → respond.
3. `'use cache'` cannot go in a handler body; call a cached helper instead.
   Invalidate with `revalidateTag(tag, 'max')` (`updateTag` throws here).
4. Bail-outs throw internally — never wrap Next.js calls in a catch-all `try`.
5. Return `200` fast for webhooks and let jobs do slow work.

## Good / bad

- ✅ Razorpay webhook: verify signature → insert `webhook_events` (unique) → `payments.applyEvent()`.
- ❌ Applying a webhook payload without checking it was already processed.
- ✅ `/api/cron/fulfillment-submit` → `runJob('fulfillment.submitDue')`.
- ❌ A storefront page calling `fetch('/api/products')` on itself.

Related: `server-actions`, `idempotency`, `background-jobs`.
