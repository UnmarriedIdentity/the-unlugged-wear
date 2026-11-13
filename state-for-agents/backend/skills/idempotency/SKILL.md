# Skill: Idempotency (a retry never makes a second row)

Global authority for duplicate-proofing writes. Full table of guards:
`DOC/backend/21-Idempotency.md`.

## Rules

1. Every mutation that creates orders, payments, refunds, returns, stock,
   gift-card or wallet rows is declared `idempotent: true`. The client sends
   an `Idempotency-Key` (UUIDv7) generated once per user intent and reused
   on retries of that intent.
2. The guard stores the key in `idempotency_keys` under
   `(scope, actor_ref, key)`: a replay returns the stored response, a
   concurrent duplicate gets `409`, the same key with a different body `422`.
3. The business table also carries a permanent guard (unique index) — keys
   expire, constraints do not. Copy the key onto the row where the table has
   an `idempotency_key` column (orders, refunds, returns).
4. Catch the unique-violation (`23505`) on a known guard and return the
   existing row instead of an error.
5. Webhooks: insert into `webhook_events (provider, provider_event_id)` first;
   a conflict means "already handled" → respond 200 and stop.
6. A new scope is added to doc 21 and to the comment in `005-platform.sql`.

## Good / bad

- ✅ Double-clicked "Place order" → same order number both times.
- ❌ A new key generated on every click (protects nothing).
- ✅ Re-running the Qikink submit job is a no-op (`one_initial_submission_per_provider`).
- ❌ Relying only on `idempotency_keys` for a refund (it expires after 7 days).

Related: `server-actions`, `route-handlers`, `background-jobs`.
