# Implementation instructions — The Unplugged Wear frontend

## Scope

Build the UI-only phase described in these documents. The two applications are `tuw-website/` and `tuw-admin/`. Backend connections, live authentication, payment processing and fulfillment integration are deferred. User instructions take precedence over this file.

## Brand and visuals

Use the exact name “The Unplugged Wear”. Admin typography is Urbanist and admin styling follows the V2 design system. The website uses calm editorial composition, neutral surfaces and intentional product presentation. Avoid invented endorsements, discount-first messaging and trend-drop features.

## Architecture

Keep each app's routes, components, styles, environment and mock state independent. Do not import the other app's source files. Use TypeScript, domain-focused feature folders and reusable UI primitives. Keep mock adapters separate from components. Do not add live integrations as a shortcut to preview interactions.

## Implementation behaviour

Make primary user journeys work end to end with local state. No dead action buttons. Show truthful demo feedback for simulated payments, messages, uploads and staff actions. Use accessible semantic controls and responsive layouts. Preserve existing user work and scope changes narrowly.

## Data

Use deterministic fixtures with fictitious identities. Use integer minor units for money calculations. Separate payment, fulfillment, shipment and refund states. Provide reset-demo support when persistence is added. Never commit secrets or real customer information.

## Quality and completion

Run the checks configured by the project and verify primary flows in a browser. Add meaningful tests for business-like frontend logic rather than tests that merely repeat markup. Check loading/empty/error states, long text, mobile layouts and keyboard access. Complete the relevant UI_CHECKLIST.md entries using evidence; do not mark unrun checks as passed.

## Documentation

Update each app README with real setup commands after initializing it. Record any chosen version/dependency and material design decision. Keep policy copy and unresolved business details labelled as drafts. Report what changed, what was verified and any remaining limitation without claiming the backend is implemented.
