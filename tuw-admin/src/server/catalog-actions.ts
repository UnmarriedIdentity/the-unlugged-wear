'use server';

import * as catalog from '@tuw/heart/modules/catalog';
import { catalogSchemas as s, PRODUCTS_TAG } from '@tuw/heart/modules/catalog';
import { AppError } from '@tuw/heart/platform/errors';
import { guards } from './session';
import { refreshStorefront } from './storefront-cache';

// Catalog writes. Each one re-checks its own permission (guards) and asks
// the storefront to expire its catalog; a failed refresh never fails a save.
const refresh = () => refreshStorefront([PRODUCTS_TAG]);

export const getProductAction = guards.action({ permission: 'product.update', input: s.productRef }, async ({ input }) => catalog.adminGetProduct(input.id));

export const createProductAction = guards.action({ permission: 'product.create', input: s.createProduct }, async ({ input, ctx }) => {
  const product = await catalog.adminCreateProduct(input, ctx.user!.id);
  return { product, storefront: await refresh() };
});

export const updateProductAction = guards.action({ permission: 'product.update', input: s.updateProduct }, async ({ input, ctx }) => {
  // Archiving through the editor needs the archive permission too.
  if (input.publicationStatus === 'archived' && !ctx.user!.permissions.includes('product.archive')) {
    throw new AppError('FORBIDDEN', 'You do not have permission to archive products.');
  }
  const { id, expectedUpdatedAt, ...fields } = input;
  const product = await catalog.adminUpdateProduct(id, fields, ctx.user!.id, expectedUpdatedAt);
  return { product, storefront: await refresh() };
});

export const setProductsStatusAction = guards.action({ permission: 'product.update', input: s.bulkStatus }, async ({ input, ctx }) => {
  if (input.status === 'archived' && !ctx.user!.permissions.includes('product.archive')) {
    throw new AppError('FORBIDDEN', 'You do not have permission to archive products.');
  }
  const result = await catalog.adminSetProductsStatus(input.ids, input.status, ctx.user!.id);
  return { ...result, storefront: await refresh() };
});

export const deleteProductsAction = guards.action({ permission: 'product.archive', input: s.bulkDelete }, async ({ input, ctx }) => {
  const result = await catalog.adminDeleteProducts(input.ids, ctx.user!.id);
  return { ...result, storefront: await refresh() };
});

export const importListingAction = guards.action({ permission: 'product.import', input: s.importRows }, async ({ input, ctx }) => {
  // Imports create drafts only, so the storefront has nothing to refresh.
  const { jobId, status, created, updated, failedRows, issues } = await catalog.importQikinkListing(input.rows, { actorId: ctx.user!.id, source: 'csv' });
  return { jobId, status, created, updated, failedRows, issues: issues.slice(0, 50) };
});

export const saveCollectionAction = guards.action({ permission: 'product.update', input: s.saveCollection }, async ({ input, ctx }) => {
  const collections = await catalog.adminSaveCollection(input.id, input.collection, ctx.user!.id);
  return { collections, storefront: await refresh() };
});

export const deleteCollectionAction = guards.action({ permission: 'product.update', input: s.productRef }, async ({ input, ctx }) => {
  const collections = await catalog.adminDeleteCollection(input.id, ctx.user!.id);
  return { collections, storefront: await refresh() };
});

export const saveCategoryAction = guards.action({ permission: 'category.manage', input: s.categoryFields }, async ({ input, ctx }) => {
  const categories = await catalog.adminSaveCategory(input, ctx.user!.id);
  return { categories, storefront: await refresh() };
});

export const deleteCategoryAction = guards.action({ permission: 'category.manage', input: s.productRef }, async ({ input, ctx }) => {
  const categories = await catalog.adminDeleteCategory(input.id, ctx.user!.id);
  return { categories, storefront: await refresh() };
});
