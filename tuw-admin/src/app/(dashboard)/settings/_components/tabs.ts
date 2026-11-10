// Settings tabs = real routes (/settings/<tab>), so each has its own URL,
// loading state and guard. Store-setting tabs map 1:1 to settings groups.
export const SETTINGS_TABS = [
  { id: 'general', label: 'General' },
  { id: 'brand', label: 'Brand' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'taxes', label: 'Taxes & Invoices' },
  { id: 'policies', label: 'Orders & Policies' },
  { id: 'payments', label: 'Payments' },
  { id: 'fulfillment', label: 'Fulfillment' },
  { id: 'notifications', label: 'Notifications' },
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number]['id'];
export const PROVIDER_TABS = { payments: ['payment'], fulfillment: ['fulfillment', 'shipping'] } as const;
