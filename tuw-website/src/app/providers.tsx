'use client';

import React from 'react';
import { StoreProvider } from '@storefront/mocks/store';
import { SessionProvider, type SessionSummary } from '@storefront/lib/session';
import { SiteSettingsProvider } from '@storefront/lib/site-settings';
import type { PublicSettings } from '@/server/settings';

export function Providers({ children, session, settings }: { children: React.ReactNode; session: Promise<SessionSummary | null>; settings: PublicSettings }) {
  return (
    <SiteSettingsProvider settings={settings}>
      <SessionProvider session={session}>
        <StoreProvider>{children}</StoreProvider>
      </SessionProvider>
    </SiteSettingsProvider>
  );
}
