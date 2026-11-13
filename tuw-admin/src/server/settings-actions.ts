'use server';

import { z } from 'zod';
import * as settings from '@tuw/heart/modules/settings';
import { SETTING_KEYS, settingsSchemas } from '@tuw/heart/modules/settings';
import { updateProvider } from '@tuw/heart/integrations/registry';
import { guards } from './session';
import { refreshStorefront } from './storefront-cache';

// Store settings + integration toggles. Both need settings.manage (admin role).

export const saveSettingsAction = guards.action({ permission: 'settings.manage', input: settingsSchemas.save }, async ({ input, ctx }) => {
  const result = await settings.updateSettings(input.group, input.values, ctx.user!.id);
  // Only public keys change what shoppers see; staff-only saves skip the call.
  const touchesStorefront = result.changed.some((k) => SETTING_KEYS[k].public);
  const storefront = touchesStorefront ? await refreshStorefront([settings.SETTINGS_TAG]) : null;
  return { ...result, storefront };
});

export const updateProviderAction = guards.action(
  {
    permission: 'settings.manage',
    input: z.object({ slug: z.string().min(1).max(30), isActive: z.boolean().optional(), environment: z.enum(['sandbox', 'live']).optional() }),
  },
  async ({ input, ctx }) => updateProvider(input.slug, { isActive: input.isActive, environment: input.environment }, ctx.user!.id),
);
