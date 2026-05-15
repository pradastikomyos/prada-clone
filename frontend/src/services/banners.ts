import { requireSupabaseClient } from '../lib/supabase';

export type BannerPage = 'home' | 'women' | 'men' | 'login';

export type Banner = {
  id: string;
  page: BannerPage;
  label: string;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type BannerInput = Pick<Banner, 'page' | 'label' | 'image_url' | 'link_url' | 'is_active' | 'sort_order'>;

export async function listBanners(): Promise<Banner[]> {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('banners')
    .select('*')
    .order('page')
    .order('sort_order');
  if (error) throw error;
  return (data ?? []) as Banner[];
}

export async function createBanner(input: BannerInput): Promise<Banner> {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('banners')
    .insert({ ...input, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data as Banner;
}

export async function updateBanner(id: string, input: Partial<BannerInput>): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client
    .from('banners')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteBanner(id: string): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client.from('banners').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleBannerActive(id: string, isActive: boolean): Promise<void> {
  return updateBanner(id, { is_active: isActive });
}
