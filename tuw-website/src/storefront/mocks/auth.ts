import { useCallback, useEffect, useState } from 'react';

// Demo-only sign-in. There is no server: the session lives in this browser,
// and the only account that can log in is the seeded demo customer below.
// Live authentication is deferred to a later phase.

export const DEMO_AUTH_KEY = 'tuw_website_v2_auth';
const SESSION_EVENT = 'tuw-demo-session';

/** Seeded demo customer. Owns the fixture orders and the Indiranagar address. */
export const DEMO_ACCOUNT = {
  name: 'Arjun Rao',
  email: 'uk1115@tuw.co',
  password: 'uktuw1115',
} as const;

export interface DemoSession {
  name: string;
  email: string;
}

/** Returns the demo session when the email and password match the demo account. */
export function checkDemoCredentials(email: string, password: string): DemoSession | null {
  const address = email.trim().toLowerCase();
  const matches = address === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password;
  return matches ? { name: DEMO_ACCOUNT.name, email: DEMO_ACCOUNT.email } : null;
}

function parseSession(raw: string | null): DemoSession | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<DemoSession> & { loggedIn?: boolean };
    if (!value.loggedIn || !value.email) return null;
    return {
      name: value.name || value.email,
      email: value.email,
    };
  } catch {
    return null;
  }
}

/** "Remember me" sessions sit in localStorage; others last for the tab. */
export function readDemoSession(): DemoSession | null {
  try {
    return (
      parseSession(localStorage.getItem(DEMO_AUTH_KEY)) ||
      parseSession(sessionStorage.getItem(DEMO_AUTH_KEY))
    );
  } catch {
    return null;
  }
}

export function writeDemoSession(session: DemoSession, remember: boolean) {
  try {
    clearStoredSession();
    const store = remember ? localStorage : sessionStorage;
    store.setItem(DEMO_AUTH_KEY, JSON.stringify({ ...session, loggedIn: true }));
  } catch {
    // Storage blocked: the demo continues without a saved session.
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}

function clearStoredSession() {
  localStorage.removeItem(DEMO_AUTH_KEY);
  sessionStorage.removeItem(DEMO_AUTH_KEY);
}

export function clearDemoSession() {
  try {
    clearStoredSession();
  } catch {
    // Nothing stored to clear.
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}

/**
 * Current demo session. `ready` turns true after the first client read, so
 * pages can avoid flashing the signed-out state during hydration.
 */
export function useDemoSession() {
  const [session, setSession] = useState<DemoSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setSession(readDemoSession());
      setReady(true);
    };
    sync();
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const signOut = useCallback(() => clearDemoSession(), []);

  return { session, ready, signOut };
}
