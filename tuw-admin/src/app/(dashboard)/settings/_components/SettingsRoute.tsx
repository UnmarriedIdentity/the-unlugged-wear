import { Suspense } from 'react';
import PageSkeleton from '@/components/layout/PageSkeleton';
import SettingsScreen from './SettingsScreen';
import type { SettingsTab } from './tabs';

// One Suspense boundary per tab route: switching tabs shows the skeleton at
// once while the guard + database read stream in (a loading.tsx above the
// tabs would be shared by all of them and block tab-to-tab navigation).
export default function SettingsRoute({ tab }: { tab: SettingsTab }) {
  return (
    <Suspense fallback={<PageSkeleton pageTitle="Settings" />}>
      <SettingsScreen tab={tab} />
    </Suspense>
  );
}
