import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function getBearerToken(req: Request) {
  const authorization = req.headers.get('Authorization') ?? '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

async function getCaller(req: Request, supabaseUrl: string, serviceRoleKey: string) {
  const token = getBearerToken(req);
  if (!token || token === Deno.env.get('SUPABASE_ANON_KEY')) {
    return { userId: null, isAdmin: false };
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { userId: null, isAdmin: false };

  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  return { userId: data.user.id, isAdmin: profile?.role === 'admin' };
}

function publicOrder(order: Record<string, unknown>) {
  const { user_id: _userId, ...safeOrder } = order;
  return safeOrder;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const payload = await req.json().catch(() => ({}));
    const invoiceNumber = String(payload.invoice_number ?? payload.invoiceNumber ?? '').trim();
    if (!invoiceNumber) return jsonResponse({ error: 'Invoice number is required' }, 400);

    const supabaseUrl = requiredEnv('SUPABASE_URL');
    const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
    const caller = await getCaller(req, supabaseUrl, serviceRoleKey);
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
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
    if (!order) {
      return jsonResponse({
        kind: 'not_found',
        order: null,
        message: 'Invoice was not found.',
        can_reconcile: false,
      });
    }

    if (!caller.userId || (!caller.isAdmin && order.user_id !== caller.userId)) {
      return jsonResponse({
        kind: 'not_owner',
        order: null,
        message: 'This invoice belongs to a different account.',
        can_reconcile: false,
      });
    }

    const kind = order.status === 'pending_payment'
      ? 'pending'
      : order.payment_status === 'paid'
        ? 'paid'
        : 'found';

    return jsonResponse({
      kind,
      order: publicOrder(order),
      can_reconcile: order.status === 'pending_payment',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected checkout result error';
    return jsonResponse({ error: message }, 500);
  }
});
