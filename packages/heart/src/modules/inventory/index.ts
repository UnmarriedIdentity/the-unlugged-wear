import 'server-only';

// Inventory module — public API (backend-modules skill). Owns stock_movements,
// stock_alert_subscriptions and the stock balance columns (DOC/backend/04, 22).
export * from './stock.ts';
export * from './alerts.ts';
export * as inventorySchemas from './schemas.ts';
