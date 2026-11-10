'use client';

import React from 'react';
import { StoreProvider } from '@storefront/mocks/store';
import { SessionProvider, type SessionSummary } from '@storefront/lib/session';

export function Providers({ children, session }: { children: React.ReactNode; session: Promise<SessionSummary | null> }) {
  return (
    <SessionProvider session={session}>
      <StoreProvider>{children}</StoreProvider>
    </SessionProvider>
  );
}
