# Skill: Backend Readiness (UI that survives a real backend)

Global authority for keeping the frontend pluggable: a proper backend and the
customer website arrive later, and the UI must not need rewrites to meet them.

## Rules

1. Mock adapters stay isolated in `src/mocks/` (fixtures + state managers);
   components consume them through narrow hooks, never direct fixture imports
   in deep leaves. No live integrations as shortcuts.
2. Money: integer minor units end-to-end (paise); never floats for amounts.
3. State separation is structural: `paymentStatus` ⟂ `fulfillmentStatus` ⟂
   `returnStatus` — no combined enums, no cross-field derivation.
4. Mutations go through named actions (create/update/delete…), role-gated,
   with explicit demo-truth copy ("Demo checkout sandbox — no payment will be
   collected") and input preservation on failure.
5. Every mutation path keeps a reset-demo action clearing its storage keys and
   restoring baseline fixtures.
6. Identities stay fictitious (`@example.com`, Indian mobiles, Indiranagar
   addresses). Never commit secrets or real customer data.

## Good / bad

- ✅ `issueRefund(orderId, amountMinor)` with `0 < amount ≤ paid − refunded`.
- ❌ `order.total - refundTotal > 0` in floating rupees inside a component.
- ✅ `resetDemoData()` clearing `tuw_admin_v2_state` + fixtures restore.
- ❌ Fetching live endpoints "temporarily" to preview interactions.
