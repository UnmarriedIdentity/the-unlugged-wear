'use client';

import React from 'react';
import { AdminStateProvider } from '@admin/mocks/state';

export function Providers({ children }: { children: React.ReactNode }) {
  return <AdminStateProvider>{children}</AdminStateProvider>;
}
