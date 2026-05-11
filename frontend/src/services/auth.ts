import { requireSupabaseClient } from '../lib/supabase';

export type AppRole = 'admin' | 'customer';

export async function getCurrentUserRole(): Promise<AppRole | null> {
  const client = requireSupabaseClient();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();

  if (sessionError) throw sessionError;
  const userId = sessionData.session?.user.id;
  if (!userId) return null;

  return getUserRole(userId);
}

export async function getUserRole(userId: string): Promise<AppRole | null> {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return (data?.role ?? null) as AppRole | null;
}

export function resolvePostLoginPath(role: AppRole | null, requestedRedirect: string | null) {
  if (role === 'admin') {
    return requestedRedirect && requestedRedirect.startsWith('/') ? requestedRedirect : '/admin';
  }

  return requestedRedirect && !requestedRedirect.includes('admin') ? requestedRedirect : '/';
}
