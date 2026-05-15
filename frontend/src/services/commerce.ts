import { requireSupabaseClient } from '../lib/supabase';
import { AdminOrder, AdminProduct, PaymentStatus, ProductFormInput, PublicProduct } from '../types/commerce';

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

export async function getOrderByPickupCode(code: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('pickup_codes')
    .select(`
      code,
      order_id,
      orders(
        id, invoice_number, customer_name, customer_email, customer_phone,
        status, payment_status, total_amount_idr, paid_at, picked_up_at, created_at,
        order_items(product_name, sku, quantity, unit_price_idr, line_total_idr)
      )
    `)
    .eq('code', code.toUpperCase().trim())
    .maybeSingle();
  if (error) throw error;
  if (!data?.orders) return null;
  return data.orders as unknown as AdminOrder;
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

export type CheckoutResultKind = 'found' | 'pending' | 'paid' | 'not_owner' | 'not_found';

export type CheckoutResultResponse = {
  kind: CheckoutResultKind;
  order: CheckoutResultOrder | null;
  message?: string;
  can_reconcile?: boolean;
  raw?: unknown;
};

export type DokuReconcileResponse = {
  ok: boolean;
  invoice_number?: string;
  order?: CheckoutResultOrder | null;
  payment_status?: PaymentStatus | string;
  provider_status?: string;
  changed?: boolean;
  message?: string;
  raw?: unknown;
};

function normalizeCheckoutResult(data: any): CheckoutResultResponse {
  const result = data?.result ?? data;
  const order = (result?.order ?? null) as CheckoutResultOrder | null;
  const rawKind = result?.kind ?? result?.outcome ?? result?.status;
  const kind: CheckoutResultKind =
    rawKind === 'not_owner' ||
    rawKind === 'not_found' ||
    rawKind === 'pending' ||
    rawKind === 'paid' ||
    rawKind === 'found'
      ? rawKind
      : order
        ? 'found'
        : 'not_found';

  return {
    kind,
    order,
    message: result?.message,
    can_reconcile: result?.can_reconcile ?? result?.canReconcile,
    raw: data,
  };
}

/**
 * Customer-safe checkout result lookup. The server function owns the privileged
 * order read and can distinguish missing invoices from RLS/ownership denial.
 */
export async function getCheckoutResult(invoiceNumber: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client.functions.invoke('get-checkout-result', {
    body: {
      invoice_number: invoiceNumber,
      invoiceNumber,
    },
  });

  if (error) throw error;
  if (data?.error && !data?.status && !data?.kind && !data?.outcome) {
    throw new Error(data.error);
  }

  return normalizeCheckoutResult(data);
}

/**
 * Ask the backend to reconcile one DOKU checkout via provider status APIs.
 * The browser only sends an invoice/order identifier; DOKU secrets remain server-side.
 */
export async function reconcileDokuPayment(input: { invoice_number?: string; invoiceNumber?: string; order_id?: string }) {
  const client = requireSupabaseClient();
  const invoiceNumber = input.invoice_number ?? input.invoiceNumber;
  const { data, error } = await client.functions.invoke('reconcile-doku-payment', {
    body: {
      ...input,
      invoice_number: invoiceNumber,
      invoiceNumber,
    },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  const result = data?.result ?? data;
  return {
    ok: result?.ok ?? true,
    invoice_number: result?.invoice_number ?? result?.invoiceNumber ?? invoiceNumber,
    order: (result?.order ?? null) as CheckoutResultOrder | null,
    payment_status: result?.payment_status ?? result?.paymentStatus,
    provider_status: result?.provider_status ?? result?.providerStatus ?? result?.doku_status,
    changed: result?.changed ?? result?.reconciled ?? result?.updated,
    message: result?.message,
    raw: data,
  } satisfies DokuReconcileResponse;
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

export type AdminPaymentAttempt = {
  id: string;
  order_id: string;
  provider: string;
  provider_reference: string | null;
  request_id: string | null;
  status: PaymentStatus | string;
  amount_idr: number;
  raw_payload: unknown;
  created_at: string;
  updated_at: string;
  order: Pick<
    AdminOrder,
    'id' | 'invoice_number' | 'customer_name' | 'customer_email' | 'status' | 'payment_status' | 'total_amount_idr' | 'paid_at' | 'created_at'
  > | null;
};

export type AdminPaymentEvent = {
  id: string;
  order_id?: string | null;
  invoice_number?: string | null;
  provider?: string | null;
  event_source?: string | null;
  provider_event_id?: string | null;
  provider_request_id?: string | null;
  request_id?: string | null;
  event_type?: string | null;
  status?: string | null;
  processing_status?: string | null;
  error_message?: string | null;
  raw_payload?: unknown;
  processed_at?: string | null;
  created_at?: string | null;
};

function firstRelated<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function listAdminPaymentAttempts(limit = 50) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('payment_attempts')
    .select(`
      id,
      order_id,
      provider,
      provider_reference,
      request_id,
      status,
      amount_idr,
      raw_payload,
      created_at,
      updated_at,
      orders(
        id,
        invoice_number,
        customer_name,
        customer_email,
        status,
        payment_status,
        total_amount_idr,
        paid_at,
        created_at
      )
    `)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    order_id: row.order_id,
    provider: row.provider,
    provider_reference: row.provider_reference,
    request_id: row.request_id,
    status: row.status,
    amount_idr: row.amount_idr,
    raw_payload: row.raw_payload,
    created_at: row.created_at,
    updated_at: row.updated_at,
    order: firstRelated(row.orders),
  })) as AdminPaymentAttempt[];
}

export async function listAdminPaymentEvents(limit = 50) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('payment_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as AdminPaymentEvent[];
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
