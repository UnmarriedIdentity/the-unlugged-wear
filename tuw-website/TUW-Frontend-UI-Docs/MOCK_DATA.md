# Mock data and local state

## Purpose and location

Use typed deterministic fixtures. Store them under `src/mocks/` in each application, with fixtures, scenario definitions and a local state adapter. This folder may be added to the supplied scaffold. Separate mock adapters from UI components so real services can replace them later.

## Product fixtures

Create a focused assortment of at least eight T-shirts, hoodies and jackets, plus two select lifestyle products. Include stable IDs, slugs, names, descriptions, integer minor-unit INR prices, category, colour/size variants, publication state, images, care copy and mock fulfillment metadata. Include a long title, missing image fallback and unavailable size. Do not imply physical inventory ownership; use partner availability and publication state terminology.

## Commerce fixtures

Include at least twenty mock orders across paid/pending/failed/refunded payment states and queued/printing/shipped/delivered/submission-failed fulfillment states. Keep these state groups independent. Include stable order IDs, line-item snapshots, amounts, addresses, timestamps, shipments, tracking and return/refund relationships. Use sample identities and clearly fictitious contact data such as example.com addresses.

## Other fixtures

Customers; customer addresses; staff/roles; support tickets; content pages/articles; mock media; activity/audit entries; settings; reporting summaries derived from the selected mock dataset.

## Local interactions

- Website cart/wishlist updates by product variant ID.
- Successful demo checkout creates an order and updates local account history.
- Admin create/edit/publish operations update the local catalog dataset.
- Mock retry/refund actions update matching records and audit history.
- Dashboard totals and reports reflect the active dataset rather than unrelated hardcoded numbers.

Browser storage may preserve demo state; prefix keys by application and schema version and provide a reset-demo action. Explain that website and admin local changes do not automatically synchronize across separate deployments. Cross-app synchronization is deferred; use matching baseline fixtures or a deliberate development-only mock service if needed.

## Scenarios

Provide a documented way to select normal, loading, empty, error, long-content and restricted-role views. Simulate reasonable loading delays without random failures. Repeated tests must produce the same result. File previews use browser-local object URLs and clean them up when no longer needed.

## Limits

Do not store real credentials or sensitive customer information. Do not request real payment details. Policy and shipping/tax amounts are demonstration values until business approval; label them accordingly. Local demo roles are not authentication.
