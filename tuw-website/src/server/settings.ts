import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { getPublicSettings, fallbackPublicSettings, SETTINGS_TAG, type PublicSettings } from '@tuw/heart/modules/settings';

export type { PublicSettings };

// Same-for-everyone store settings (cache-components skill): part of the
// static shell, refreshed when the admin saves (POST /api/revalidate expires
// the 'settings' tag) or after an hour at the latest. If the database is
// unreachable the shell still renders with the seed defaults, cached for
// minutes only so the real values return quickly.
export async function getStorefrontSettings(): Promise<PublicSettings> {
  'use cache';
  cacheTag(SETTINGS_TAG);
  try {
    const settings = await getPublicSettings();
    cacheLife('hours');
    return settings;
  } catch (error) {
    console.error('[settings] falling back to defaults:', (error as Error).message);
    cacheLife('minutes');
    return fallbackPublicSettings();
  }
}
