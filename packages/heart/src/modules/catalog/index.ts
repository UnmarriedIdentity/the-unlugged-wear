import 'server-only';

// Catalog module — public API (backend-modules skill). Owns categories,
// products, variants, images, attribute links, collections, size charts,
// product source rows and import jobs (DOC/backend/04, 07).
export * from './read.ts';
export { importQikinkListing, importGroups, ensureAttributeValue, ensureAttributeValues, records, textArray, type ImportReport, type ImportOptions, type ImportedProduct } from './import.ts';
export * as planner from './planner.ts';

/** Cache tag for everything the storefront reads from the catalog. */
export const PRODUCTS_TAG = 'products';
