import { requireSupabaseClient } from '../lib/supabase';

export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export async function listProductCategories(): Promise<ProductCategory[]> {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('product_categories')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return (data ?? []) as ProductCategory[];
}

export async function createProductCategory(name: string): Promise<ProductCategory> {
  const client = requireSupabaseClient();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const { data: existing } = await client
    .from('product_categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = ((existing as { sort_order?: number } | null)?.sort_order ?? 0) + 1;

  const { data, error } = await client
    .from('product_categories')
    .insert({ name: name.toUpperCase().trim(), slug, sort_order: nextOrder })
    .select()
    .single();
  if (error) throw error;
  return data as ProductCategory;
}

export async function updateProductCategory(id: string, name: string): Promise<void> {
  const client = requireSupabaseClient();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const { error } = await client
    .from('product_categories')
    .update({ name: name.toUpperCase().trim(), slug })
    .eq('id', id);
  if (error) throw error;
}

export async function toggleCategoryActive(id: string, isActive: boolean): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client
    .from('product_categories')
    .update({ is_active: isActive })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteProductCategory(id: string): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client.from('product_categories').delete().eq('id', id);
  if (error) throw error;
}
