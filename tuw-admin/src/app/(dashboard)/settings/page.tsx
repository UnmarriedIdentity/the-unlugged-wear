import { redirect } from 'next/navigation';

// /settings opens the first tab; every tab is its own route.
export default function SettingsIndex() {
  redirect('/settings/general');
}
