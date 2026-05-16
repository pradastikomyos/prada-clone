import { requireSupabaseClient } from '../lib/supabase';
import { AdminOrder, OrderStatus, PaymentStatus } from '../types/commerce';

export type CheckoutResultOrder = {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
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
