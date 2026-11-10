'use client';

import React, { createContext, useContext } from 'react';
import type { PublicSettings } from '@/server/settings';

// Store settings for Client Components. The root layout reads them once
// (cached, part of the static shell) and passes plain values down — no
// fetch, no Suspense, no flash.
const SiteSettingsContext = createContext<PublicSettings | null>(null);

export function SiteSettingsProvider({ settings, children }: { settings: PublicSettings; children: React.ReactNode }) {
  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings(): PublicSettings {
  const settings = useContext(SiteSettingsContext);
  if (!settings) throw new Error('useSiteSettings must be used inside SiteSettingsProvider');
  return settings;
}

/** "₹3,000" / "₹149.50" from paise — display only. */
export const rupeesLabel = (paise: number): string =>
  `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: paise % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
