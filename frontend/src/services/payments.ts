import { requireSupabaseClient } from '../lib/supabase';
import { AdminOrder, PaymentStatus } from '../types/commerce';

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
