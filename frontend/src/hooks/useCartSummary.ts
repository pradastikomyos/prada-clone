import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { getCartSummary, getOrCreateActiveCart } from '../services/cart';

/**
 * Watches the current Supabase auth session and returns the current user
 * id (or null if logged out). Used by cart-aware components that need to
 * gate queries and actions on auth state without triggering the login
 * redirect eagerly.
 */
export function useAuthUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUserId(data.session?.user.id ?? null);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return userId;
}

type AuthUser = {
  userId: string | null;
  /** Display name: full_name from profiles, or email prefix, or null if guest. */
  displayName: string | null;
  email: string | null;
  isLoggedIn: boolean;
  signOut: () => Promise<void>;
};

/**
 * Returns the current authenticated user's identity info.
 * Fetches `full_name` from the `profiles` table when logged in.
 */
export function useAuthUser(): AuthUser {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUserId(data.session?.user.id ?? null);
      setEmail(data.session?.user.email ?? null);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setEmail(session?.user.email ?? null);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId || !supabase) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();
      return data;
    },
    enabled: isSupabaseConfigured && Boolean(userId),
    staleTime: 5 * 60_000,
  });

  const fullName = profileQuery.data?.full_name as string | null | undefined;
  const emailPrefix = email ? email.split('@')[0] : null;
  const displayName = fullName ?? emailPrefix ?? null;

  const signOut = async () => {
    await supabase?.auth.signOut();
    window.location.href = '/';
  };

  return {
    userId,
    displayName,
    email,
    isLoggedIn: Boolean(userId),
    signOut,
  };
}

/**
 * Returns the current user's cart summary (count + total). Returns
 * `{ itemCount: 0, totalIdr: 0 }` when logged out or Supabase is not
 * configured.
 */
export function useCartSummary() {
  const userId = useAuthUserId();

  const query = useQuery({
    queryKey: ['cart-summary', userId],
    queryFn: async () => {
      if (!userId) return { itemCount: 0, totalIdr: 0 };
      const { id } = await getOrCreateActiveCart(userId);
      return getCartSummary(id);
    },
    enabled: isSupabaseConfigured && Boolean(userId),
  });

  return {
    itemCount: query.data?.itemCount ?? 0,
    totalIdr: query.data?.totalIdr ?? 0,
    isLoading: query.isLoading,
    userId,
  };
}
