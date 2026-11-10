# Skill: Stress Testing — Backend (tests that try to break the code)

Global authority for writing backend tests in `packages/heart` and the app
actions/routes. A test exists to **break** the code, not to show it works.
Write the attack first, then make the code survive it. A module is not done
until its break-it suite passes (Rule 02 gates).

## How to write them

1. For every public function / action / route, list attacks from the
   catalog below before writing any happy-path test. Aim for 3 broken
   inputs per valid one.
2. Integration tests run on a throwaway schema (`createTestDatabase()` from
   `@tuw/heart/platform/test`), never on `public`.
3. Races are real: fire the same request N times with `Promise.all`
   (N ≥ 10) and assert the database ends in exactly one valid state.
4. Randomised inputs use a fixed seed printed in the test name, so a failure
   reproduces.
5. Assert the **database state** and the **error code**, not only the return
   value. A rejected request must leave no partial rows behind.
6. A bug found in review gets a test that fails first, then the fix.

## Edge-case catalog (pick every row that applies)

| Area | Attacks |
|---|---|
| Concurrency | same idempotency key ×20 in parallel; two buyers for the last unit; cancel while the submit job runs; double cron run; two staff editing one product |
| Idempotency | retry after success (replay), retry after 5xx (re-run), same key + different body (422), key from another user (independent), missing / 300-char / `../` key |
| Money | 0, 1 paisa, negative, `NaN`, `Infinity`, `"12.345"`, `1e21`, float `19.99`; discount > subtotal; 100 % coupon; gift card > total; rounding across 3 lines; refund > remaining |
| Strings | empty, whitespace-only, 10 000 chars, emoji / combining marks, RTL, `<script>`, `'; DROP TABLE`, null byte `\u0000`, leading/trailing spaces in email, mixed-case email duplicates |
| Objects | missing fields, extra fields, `__proto__` / `constructor` keys, arrays where objects expected, nested 1 000 deep, 5 MB body |
| Auth | no session, expired / tampered token, customer calling a staff action, support calling `order.refund`, IDOR (another user's order id), guest reading an account order, locked account |
| Time | exactly at the 7-day exchange limit (±1 s), cancel window boundary, IST midnight vs UTC, expired gift card at the exact second, clock skew in tokens |
| State machines | every illegal transition (delivered → pending, refunded → shipped), replaying an old status, out-of-order provider webhooks |
| Database | constraint violation mid-transaction (nothing committed), connection drop during a job row (row stays claimable), unique-violation surfaced as the right `AppError`, `SKIP LOCKED` with two runners |
| Providers (mock) | timeout, 500, malformed JSON, success after we gave up, duplicate webhook, webhook for an unknown order |
| Volume | 500-line cart, 10 000-row import, page size 0 / -1 / 10 000, cursor tampering |

## Good / bad

- ✅ `Promise.all(20 × placeOrder(sameKey))` → 1 order row, 20 identical responses.
- ❌ One `placeOrder()` call asserting `ok: true`.
- ✅ Refund attack: two parallel refunds of the remaining ₹500 → one succeeds, one `CONFLICT`, ledger sums correctly.
- ❌ Mocking the database to "test" a unique constraint.
- ✅ Test named `exchange window: rejects at 7d + 1s (seed 4821)`.

Related: `idempotency`, `data-access`, `background-jobs`, `migrations`.
