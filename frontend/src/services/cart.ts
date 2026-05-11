import { requireSupabaseClient } from '../lib/supabase';
import type { CartItem, CartItemRow } from '../types/commerce';

/**
 * Thrown when a cart operation requires an authenticated user but none is
 * available. Consumers should catch this and redirect to `/login.html`.
 */
export const LOGIN_REQUIRED = 'LOGIN_REQUIRED';

async function resolveUserId(): Promise<string> {
  const client = requireSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error(LOGIN_REQUIRED);
  return data.user.id;
}

/**
 * Returns the id of the caller's active cart, inserting a new cart row if
 * none exists. Idempotent for the same user; safe to call on every
 * add-to-cart action.
 */
export async function getOrCreateActiveCart(userId: string): Promise<{ id: string }> {
  const client = requireSupabaseClient();

  const { data: existing, error: selectError } = await client
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing?.id) return { id: existing.id as string };

  const { data: inserted, error: insertError } = await client
    .from('carts')
    .insert({ user_id: userId, status: 'active' })
    .select('id')
    .single();

  if (insertError) throw insertError;
  return { id: inserted.id as string };
}

/**
 * Returns the cart items joined with product name/image/sku and variant
 * info, ordered by creation time ascending.
 */
export async function listCartItems(cartId: string): Promise<CartItem[]> {
  const client = requireSupabaseClient();

  const { data, error } = await client
    .from('cart_items')
    .select(
      `
        id,
        cart_id,
        product_id,
        variant_id,
        quantity,
        unit_price_idr,
        created_at,
        products:product_id ( name, slug, sku, product_images(image_url, sort_order) ),
        product_variants:variant_id ( name, sku )
      `,
    )
    .eq('cart_id', cartId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as unknown as CartItemRow[];

  return rows.map((row) => {
    const images = row.products?.product_images ?? [];
    const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
    return {
      id: row.id,
      cart_id: row.cart_id,
      product_id: row.product_id,
      variant_id: row.variant_id,
      quantity: row.quantity,
      unit_price_idr: row.unit_price_idr,
      product_name: row.products?.name ?? 'Product',
      product_slug: row.products?.slug ?? '',
      product_image: sorted[0]?.image_url ?? null,
      variant_name: row.product_variants?.name ?? null,
      sku: row.product_variants?.sku ?? row.products?.sku ?? '',
    };
  });
}

/**
 * Adds a product (optionally a variant) to the caller's active cart. If the
 * same product/variant pair is already in the cart, the quantity is
 * incremented instead of creating a duplicate row.
 */
export async function addItemToCart(input: {
  productId: string;
  variantId?: string | null;
  quantity: number;
}): Promise<void> {
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    throw new Error('Quantity must be a positive integer.');
  }

  const client = requireSupabaseClient();
  const userId = await resolveUserId();
  const { id: cartId } = await getOrCreateActiveCart(userId);

  // Snapshot the unit price from the variant (if provided) otherwise from
  // the base product price so the cart reflects the price at the time of
  // the add action.
  let unitPrice: number;
  if (input.variantId) {
    const { data: variant, error } = await client
      .from('product_variants')
      .select('price_idr')
      .eq('id', input.variantId)
      .single();
    if (error) throw error;
    unitPrice = (variant?.price_idr as number) ?? 0;
  } else {
    const { data: product, error } = await client
      .from('products')
      .select('base_price_idr')
      .eq('id', input.productId)
      .single();
    if (error) throw error;
    unitPrice = (product?.base_price_idr as number) ?? 0;
  }

  // The unique index on (cart_id, product_id, variant_id) treats NULL
  // variant_id as "distinct" — so we first look up an existing row
  // explicitly and update quantity if found, otherwise insert.
  const existingQuery = client
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cartId)
    .eq('product_id', input.productId);

  const { data: existing, error: existingError } = input.variantId
    ? await existingQuery.eq('variant_id', input.variantId).maybeSingle()
    : await existingQuery.is('variant_id', null).maybeSingle();

  if (existingError) throw existingError;

  if (existing?.id) {
    const { error: updateError } = await client
      .from('cart_items')
      .update({ quantity: (existing.quantity as number) + input.quantity })
      .eq('id', existing.id);
    if (updateError) throw updateError;
    return;
  }

  const { error: insertError } = await client.from('cart_items').insert({
    cart_id: cartId,
    product_id: input.productId,
    variant_id: input.variantId ?? null,
    quantity: input.quantity,
    unit_price_idr: unitPrice,
  });

  if (insertError) throw insertError;
}

/**
 * Updates the quantity on a cart item. A non-positive quantity deletes the
 * row so the cart doesn't violate the `quantity > 0` check constraint.
 */
export async function updateCartItemQuantity(itemId: string, quantity: number): Promise<void> {
  const client = requireSupabaseClient();
  await resolveUserId();

  if (quantity <= 0) {
    const { error } = await client.from('cart_items').delete().eq('id', itemId);
    if (error) throw error;
    return;
  }

  const { error } = await client
    .from('cart_items')
    .update({ quantity })
    .eq('id', itemId);
  if (error) throw error;
}

export async function removeCartItem(itemId: string): Promise<void> {
  const client = requireSupabaseClient();
  await resolveUserId();

  const { error } = await client.from('cart_items').delete().eq('id', itemId);
  if (error) throw error;
}

/**
 * Returns a lightweight summary of the cart computed client-side. Used by
 * header badges where we only need the count + total.
 */
export async function getCartSummary(cartId: string): Promise<{ itemCount: number; totalIdr: number }> {
  const client = requireSupabaseClient();

  const { data, error } = await client
    .from('cart_items')
    .select('quantity, unit_price_idr')
    .eq('cart_id', cartId);

  if (error) throw error;

  const rows = (data ?? []) as Array<{ quantity: number; unit_price_idr: number }>;
  let itemCount = 0;
  let totalIdr = 0;
  for (const row of rows) {
    itemCount += row.quantity;
    totalIdr += row.quantity * row.unit_price_idr;
  }
  return { itemCount, totalIdr };
}
