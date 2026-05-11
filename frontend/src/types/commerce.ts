export type ProductStatus = 'draft' | 'active' | 'archived';
export type OrderStatus = 'pending_payment' | 'paid' | 'pending_pickup' | 'picked_up' | 'cancelled' | 'expired';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled';

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  category: string;
  status: ProductStatus;
  base_price_idr: number;
  sort_order: number;
  product_images?: Array<{
    id: string;
    image_url: string;
    alt: string | null;
    sort_order: number;
  }>;
  product_variants?: Array<{
    id: string;
    name: string;
    sku: string;
    price_idr: number;
    stock_quantity: number;
  }>;
};

export type AdminOrder = {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount_idr: number;
  doku_payment_url: string | null;
  paid_at: string | null;
  picked_up_at: string | null;
  created_at: string;
  pickup_codes?: Array<{
    code: string;
    qr_payload: string;
    verified_at: string | null;
  }>;
  order_items?: Array<{
    product_name: string;
    sku: string;
    quantity: number;
    unit_price_idr: number;
    line_total_idr: number;
  }>;
};

export type ProductFormInput = {
  name: string;
  slug: string;
  sku: string;
  description: string;
  category: string;
  status: ProductStatus;
  priceIdr: number;
  stockQuantity: number;
  imageUrl: string;
};

/**
 * Public-facing product shape returned for listing + PDP queries.
 * Kept intentionally narrower than AdminProduct: only fields required
 * for rendering in the storefront.
 */
export type PublicProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  category: string;
  base_price_idr: number;
  sort_order: number;
  product_images: Array<{
    image_url: string;
    alt: string | null;
    sort_order: number;
  }>;
};

/**
 * Raw row shape returned by the joined cart_items query. Matches the
 * nested shape Supabase returns when selecting through foreign keys.
 */
export type CartItemRow = {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price_idr: number;
  created_at: string;
  products: {
    name: string;
    slug: string;
    sku: string;
    product_images: Array<{
      image_url: string;
      sort_order: number;
    }> | null;
  } | null;
  product_variants: {
    name: string;
    sku: string;
  } | null;
};

/**
 * Flattened cart item ready for rendering in the cart drawer.
 */
export type CartItem = {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price_idr: number;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  variant_name: string | null;
  sku: string;
};
