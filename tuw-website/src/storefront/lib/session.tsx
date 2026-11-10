'use client';

import { createContext, use, useCallback, useContext, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAction } from '@/server/auth-actions';

// Real shopper session for client components (replaces the demo
// localStorage session). The root layout passes an un-awaited promise;
// components read it with use() inside a <Suspense> boundary
// (nextjs-rendering / auth-guards skills).

export interface SessionSummary {
  name: string;
  email: string;
}

const SessionContext = createContext<Promise<SessionSummary | null> | null>(null);

export function SessionProvider({ session, children }: { session: Promise<SessionSummary | null>; children: ReactNode }) {
  return <SessionContext value={session}>{children}</SessionContext>;
}

/** Suspends until the session is known — render inside <Suspense>. */
export function useSession() {
  const promise = useContext(SessionContext);
  const session = promise ? use(promise) : null;
  const router = useRouter();
  const signOut = useCallback(async () => {
    await logoutAction({});
    router.push('/');
    router.refresh();
  }, [router]);
  return { session, ready: true as const, signOut };
}
