import 'server-only';

// Orders module — public API (backend-modules skill). Owns orders,
// order_items, order_status_history and discount_codes (DOC/backend/06).
// Checkout orchestrates cart, inventory, payments and customers through
// their index files inside one transaction.
export * from './checkout.ts';
export * from './read.ts';
export * from './pricing.ts';
export { findDiscount, redeemDiscount, adminListDiscounts, adminCreateDiscount, adminSetDiscountActive, adminDeleteDiscount, type DiscountCode, type AdminDiscountCode, type DiscountInput } from './discounts.ts';
export * from './admin.ts';
export * from './guest.ts';
export * from './refunds.ts';
export * from './money.ts';
export * as orderSchemas from './schemas.ts';
