'use server';

import * as auth from '@tuw/heart/modules/auth';
import * as customers from '@tuw/heart/modules/customers';
import { customerSchemas as s } from '@tuw/heart/modules/customers';
import { guards } from './session';

// Admin customer actions. Reading the directory needs customer.view;
// writing (new customers, notes) needs customer.update_status.

export const addCustomerNoteAction = guards.action({ permission: 'customer.update_status', input: s.note }, async ({ input, ctx }) =>
  customers.addCustomerNote(input.profileId, ctx.user!.id, input.note));

export const createCustomerAction = guards.action(
  { permission: 'customer.update_status', input: s.createCustomer, idempotent: { scope: 'customer.create' } },
  async ({ input, ctx }) => {
    const [firstName = '', ...rest] = input.name.split(/\s+/);
    // The set-password link opens on the storefront, where customers sign in.
    const origin = process.env.STOREFRONT_URL ?? 'http://localhost:3007';
    const created = await auth.createCustomerAccount({ email: input.email, firstName, lastName: rest.join(' '), phone: input.phone }, { origin });
    if (input.initialNote) await customers.addCustomerNote(created.profileId, ctx.user!.id, input.initialNote);
    return { profileId: created.profileId, devLink: created.devLink ?? null };
  },
);
