# Frontend UI scope

## Goal

Create a complete, reviewable customer website and admin interface for The Unplugged Wear. Use realistic mock data and deterministic local interactions so the user can evaluate the experience before backend work.

## Included

- Separate website and admin applications.
- Responsive layouts, routes, navigation, forms, tables, dialogs and feedback.
- Urbanist typography and the agreed V2 admin design foundations.
- Website editorial styling aligned with slow living and intentional design.
- Mock products, variants, customers, orders, statuses and dashboard metrics.
- Local cart, wishlist, filters, sorting, pagination and form validation.
- Simulated customer and staff sessions, clearly labelled in preview.
- Loading, empty, error, success, focus and disabled states.
- Basic page metadata and accessible navigation.

## Website screens

Home; shop; collection; product detail; search; cart; checkout; order confirmation; wishlist; login; registration; password recovery/reset; account overview/profile/addresses/orders/order details/returns/security; tracking; about; journal list/article; contact; FAQ; size guide; privacy/terms/shipping/returns policy previews; not-found and error pages.

## Admin screens

Login; password recovery/reset; invitation acceptance; overview; products/list/create/edit; collections; designs; orders/list/detail; fulfillment; shipments; payments; refunds; returns; customers/list/detail; support; content pages/journal/navigation/media; reports; team; audit log; settings for general/brand/payments/fulfillment/shipping/taxes/notifications; not-found and error pages.

## Deferred

Supabase connections, real authentication/authorization, Razorpay checkout, Qikink API calls, live fulfillment, transactional messaging, actual refunds, production file uploads, persistent server data, database migrations and production deployment. Browser-local demo data is not a secure access control mechanism.

## Completion criteria

Every listed screen is reachable and populated appropriately. Major controls produce an observable result or clearly explain an unavailable preview action. Local changes remain internally consistent across related screens within the same application. Responsive and accessibility checks pass. Documentation records unfinished items honestly.

## Implementation sequence

1. App setup, tokens, typography and layout shells.
2. Core components and fixtures.
3. Website browsing, product, cart and checkout flow.
4. Admin product and order management.
5. Remaining account, content, settings and operational views.
6. Cross-screen state consistency, responsive fixes and acceptance review.
