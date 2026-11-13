'use client';

import Link from 'next/link';
import { User } from 'lucide-react';
import { useSession, type SessionSummary } from '@storefront/lib/session';

const linkClass =
  'hidden sm:flex w-8 h-8 sm:w-9 sm:h-9 rounded-full items-center justify-center text-store-text-primary hover:text-black hover:bg-black/5 active:scale-95 transition-all cursor-pointer';

/** Account icon / initials. Static fallback is the signed-out icon (same size). */
export function AccountLinkView({ session }: { session: SessionSummary | null }) {
  const initials = session?.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <Link href={session ? '/account' : '/login'} aria-label={session ? `My account (${session.name})` : 'Log in'} className={linkClass}>
      {initials ? (
        <span className="w-7 h-7 rounded-full bg-store-charcoal text-white text-2xs font-medium flex items-center justify-center">{initials}</span>
      ) : (
        <User size={20} />
      )}
    </Link>
  );
}

export function HeaderAccountLink() {
  const { session } = useSession();
  return <AccountLinkView session={session} />;
}
