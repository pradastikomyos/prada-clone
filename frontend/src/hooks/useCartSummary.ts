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
