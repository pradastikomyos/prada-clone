import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export function requireSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase env belum diset. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di frontend/.env.local.');
  }

  return supabase;
}
