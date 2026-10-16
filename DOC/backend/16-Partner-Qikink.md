# Partner — Qikink Print on Demand

> Status: Draft | Last Updated: 2026-10-16
> Qikink prints + ships everything; we hold no warehouse and run no floor.
> Our fulfillment statuses **mirror partner state**, never our own operations.
> Reference: Qikink API 08-23 (Postman public docs) + Qikink help center.
> Unverified points are marked as such — sandbox confirms them, not this doc.

## Endpoints & hosts

| | Sandbox (open) | Live (gated — request via dashboard → Integration → Custom API) |
|---|---|---|
| Base | `https://sandbox.qikink.com/` | `https://api.qikink.com/` |
| Auth | `POST /api/token` (ClientId + client_secret → access_token) | same |
| Orders | `POST /api/order/create` | same |
| Headers | `ClientId`, `Accesstoken` — HTTPS only | same |

Secrets (`ClientId`/`client_secret`) live in **env only** — never in
`store_settings`, never in the DB (file 01 secrets rule).

## Create-order contract (what we send)

`order_number` (ours, unique, never reused) · `qikink_shipping` (1 =
they ship — our default; 0 = self) · `gateway` (COD/Prepaid) ·
`total_order_value` (retail charged) · `line_items[]`
(`search_from_my_products` 0/1, `print_type_id`: DTG=1, AOP=2,
Embroidery=3, DTF=17…, qty 1–100, `sku`, `designs`) ·
`shipping_address[]` (required when they ship).

## Money: wallet credits

Rs.1 = 1 credit, no expiry. Every placed order deducts; recharges are
manual (dashboard). **Zero wallet halts all placement** — hence the
admin wallet-balance card with low-balance warning. COD: customer pays
courier at delivery; courier remits to Qikink in 4–5 working days
(tracked as a note on the order, not a ledger entry — the ledger records
*our* credit movements only). Every debit/refund lands in
`partner_wallet_ledger` (file 02).

## Fulfillment model (no warehouse — doctrine)

Payment captured → submit to Qikink → Qikink prints + ships → AWB and
courier statuses sync back → customer tracking. Our
`queued/printing/shipped/delivered/submission_failed` mirror partner
state. Stock is never decremented by the POD flow (nothing to decrement);
availability renders from `is_active`. Edit/cancel supported pre-print.

## Tracking sync (poll-first)

AWB + courier + status stored on `partner_orders` (`synced_at` per row);
`shipments.tracking_number` carries the AWB (no new column needed).
Strategy is **poll + AWB store** until sandbox proves webhook push —
polling is the cheaper assumption to be wrong about. Per-row **Sync now**
button in admin is the honest manual fallback from day one.

## Qikink → ours status map (CHECK-enforced on `partner_orders`)

| Qikink status | Our mirror | Side effect |
|---|---|---|
| On Hold | `queued` (held) | wallet warning fires (insufficient credits) |
| Live OOS | `queued` (held) | partner-stock flag; surfaces availability |
| Live | `printing` | — |
| To be Printed | `printing` | — |
| Partially Picklisted | `printing` | — |
| Printed | `printing` | — |
| Manifested | `printing` | — |
| In-Transit | `shipped` | AWB → `shipments.tracking_number` |
| Exception | `submission_failed` | resubmit path |
| Delivered | `delivered` | — |
| RTO Initiated | — | triggers returns flow (RMA, not a status) |
| Returned | — | triggers returns flow |
| Cancelled | our order `cancelled` | only from Live OOS / Live per their rules |

## Tables (detail in file 02; DDL in migration sequence)

- `partner_orders`: order FK unique, qikink order id, AWB, courier,
  partner_status, raw payload jsonb, synced_at — the sync seam.
- `partner_wallet_ledger`: credit debit/refund per order — the money trail.

## Open verifications (sandbox, before live wiring)

1. Exact `/api/token` request params.
2. Design-upload endpoint shape (design files ≤25 MB, JPEG/PNG 300 DPI).
3. Webhook push vs poll-only for status updates.
