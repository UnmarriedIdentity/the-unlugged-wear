import 'server-only';

// Settings module — public API (backend-modules skill). Owns store_settings.
export * from './service.ts';
export { SETTING_KEYS, keysInGroup, isSettingKey, type SettingKey, type SettingGroup, type SettingsValues } from './keys.ts';
export * as settingsSchemas from './schemas.ts';

/** Cache tag for everything read from store_settings (storefront + admin). */
export const SETTINGS_TAG = 'settings';
