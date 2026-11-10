import { getSettings } from '@tuw/heart/modules/settings';
import { listProviders } from '@tuw/heart/integrations/registry';
import { session } from '@/server/session';
import SettingsView from './SettingsView';
import { PROVIDER_TABS, type SettingsTab } from './tabs';

// Server Component for every /settings/<tab> route: guard, then read the
// live values (staff always see the database, never a cache).
export default async function SettingsScreen({ tab }: { tab: SettingsTab }) {
  await session.requireStaff('settings.manage', `/settings/${tab}`);
  const categories = tab in PROVIDER_TABS ? PROVIDER_TABS[tab as keyof typeof PROVIDER_TABS] : [];
  const [values, providers] = await Promise.all([
    getSettings(),
    Promise.all(categories.map((c) => listProviders(c))).then((lists) => lists.flat()),
  ]);
  return <SettingsView tab={tab} values={values} providers={providers} />;
}
