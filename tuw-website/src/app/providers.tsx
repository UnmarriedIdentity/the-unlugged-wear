'use client';

import React from 'react';
import { StoreProvider } from '@storefront/mocks/store';
import { SessionProvider, type SessionSummary } from '@storefront/lib/session';
import { SiteSettingsProvider } from '@storefront/lib/site-settings';
import type { PublicSettings } from '@/server/settings';
import type { Catalog } from '@/server/catalog';

export function Providers({ children, session, settings, catalog }: { children: React.ReactNode; session: Promise<SessionSummary | null>; settings: PublicSettings; catalog: Catalog }) {
  return (
    <SiteSettingsProvider settings={settings}>
      <SessionProvider session={session}>
        <StoreProvider catalog={catalog}>{children}</StoreProvider>
      </SessionProvider>
    </SiteSettingsProvider>
  );
}
