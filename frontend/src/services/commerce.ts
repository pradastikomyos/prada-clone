import { requireSupabaseClient } from '../lib/supabase';
import { AdminOrder, AdminProduct, ProductFormInput, PublicProduct } from '../types/commerce';

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

export async function listAdminOrders() {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('orders')
    .select(`
      id,
      invoice_number,
      customer_name,
      customer_email,
      customer_phone,
      status,
      payment_status,
      total_amount_idr,
      doku_payment_url,
      paid_at,
      picked_up_at,
      created_at,
      pickup_codes(code, qr_payload, verified_at),
      order_items(product_name, sku, quantity, unit_price_idr, line_total_idr)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []) as AdminOrder[];
}

export async function verifyPickupCode(code: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client.functions.invoke('verify-pickup-code', {
    body: { code },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data?.result ?? null;
}

export async function createDokuCheckout(input: {
  customer: { name: string; email?: string; phone?: string };
  items: Array<{ product_id: string; variant_id?: string; quantity: number }>;
}) {
  const client = requireSupabaseClient();
  const { data, error } = await client.functions.invoke('create-doku-checkout', {
    body: input,
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as {
    order_id: string;
    invoice_number: string;
    payment_url: string;
    amount_idr: number;
  };
}

/**
 * Public product listing for the storefront. Filters by category and orders
 * by sort_order. Does not require authentication (RLS allows public read of
 * active products).
 */
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

/**
 * Fetch a single order by invoice number for the checkout result page.
 * Includes pickup codes and order items. Does not require admin role —
 * the user only needs to know the invoice number (passed via DOKU callback URL).
 */
export async function getOrderByInvoice(invoiceNumber: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('orders')
    .select(`
      id,
      invoice_number,
      customer_name,
      customer_email,
      status,
      payment_status,
      total_amount_idr,
      paid_at,
      created_at,
      pickup_codes(code, qr_payload, verified_at),
      order_items(product_name, sku, quantity, unit_price_idr, line_total_idr)
    `)
    .eq('invoice_number', invoiceNumber)
    .maybeSingle();

  if (error) throw error;
  return data as CheckoutResultOrder | null;
}

export type CheckoutResultOrder = {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string | null;
  status: import('../types/commerce').OrderStatus;
  payment_status: import('../types/commerce').PaymentStatus;
  total_amount_idr: number;
  paid_at: string | null;
  created_at: string;
  pickup_codes: Array<{
    code: string;
    qr_payload: string;
    verified_at: string | null;
  }> | null;
  order_items: Array<{
    product_name: string;
    sku: string;
    quantity: number;
    unit_price_idr: number;
    line_total_idr: number;
  }> | null;
};
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
      product_images(image_url, alt, sort_order)
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as PublicProduct | null;
}
