import { redirect } from 'next/navigation';

// Staff emails are verified by accepting an invitation, so there is no
// separate code-entry step any more.
export default function Page() {
  redirect('/login');
}
