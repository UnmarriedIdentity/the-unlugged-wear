# Fulfilment & Integration Providers — Registry, Adapters, Qikink

> Status: Draft | Last Updated: 2026-11-10
> DDL: `db/migrate/009-fulfillment.sql` (7 tables). We hold no warehouse:
> fulfilment status **mirrors provider state**. Qikink is the first
> provider, not the shape of the schema.
> Sources: Qikink help centre (qikink.com/help, read 2026-11-10) and the
> Qikink API 08-23 Postman docs. Points not confirmed by a sandbox call are
> marked **unverified**.

## 1. Plug-and-play rule

Every external service — payment gateway, print-on-demand partner,
courier, email/SMS sender — is:

1. one row in `integration_providers` (slug, category, sandbox/live,
   `is_active`, `capabilities`, non-secret `settings`), and
2. one adapter module in the app that uses it, implementing that
   category's interface.

Adding Printrove, Shiprocket or Stripe later = insert a row, write an
adapter, set env secrets. **No schema change, no edits to other modules.**
`products.partner_provider`, `payments.provider` and
`webhook_events.provider` are FKs to `integration_providers.slug`.

Secrets (`QIKINK_CLIENT_ID`, `QIKINK_CLIENT_SECRET`, Razorpay keys) live in
env only — never in `settings`, never in the database.

### Fulfilment adapter interface (admin API owns it)

```ts
interface FulfillmentProvider {
  slug: string;                                    // 'qikink'
  createOrder(input: FulfillmentOrderInput): Promise<ProviderOrderRef>;
  getOrder(ref: ProviderOrderRef): Promise<ProviderOrderState>; // poll
  cancelOrder(ref: ProviderOrderRef): Promise<void>;
  mapStatus(raw: string): FulfillmentStatus;        // raw → normalized
  parseWebhook?(req: Request): Promise<ProviderEvent>; // when supported
}
```

The services call `registry.get(slug)` and never import an adapter
directly, so swapping or adding providers never touches order code.

## 2. Tables (detail in `02-Data-Tables.md`)

| Table | Role |
|---|---|
| `integration_providers` | Registry + capabilities (`cod`, `cancelUntil`, `webhooks`, `tracking: poll`, `claimWindowDays: 7`, `rtoStorageDays: 100`, `wallet`) |
| `provider_product_mappings` | Our variant → provider SKU + payload (Qikink: print type id, design code, placement SKU, design link, mockup link) + unit cost |
| `fulfillment_orders` | One per order per provider send: our `external_ref` (sent as Qikink `order_number`), provider order id, normalized `status`, raw `provider_status`, prepaid/COD, COD amount, provider cost, courier, AWB, RTO storage deadline, sync state |
| `fulfillment_order_items` | Order lines inside each provider order (snapshot of SKU + payload sent) |
| `provider_wallet_ledger` | Prepaid wallet trail: recharge, order debit, cancel credit, claim credit, COD-to-wallet, withdrawal |
| `provider_cod_remittances` | COD collected by the provider and paid back to us (transfer id, amount, fees, wallet or bank) |
| `fulfillment_claims` | Defect / damage / wrong item / lost parcel claims with deadline, evidence media, ticket ref, outcome |

## 3. Order flow (POD)

1. Customer pays (prepaid) or chooses COD → `orders` row.
2. Admin API worker builds a `fulfillment_orders` row per provider from
   `provider_product_mappings` and calls `createOrder`. Gift-card lines
   (`products.product_kind = 'gift_card'`) are never sent.
3. Provider debits its wallet → `provider_wallet_ledger` `order_debit`.
   Insufficient credits → Qikink puts the order **On Hold**; we show
   `status = 'on_hold'` and alert staff (`notifications`, kind `payment`).
4. Poll worker (`idx_fulfillment_orders_sync`, stalest first) calls
   `getOrder`, stores raw `provider_status`, maps to `status`, writes AWB /
   courier, creates or updates `shipments` (+ `shipment_events`) and moves
   `orders.status`.
5. COD: courier collects → provider remits to us (Qikink: wallet or bank,
   a few working days after delivery) → `provider_cod_remittances` row, and
   each covered `fulfillment_orders.cod_remittance_id` is set.

## 4. Qikink facts that shape the product (help centre, 2026-11-10)

| Topic | Qikink rule | What we do |
|---|---|---|
| Money-back returns / size exchanges | Not offered — the seller places a new order at their own cost | **No money-back returns.** Exchanges = new replacement order paid by us; customer pays any price difference (file 06) |
| Defects, misprints, damage | Claim within **7 days of delivery**; unboxing video + product + packaging photos required, else no liability | `returns.type = 'replacement'` + `fulfillment_claims` (deadline, `evidence_media_ids`). Storefront asks for the video at request time |
| Lost in transit | Refunded once marked lost | Claim type `lost_in_transit` → `claim_credit` in the wallet ledger |
| RTO (undelivered) | Returns to Qikink's Coimbatore warehouse; stored **100 days**; can be re-shipped from the dashboard; no RTO charge (pricing page lists ₹20/product storage — conflicting) | `status = 'rto_initiated' / 'returned'`, `rto_storage_until`; re-ship = new `fulfillment_orders` row with `reason = 'reship'` |
| Cancel | Only while **Live** (or Live OOS — pages conflict); full value back to wallet | Customer cancel only while our order is `pending` (before submission); staff cancel → `cancelOrder` + `cancel_credit` |
| Edit | Address/customer details until Printed; products never | Address edits allowed until `in_production` ends |
| NDR (COD) | WhatsApp redeliver/cancel; 3 attempts; auto-RTO after 72 h | `status = 'delivery_exception'`; staff action in Qikink dashboard (no documented API) |
| Wallet | ₹1 = 1 credit, no expiry, manual recharge in dashboard | Admin shows ledger-derived balance; recharges recorded as `recharge` |
| Invoices | Monthly GST invoice report (Excel), per-order invoice in dashboard | Not stored in v1; `provider_cost` holds the per-order charge |
| Tracking | AWB after Manifested; Qikink emails the customer | We also show tracking from `shipments` |
| Couriers | Delhivery, FedEx, eKart, Ecom Express, Xpressbees, India Post (prepaid only; COD not via India Post) | Courier stored as text from the provider |

## 5. Qikink status map (adapter `mapStatus`)

| Qikink | `fulfillment_orders.status` | `orders.status` |
|---|---|---|
| On Hold | `on_hold` | `confirmed` |
| Live OOS | `on_hold` | `confirmed` |
| Live | `submitted` | `confirmed` |
| To be Printed, Partially Picklisted, Printed, Manifested | `in_production` | `processing` |
| In-Transit | `shipped` | `shipped` |
| Exception | `delivery_exception` | `shipped` |
| Delivered | `delivered` | `delivered` |
| RTO Initiated | `rto_initiated` | `shipped` (ops alert) |
| Returned | `returned` | `failed` until re-shipped |
| Cancelled | `cancelled` | `cancelled` |

Shipment-level statuses (Pickup Scheduled … RTO Delivered, Reverse Pickup
Initiated) map onto `shipment_events.status` in the adapter.

## 6. API (Postman 08-23 — **unverified until a sandbox call**)

| | Sandbox | Live (request via dashboard → Integration → Custom API) |
|---|---|---|
| Base | `https://sandbox.qikink.com/` | `https://api.qikink.com/` |
| Token | `POST /api/token` (ClientId + client_secret → access token) | same |
| Create order | `POST /api/order/create` | same |
| Headers | `ClientId`, `Accesstoken` | same |

Create-order body: `order_number` (= our `external_ref`), `qikink_shipping`
(1 = Qikink ships), `gateway` (COD/Prepaid), `total_order_value`,
`line_items[]` (`search_from_my_products`, `print_type_id`, quantity,
`sku`, `designs[]`), `shipping_address`.

The public help centre documents **no API, no webhooks and no pincode
lookup**. Until Qikink confirms otherwise: tracking is poll-only, NDR and
claims are handled in the Qikink dashboard, and the admin has a per-row
**Sync now** button.

## 7. Open verifications (ask Qikink / sandbox)

1. Exact `/api/token` params and token lifetime.
2. Order-status / tracking endpoint (`GET /api/order?id=`?) and any webhook.
3. Cancel endpoint, and whether **Live OOS** orders can be cancelled.
4. Claim (replacement/refund) submission by API or dashboard only.
5. Design upload: link-based only, or an upload endpoint (files ≤ 25 MB,
   300 DPI PNG/JPEG).
6. Whether the RTO storage charge (₹20/product) applies.
