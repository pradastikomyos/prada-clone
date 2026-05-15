import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizeUnknownError(error: unknown, fallbackMessage: string) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  if (error && typeof error === 'object') {
    const errorRecord = error as Record<string, unknown>;
    return {
      message: typeof errorRecord.message === 'string' ? errorRecord.message : fallbackMessage,
      code: errorRecord.code,
      details: errorRecord.details,
      hint: errorRecord.hint,
      phase: errorRecord.phase,
      raw: errorRecord,
    };
  }

  return {
    message: typeof error === 'string' ? error : fallbackMessage,
    raw: error,
  };
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

async function digestText(value: string) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hmacSignature(component: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(component));
  return `HMACSHA256=${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;
}

async function dokuGetHeaders(requestTarget: string) {
  const clientId = requiredEnv('DOKU_CLIENT_ID');
  const secretKey = requiredEnv('DOKU_SECRET_KEY');
  const requestId = crypto.randomUUID();
  const requestTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const component = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${requestTimestamp}`,
    `Request-Target:${requestTarget}`,
  ].join('\n');

  return {
    'Client-Id': clientId,
    'Request-Id': requestId,
    'Request-Timestamp': requestTimestamp,
    Signature: await hmacSignature(component, secretKey),
  };
}

function unwrapDokuPayload(payload: Record<string, unknown>) {
  return payload.response && typeof payload.response === 'object'
    ? payload.response as Record<string, unknown>
    : payload;
}

function nestedRecord(parent: Record<string, unknown>, key: string) {
  const value = parent[key];
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function extractProviderStatus(payload: Record<string, unknown>) {
  const body = unwrapDokuPayload(payload);
  const transaction = nestedRecord(body, 'transaction');
  const payment = nestedRecord(body, 'payment');
  const order = nestedRecord(body, 'order');
  return String(
    transaction.status ??
    transaction.transaction_status ??
    payment.status ??
    order.status ??
    body.status ??
    '',
  ).toLowerCase();
}

function mapPaymentStatus(providerStatus: string): PaymentStatus {
  if (['success', 'settlement', 'capture', 'paid'].includes(providerStatus)) return 'paid';
  if (providerStatus === 'expired') return 'expired';
  if (['cancelled', 'canceled'].includes(providerStatus)) return 'cancelled';
  if (['failed', 'deny'].includes(providerStatus)) return 'failed';
  return 'pending';
}

function extractInvoiceNumber(payload: Record<string, unknown>, fallback: string) {
  const body = unwrapDokuPayload(payload);
  const order = nestedRecord(body, 'order');
  const transaction = nestedRecord(body, 'transaction');
  return String(order.invoice_number ?? order.invoiceNumber ?? transaction.invoice_number ?? body.invoice_number ?? fallback);
}

function extractResponseRequestId(payload: Record<string, unknown>) {
  const body = unwrapDokuPayload(payload);
  const headers = nestedRecord(body, 'headers');
  return (headers.requestId ?? headers.request_id ?? null) as string | null;
}

function extractAmount(payload: Record<string, unknown>) {
  const body = unwrapDokuPayload(payload);
  const order = nestedRecord(body, 'order');
  const amount = order.amount ?? body.amount;
  const numericAmount = typeof amount === 'number' ? amount : Number(amount);
  return Number.isFinite(numericAmount) ? numericAmount : null;
}

function extractProviderReference(payload: Record<string, unknown>) {
  const body = unwrapDokuPayload(payload);
  const order = nestedRecord(body, 'order');
  const transaction = nestedRecord(body, 'transaction');
  const payment = nestedRecord(body, 'payment');
  return (
    order.session_id ??
    transaction.id ??
    transaction.transaction_id ??
    payment.id ??
    null
  ) as string | null;
}

function decodeJwtRole(token: string): string | null {
  try {
    const [, payloadPart] = token.split('.');
    if (!payloadPart) return null;
    // base64url -> base64
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);
    const claims = JSON.parse(decoded) as { role?: string };
    return claims?.role ?? null;
  } catch {
    return null;
  }
}

async function getCaller(req: Request, supabaseUrl: string, serviceRoleKey: string) {
  const token = getBearerToken(req);
  if (!token || token === Deno.env.get('SUPABASE_ANON_KEY')) {
    return { userId: null, isAdmin: false, isSystem: false };
  }

  // System caller: trusted server-to-server invocation with service role key.
  // Match either the env-injected key or the JWT role claim, since the env
  // var can drift from the live key after a rotation.
  if (token === serviceRoleKey || decodeJwtRole(token) === 'service_role') {
    return { userId: null, isAdmin: true, isSystem: true };
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { userId: null, isAdmin: false, isSystem: false };

  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  return {
    userId: data.user.id,
    isAdmin: profile?.role === 'admin',
    isSystem: false,
  };
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
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const caller = await getCaller(req, supabaseUrl, serviceRoleKey);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, invoice_number, status, payment_status')
      .eq('invoice_number', invoiceNumber)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) return jsonResponse({ error: 'Order not found for invoice' }, 404);
    if (!caller.isSystem && (!caller.userId || (!caller.isAdmin && order.user_id !== caller.userId))) {
      return jsonResponse({ error: 'This invoice belongs to a different account' }, 403);
    }

    const requestTarget = `/orders/v1/status/${encodeURIComponent(invoiceNumber)}`;
    const dokuBaseUrl = Deno.env.get('DOKU_BASE_URL') ?? 'https://api-sandbox.doku.com';
    const headers = await dokuGetHeaders(requestTarget);
    const dokuResponse = await fetch(`${dokuBaseUrl}${requestTarget}`, {
      method: 'GET',
      headers,
    });

    const rawText = await dokuResponse.text();
    let dokuJson: Record<string, unknown>;
    try {
      dokuJson = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      dokuJson = { raw: rawText };
    }

    if (!dokuResponse.ok) {
      return jsonResponse({
        error: 'DOKU check status failed',
        detail: dokuJson,
      }, 502);
    }

    const providerStatus = extractProviderStatus(dokuJson);
    const paymentStatus = mapPaymentStatus(providerStatus);
    const resolvedInvoice = extractInvoiceNumber(dokuJson, invoiceNumber);
    const responseRequestId = extractResponseRequestId(dokuJson);
    const rawDigest = await digestText(JSON.stringify(dokuJson));
    const idempotencyKey = `doku:check_status:${resolvedInvoice}:${paymentStatus}:${providerStatus || 'unknown'}:${rawDigest}`;

    const { data: processed, error: processError } = await supabase.rpc('process_doku_payment_event', {
      target_invoice_number: resolvedInvoice,
      event_source: 'check_status',
      event_status: paymentStatus,
      raw_event: dokuJson,
      event_headers: headers,
      provider_request_id: responseRequestId,
      provider_reference: extractProviderReference(dokuJson),
      event_idempotency_key: idempotencyKey,
      amount_idr: extractAmount(dokuJson),
    });

    if (processError) throw { phase: 'process_doku_payment_event', ...processError };

    const { data: updatedOrder } = await supabase
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
      .eq('invoice_number', resolvedInvoice)
      .maybeSingle();

    const result = Array.isArray(processed) ? processed[0] : processed;
    return jsonResponse({
      ok: result?.processing_status !== 'failed',
      invoice_number: resolvedInvoice,
      order: updatedOrder,
      payment_status: paymentStatus,
      provider_status: providerStatus,
      changed: Boolean(result?.event_inserted),
      message: paymentStatus === 'paid'
        ? 'DOKU reports this payment as paid.'
        : paymentStatus === 'pending'
          ? 'DOKU still reports this payment as pending.'
          : `DOKU reports this payment as ${paymentStatus}.`,
      result,
      raw: dokuJson,
    }, result?.processing_status === 'failed' ? 500 : 200);
  } catch (error) {
    const normalizedError = normalizeUnknownError(error, 'Unexpected reconciliation error');
    console.error('reconcile-doku-payment error:', JSON.stringify(normalizedError));
    return jsonResponse({ error: normalizedError.message, detail: normalizedError }, 500);
  }
});
