'use server';

import * as orders from '@tuw/heart/modules/orders';
import { orderSchemas as s } from '@tuw/heart/modules/orders';
import * as catalog from '@tuw/heart/modules/catalog';
import { PRODUCTS_TAG } from '@tuw/heart/modules/catalog';
import { guards } from './session';
import { refreshStorefront } from './storefront-cache';

// Discount codes and product discount schedules (/discounts). Every write
// needs discount.manage and is audited in the service.

export const createDiscountAction = guards.action({ permission: 'discount.manage', input: s.discountCreate }, async ({ input, ctx }) => orders.adminCreateDiscount(input, ctx.user!.id));

export const setDiscountActiveAction = guards.action({ permission: 'discount.manage', input: s.discountToggle }, async ({ input, ctx }) => orders.adminSetDiscountActive(input.id, input.isActive, ctx.user!.id));

export const deleteDiscountAction = guards.action({ permission: 'discount.manage', input: s.discountRef }, async ({ input, ctx }) => orders.adminDeleteDiscount(input.id, ctx.user!.id));

export const setProductDiscountActiveAction = guards.action({ permission: 'discount.manage', input: s.discountToggle }, async ({ input, ctx }) => {
  const rows = await catalog.setProductDiscountActive(input.id, input.isActive, ctx.user!.id);
  return { rows, storefront: await refreshStorefront([PRODUCTS_TAG]) };
});
