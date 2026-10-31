import { redirect } from 'next/navigation';

// The admin has no sign-in screen of its own: /login on the storefront is the
// single entry point and routes the demo admin here after authenticating.
export default function RootPage() {
  redirect('/admin/dashboard');
}
