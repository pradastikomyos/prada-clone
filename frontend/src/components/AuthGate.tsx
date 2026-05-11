import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type AuthGateProps = {
  children: React.ReactNode;
};

/**
 * Waits for the Supabase auth session to be initialized before rendering
 * the app. This prevents a flash of the login redirect on page load when
 * the user is already authenticated.
 *
 * When Supabase is not configured, renders children immediately.
 */
export function AuthGate({ children }: AuthGateProps) {
  const [initialized, setInitialized] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // getSession() resolves immediately from local storage — no network call.
    supabase.auth.getSession().then(() => setInitialized(true));
  }, []);

  if (!initialized) {
    return null; // Blank screen for <100ms while session is read from storage
  }

  return <>{children}</>;
}
