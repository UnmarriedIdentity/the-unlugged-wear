'use server';

import { z } from 'zod';
import * as notifications from '@tuw/heart/modules/notifications';
import { guards } from './session';

// Staff bell. Each person reads and marks only their own rows; the permission
// matches who receives inventory alerts today (TL-BE-14 widens it).
const permission = 'product.update';

export const listNotificationsAction = guards.action({ permission, input: z.object({}) }, async ({ ctx }) => notifications.listNotifications(ctx.user!.id));

export const markNotificationReadAction = guards.action({ permission, input: z.object({ id: z.string().uuid() }) }, async ({ input, ctx }) => {
  await notifications.markNotificationRead(ctx.user!.id, input.id);
  return { ok: true };
});

export const markAllNotificationsReadAction = guards.action({ permission, input: z.object({}) }, async ({ ctx }) => {
  await notifications.markAllNotificationsRead(ctx.user!.id);
  return { ok: true };
});
