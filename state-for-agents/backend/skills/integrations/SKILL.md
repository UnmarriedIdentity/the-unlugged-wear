# Skill: Integrations (providers behind a registry, mocks until last)

Global authority for third-party services: payments, fulfilment (Qikink),
email, storage, couriers. Design: `DOC/backend/16-Fulfillment-Providers.md`.

## Rules

1. Each category has an interface and a registry in
   `packages/heart/src/integrations/<category>/` (`registry.get(slug)`).
   Services never import an adapter directly.
2. A provider = one `integration_providers` row + one adapter + env
   secrets. No schema change, no edits to other modules.
3. **Integrations phase comes last** (owner decision 2026-11-10). Until it
   opens, only `mock` adapters are built, and the UI says so truthfully
   ("Demo payment — no money will be collected"). Backlog: `TL-INT-*`.
4. Secrets live in env only — never in `integration_providers.settings`,
   `store_settings` or logs.
5. Adapters map provider words to ours (`mapStatus`) and keep the raw value
   (`provider_status`, `raw_payload`) for audit.
6. Read `capabilities` before calling (`cod`, `cancelUntil`, `webhooks`)
   instead of `if (slug === 'qikink')` branches in services.

## Good / bad

- ✅ `fulfillment.submit()` → `registry.get(order.providerSlug).createOrder()`.
- ❌ `import { qikink } from '../integrations/fulfillment/qikink'` in the orders service.
- ✅ Mock payment adapter now; Razorpay adapter added in the integrations phase.
- ❌ Wiring the live Razorpay SDK into checkout before the core modules are done.

Related: `background-jobs`, `route-handlers`, `backend-modules`.
