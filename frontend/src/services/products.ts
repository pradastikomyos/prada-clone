import { requireSupabaseClient } from '../lib/supabase';
import { AdminProduct, ProductFormInput, PublicProduct } from '../types/commerce';

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function makeSku(name: string) {
  const prefix = name
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .padEnd(3, 'X');
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${prefix}${suffix}`;
}

export async function listAdminProducts() {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('products')
    .select(`
      id,
      name,
      slug,
      sku,
      description,
      category,
      status,
      base_price_idr,
      sort_order,
      product_images(id, image_url, alt, sort_order),
      product_variants(id, name, sku, price_idr, stock_quantity)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as AdminProduct[];
}

export async function createProduct(input: ProductFormInput) {
  const client = requireSupabaseClient();
  const { data: product, error: productError } = await client
    .from('products')
    .insert({
      name: input.name,
      slug: input.slug,
      sku: input.sku,
      description: input.description || null,
      category: input.category,
      status: input.status,
      base_price_idr: input.priceIdr,
    })
    .select('id')
    .single();

  if (productError) throw productError;

  const { error: variantError } = await client.from('product_variants').insert({
    product_id: product.id,
    name: input.name,
    sku: input.sku,
    price_idr: input.priceIdr,
    stock_quantity: input.stockQuantity,
  });

  if (variantError) throw variantError;

  if (input.imageUrl) {
    const { error: imageError } = await client.from('product_images').insert({
      product_id: product.id,
      image_url: input.imageUrl,
      alt: input.name,
      sort_order: 0,
    });

    if (imageError) throw imageError;
  }

  return product.id as string;
}

export async function updateProduct(
  productId: string,
  input: Partial<Pick<ProductFormInput, 'name' | 'description' | 'status' | 'priceIdr' | 'category'>>,
) {
  const client = requireSupabaseClient();

  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.description !== undefined) payload.description = input.description?.trim() ? input.description : null;
  if (input.status !== undefined) payload.status = input.status;
  if (input.category !== undefined) payload.category = input.category;
  if (input.priceIdr !== undefined) payload.base_price_idr = input.priceIdr;

  const { error } = await client.from('products').update(payload).eq('id', productId);
  if (error) throw error;
}

export async function updateProductStatus(productId: string, status: AdminProduct['status']) {
  const client = requireSupabaseClient();
  const { error } = await client.from('products').update({ status }).eq('id', productId);
  if (error) throw error;
}

export async function updateVariantStock(variantId: string, stockQuantity: number) {
  const client = requireSupabaseClient();
  const { error } = await client
    .from('product_variants')
    .update({ stock_quantity: stockQuantity })
    .eq('id', variantId);
  if (error) throw error;
}

export async function listProductsByCategory(category: string, limit = 50) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('products')
    .select(`
      id,
      name,
      slug,
      sku,
      description,
      category,
      base_price_idr,
      sort_order,
      product_images(image_url, alt, sort_order)
    `)
    .eq('category', category)
    .eq('status', 'active')
    .order('sort_order', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as PublicProduct[];
}

export async function getProductBySlug(slug: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('products')
    .select(`
      id,
      name,
      slug,
      sku,
      description,
      category,
      base_price_idr,
      sort_order,
      product_images(image_url, alt, sort_order),
      product_variants(id, name, sku, price_idr, stock_quantity, attributes)
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as PublicProductWithVariants | null;
}

export type PublicProductWithVariants = PublicProduct & {
  product_variants: Array<{
    id: string;
    name: string;
    sku: string;
    price_idr: number;
    stock_quantity: number;
    attributes: Record<string, string> | null;
  }>;
};
