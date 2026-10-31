'use client';

import React from 'react';
import { StoreProvider } from '@storefront/mocks/store';

export function Providers({ children }: { children: React.ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>;
}
