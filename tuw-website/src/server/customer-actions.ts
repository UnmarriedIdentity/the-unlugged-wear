'use server';

import * as auth from '@tuw/heart/modules/auth';
import * as customers from '@tuw/heart/modules/customers';
import { customerSchemas as s } from '@tuw/heart/modules/customers';
import { authSchemas } from '@tuw/heart/modules/auth';
import { getEmailSender, showDevLinks } from '@tuw/heart/integrations/email';
import { guards, session } from './session';

// Account actions (server-actions skill): signed-in customers only; every
// call resolves the profile from the session, never from the client.
const me = async (userId: string) => customers.profileIdForUser(userId);

export const updateProfileAction = guards.action({ access: 'customer', input: s.profile }, async ({ input, ctx }) =>
  customers.updateMyProfile(ctx.user!.id, input));

export const changePasswordAction = guards.action({ access: 'customer', input: authSchemas.changePassword }, async ({ input, ctx }) => {
  await auth.changePassword(ctx.user!.id, input.currentPassword, input.newPassword);
  // Every session was revoked; sign this browser in again with fresh tokens.
  const profile = await customers.getMyProfile(ctx.user!.id);
  const tokens = await auth.login({ email: profile.email, password: input.newPassword, app: 'storefront' }, await session.requestMeta());
  await session.setSession(tokens, true);
  return { done: true };
});

export const saveAddressAction = guards.action({ access: 'customer', input: s.address }, async ({ input, ctx }) =>
  customers.saveAddress(await me(ctx.user!.id), input));

export const deleteAddressAction = guards.action({ access: 'customer', input: s.addressId }, async ({ input, ctx }) =>
  customers.deleteAddress(await me(ctx.user!.id), input.addressId));

export const setDefaultAddressAction = guards.action({ access: 'customer', input: s.addressId }, async ({ input, ctx }) =>
  customers.setDefaultAddress(await me(ctx.user!.id), input.addressId));

export const addMemberAction = guards.action({ access: 'customer', input: s.member }, async ({ input, ctx }) =>
  customers.addManagedMember(await me(ctx.user!.id), input));

export const updateMemberAction = guards.action({ access: 'customer', input: s.memberUpdate }, async ({ input, ctx }) =>
  customers.updateMember(await me(ctx.user!.id), input.profileId, input));

export const removeMemberAction = guards.action({ access: 'customer', input: s.memberRef }, async ({ input, ctx }) =>
  customers.removeMember(await me(ctx.user!.id), input.profileId));

export const setMemberRoleAction = guards.action({ access: 'customer', input: s.memberRole }, async ({ input, ctx }) =>
  customers.setMemberRole(await me(ctx.user!.id), input.profileId, input.role));

export const leaveHouseholdAction = guards.action({ access: 'customer', input: s.memberRef.partial() }, async ({ ctx }) =>
  customers.leaveHousehold(await me(ctx.user!.id)));

export const inviteToHouseholdAction = guards.action(
  { access: 'customer', input: s.householdInvite, idempotent: { scope: 'household.invite' } },
  async ({ input, ctx }) => {
    const { token, inviteId } = await customers.inviteToHousehold(await me(ctx.user!.id), input.email, ctx.user!.id);
    const link = `${(await session.requestMeta()).origin}/account/household/join?token=${token}`;
    await getEmailSender().send({ to: input.email.trim().toLowerCase(), subject: 'You are invited to a household on The Unplugged Wear', template: 'household.invite', link, dedupeKey: `household.invite:${inviteId}` });
    return { devLink: showDevLinks() ? link : null };
  },
);

export const revokeHouseholdInviteAction = guards.action({ access: 'customer', input: s.inviteRef }, async ({ input, ctx }) => {
  await customers.revokeHouseholdInvite(await me(ctx.user!.id), input.inviteId);
  return { done: true };
});

export const acceptHouseholdInviteAction = guards.action({ access: 'customer', input: s.householdAccept }, async ({ input, ctx }) => {
  const profile = await customers.getMyProfile(ctx.user!.id);
  return customers.acceptHouseholdInvite(input.token, ctx.user!.id, profile.email);
});
