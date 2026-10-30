# Idempotency — Duplicate-Proofing in the Schema

> Status: Active | Last Updated: 2026-10-30
> The rule this file enforces: **a retried request, a replayed webhook, an
> offline event flush or a double-clicked button must resolve to the same
> row or to the stored response — never to a second one.**
> This is a database guarantee, not an application convention. Conventions:
> `01-Conventions.md`. Applied DDL: `005-platform.sql` (both guard tables),
> `004-orders.sql` (`orders.idempotency_key`), `013-analytics.sql` (event
> PKs), `014-operations.sql` (`dedupe_key`s).

## 1. Why three layers

| Layer | Table / key | Stops | Lifetime |
|---|---|---|---|
| 1. Generic retry guard | `idempotency_keys` — `UNIQUE (scope, key)` | the same HTTP request executed twice | 24h (checkout) / 7d (others) |
| 2. Provider replay guard | `webhook_events` — `UNIQUE (provider, provider_event_id)` | a payment/shipment event applied twice | 30d |
| 3. Natural keys | one constraint per business table | duplicates that survive the TTL sweep | forever |

Layer 1 alone is not enough: it expires. Layer 3 alone is not enough: it
can only describe *what* a duplicate looks like, not *what response to
return*. Together they mean a retry is safe at any distance in time.

## 2. `idempotency_keys` (layer 1)

```sql
CREATE TABLE idempotency_keys (
  id             uuid         PRIMARY KEY,
  scope          varchar(60)  NOT NULL,
  key            varchar(255) NOT NULL,
  user_id        uuid         REFERENCES users (id) ON DELETE SET NULL,
  request_hash   char(64)     NOT NULL,
  status         varchar(20)  NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress','completed','failed')),
  response_code  smallint,
  response_body  jsonb,
  resource_table varchar(63),
  resource_id    uuid,
  locked_until   timestamptz,
  expires_at     timestamptz  NOT NULL,
  created_at     timestamptz  NOT NULL DEFAULT now(),
  completed_at   timestamptz,
  UNIQUE (scope, key)
);
CREATE INDEX idx_idempotency_keys_user_id    ON idempotency_keys (user_id);
CREATE INDEX idx_idempotency_keys_expires_at ON idempotency_keys (expires_at);
CREATE INDEX idx_idempotency_keys_status     ON idempotency_keys (status)
  WHERE status = 'in_progress';
```

### Scopes (the `key` is only unique *inside* one)

`checkout` · `payment.capture` · `refund.create` · `return.create` ·
`cart.merge` · `import.apply` · `support.create` · `household.invite` ·
`auth.signup` · `auth.invite` · `auth.reset` · `cms.publish`

A client key is a UUIDv7 generated once per user intent — not per attempt.
The same key reused under a different scope is a different operation and
is allowed; the same key under the same scope with a different body is a
bug (rule 6 below).

### Resolution algorithm (single transaction)

1. `INSERT … ON CONFLICT (scope, key) DO NOTHING`.
2. Row is `completed` → return `response_code` + `response_body` **verbatim**.
   The retry is byte-identical to the original success.
3. Row is `in_progress` and `locked_until > now()` → `409
   REQUEST_IN_PROGRESS`. That is the concurrent double-click.
4. Row is `in_progress` but the lease expired → take it over
   (`UPDATE … WHERE locked_until < now()`), then execute.
5. Row is `failed` → re-execute (a failure is retryable by definition),
   writing the same scope+key.
6. Compute `sha256(method + path + canonical-body)`; if it differs from
   the stored `request_hash` → `422 IDEMPOTENCY_KEY_REUSED`.

Writes to layer 1 happen **inside** the domain transaction: the request
row and the business row commit together or not at all. `resource_table` +
`resource_id` exist so a support or admin view can jump from the key to the
thing it created.

### TTL sweep

`expires_at` is set by the handler: 24h for `checkout` and
`payment.capture`, 7 days for everything else. A sweep deletes
`expires_at < now()` rows in batches; the partial index on `in_progress`
keeps the sweep from scanning the whole table. A second sweep clears
`in_progress` rows whose lease is older than 15 minutes — those are
crashed requests, not live ones.

## 3. `webhook_events` (layer 2)

```sql
CREATE TABLE webhook_events (
  id                 uuid        PRIMARY KEY,
  provider           varchar(30) NOT NULL
    CHECK (provider IN ('razorpay','stripe','qikink','shiprocket')),
  provider_event_id  varchar(150) NOT NULL,
  event_type         varchar(100) NOT NULL,
  signature_verified boolean     NOT NULL DEFAULT false,
  payload            jsonb       NOT NULL,
  status             varchar(20) NOT NULL DEFAULT 'received'
    CHECK (status IN ('received','processed','ignored','failed')),
  attempts           smallint    NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  error              text,
  received_at        timestamptz NOT NULL DEFAULT now(),
  processed_at       timestamptz,
  UNIQUE (provider, provider_event_id)
);
```

Rules:

1. Verify the signature **before** inserting; a bad signature is rejected
   without a row (otherwise a hostile sender fills the table).
2. Insert with `ON CONFLICT DO NOTHING`; if the row already exists and is
   `processed`, return `200` immediately without re-applying anything.
3. Dedupe on the **provider's** event id, never on one we generate.
4. `status='failed'` + `attempts` is the retry queue — the same row is
   retried until the cap, then surfaced to ops. The row is the replay log.
5. `provider_event_id` is `varchar(150)` because Razorpay, Stripe and
   Qikink all use different id formats; the pair is what is unique, not
   the id alone.

## 4. Natural keys on business tables (layer 3)

| Table | Constraint | What it stops |
|---|---|---|
| `orders` | partial unique `(placed_by_user_id, idempotency_key)` | a retried checkout forking into two orders |
| `payments` | `transaction_id` UNIQUE | double capture |
| `refunds` | partial unique `one_open_refund (order_id) WHERE status='processing'` | two refunds processing one order |
| `reviews` | unique `(product_id, user_id)` | a double-clicked review |
| `email_logs` | `dedupe_key` + partial unique | a retried producer sending twice |
| `notifications` | `dedupe_key` + partial unique | the same bell ringing twice |
| `shipment_events` | unique `(shipment_id, occurred_at, status)` | a repeated carrier scan |
| `support_messages` | unique `(ticket_id, created_at, sender)` | a retried reply |
| `abandoned_carts` | `cart_id` UNIQUE | the detector writing twice |
| `analytics_sessions` | `session_id` UNIQUE | heartbeat creating a second session row |
| `daily_stats` | `date` UNIQUE | a rollup rerun doubling a day |
| `carts` | partial unique one-active-per-user | two carts for one shopper |
| `cart_items` | unique `(cart_id, product_id, variant_id) NULLS NOT DISTINCT` | a re-add creating a duplicate line |
| `wishlist_items`, `collection_products`, `product_attribute_links`, `product_attribute_link_values`, `profile_size_preferences`, `blog_post_tags`, `role_permissions`, `user_roles` | composite PKs | duplicate joins |
| `audit_logs` | partial unique on `(entity, entity_id, diff->>'job_id') WHERE action='stock.import'` | one import job logging twice |
| event tables (`page_views`, `cart_events`, `product_views`, `search_terms`) | PK `(id, ts)`, both stamped once client-side | an offline/retried flush double-counting |

Deliberately **no** uniqueness on:

- `stock_movements` — two legitimate lines can share an order and a
  variant (partial fulfilment, split restock); duplication is prevented
  upstream by the order's idempotency key.
- `import_jobs` — re-importing the same file must **update**;
  `products.source_group_key` UNIQUE already prevents duplicate products.

## 5. The header contract

| Rule | Detail |
|---|---|
| Header | `Idempotency-Key: <uuidv7>`, generated per user intent |
| Required | `POST`/`PATCH` on `/api/order/*`, `/api/payment/*`, `/api/refund/*`, `/api/import/*`, `/api/household/invite`, `/api/auth/{register,invite,reset/*}` |
| Missing key | `400 VALIDATION_FAILED` (never silently generated server-side — a server-generated key protects nothing) |
| Replay | same status + same body as the original |
| Concurrent duplicate | `409 REQUEST_IN_PROGRESS` |
| Key reuse with a different body | `422 IDEMPOTENCY_KEY_REUSED` |
| Cached responses | only success and terminal 4xx are stored; a 5xx leaves the row `failed` so the retry re-executes |

## 6. Event streams (client-generated ids)

Analytics events are not HTTP mutations with a key — they are a stream.
Their guarantee is different and simpler: **the client stamps `id` and
`ts` once, and the primary key is `(id, ts)`.** An offline queue that
flushes the same batch twice inserts with `ON CONFLICT (id, ts) DO
NOTHING` and changes nothing. Regenerating either value on retry is the
one way to break this, so it is forbidden in the client.

Partitioning does not weaken the rule: `(id, ts)` is unique per partition
and `id` is globally unique by construction.

## 7. What this does not do

- It does not dedupe **concurrent legitimate** actions (two different
  intents, two keys) — that is business logic.
- It does not make a non-transactional side effect (an email already
  handed to the provider) reversible; it only ensures we do not *ask*
  twice.
- It does not cover read endpoints: `GET` retries are naturally safe.
- It does not replace rate limiting (`13-API-Contracts.md`) — one stops
  abuse, the other stops duplication.

## 8. Adding a new mutating route

1. Pick a scope name and add it to the list in §2 and to the comment in
   `005-platform.sql`.
2. Require the header at the route boundary; reject with `400` when absent.
3. Wrap the transaction: insert/replay the key row, then execute.
4. Ask whether the business table needs a natural key of its own. If the
   row represents a real-world event (an order, a payment, a scan, a
   message, a mail), the answer is yes — add it in the same migration.
