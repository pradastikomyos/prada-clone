import { useQuery } from '@tanstack/react-query';
import { requireSupabaseClient } from '../lib/supabase';

export type MyOrderItem = {
  product_name: string;
  quantity: number;
  unit_price_idr: number;
  line_total_idr: number;
};

export type MyOrderPickupCode = {
  code: string;
  qr_payload: string;
};

export type MyOrder = {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string | null;
  status: string;
  payment_status: string;
  total_amount_idr: number;
  paid_at: string | null;
  created_at: string;
  pickup_codes: MyOrderPickupCode[] | MyOrderPickupCode | null;
  order_items: MyOrderItem[] | null;
};

export function useMyOrders(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['my-orders', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return [] as MyOrder[];

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
          pickup_codes(code, qr_payload),
          order_items(product_name, quantity, unit_price_idr, line_total_idr)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Supabase may return pickup_codes as a single object (due to unique constraint)
      // or as an array. Normalize to always be an array.
      const normalized = (data ?? []).map((row: any) => ({
        ...row,
        pickup_codes: row.pickup_codes == null
          ? []
          : Array.isArray(row.pickup_codes)
            ? row.pickup_codes
            : [row.pickup_codes],
      }));

      return normalized as MyOrder[];
    },
    staleTime: 0,
  });
}
