import 'server-only';

// Orders module — public API (backend-modules skill). Owns orders,
// order_items, order_status_history and discount_codes (DOC/backend/06).
// Checkout orchestrates cart, inventory, payments and customers through
// their index files inside one transaction.
export * from './checkout.ts';
export * from './read.ts';
export * from './pricing.ts';
export { findDiscount, redeemDiscount, type DiscountCode } from './discounts.ts';
export * as orderSchemas from './schemas.ts';
