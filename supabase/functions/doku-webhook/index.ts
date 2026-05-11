import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, client-id, request-id, request-timestamp, signature',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function textResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
  });
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

async function digestBody(body: string) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body));
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
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

async function verifyDokuSignature(req: Request, rawBody: string) {
  const clientId = req.headers.get('Client-Id');
  const requestId = req.headers.get('Request-Id');
  const requestTimestamp = req.headers.get('Request-Timestamp');
  const signature = req.headers.get('Signature');
  const expectedClientId = requiredEnv('DOKU_CLIENT_ID');
  const secretKey = requiredEnv('DOKU_SECRET_KEY');

  if (!clientId || !requestId || !requestTimestamp || !signature) return false;
  if (clientId !== expectedClientId) return false;

  const requestTarget = new URL(req.url).pathname;
  const digest = await digestBody(rawBody);
  const component = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${requestTimestamp}`,
    `Request-Target:${requestTarget}`,
    `Digest:${digest}`,
  ].join('\n');

  return signature === await hmacSignature(component, secretKey);
}

function hasDokuSignatureHeaders(req: Request) {
  return Boolean(
    req.headers.get('Client-Id') ||
    req.headers.get('Request-Id') ||
    req.headers.get('Request-Timestamp') ||
    req.headers.get('Signature'),
  );
}

function extractInvoiceNumber(payload: Record<string, unknown>) {
  const order = payload.order as Record<string, unknown> | undefined;
  const transaction = payload.transaction as Record<string, unknown> | undefined;
  return (
    order?.invoice_number ??
    order?.invoiceNumber ??
    transaction?.invoice_number ??
    payload.invoice_number
  ) as string | undefined;
}

function extractPaymentStatus(payload: Record<string, unknown>) {
  const transaction = payload.transaction as Record<string, unknown> | undefined;
  const payment = payload.payment as Record<string, unknown> | undefined;
  const status = String(
    transaction?.status ??
    transaction?.transaction_status ??
    payment?.status ??
    payload.status ??
    '',
  ).toLowerCase();

  if (['success', 'settlement', 'capture', 'paid'].includes(status)) return 'paid';
  if (['expired'].includes(status)) return 'expired';
  if (['cancelled', 'canceled'].includes(status)) return 'cancelled';
  if (['failed', 'deny'].includes(status)) return 'failed';
  return 'pending';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method === 'GET' || req.method === 'HEAD') {
    return new Response(req.method === 'HEAD' ? null : 'ok', {
      status: 200,
      headers: corsHeaders,
    });
  }
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const rawBody = await req.text();
    const verified = await verifyDokuSignature(req, rawBody);

    if (!verified) {
      if (!hasDokuSignatureHeaders(req)) {
        return textResponse('CONTINUE');
      }

      return jsonResponse({ error: 'Invalid DOKU signature' }, 401);
    }

    if (!rawBody.trim()) {
      return textResponse('CONTINUE');
    }

    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const invoiceNumber = extractInvoiceNumber(payload);
    const paymentStatus = extractPaymentStatus(payload);

    if (!invoiceNumber) {
      return jsonResponse({ error: 'Missing invoice number' }, 400);
    }

    const supabase = createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'));

    if (paymentStatus === 'paid') {
      const { data, error } = await supabase.rpc('activate_paid_order', {
        target_invoice_number: invoiceNumber,
        raw_notification: payload,
      });

      if (error) throw error;
      return jsonResponse({ ok: true, status: 'paid', result: data });
    }

    const mappedOrderStatus = paymentStatus === 'expired'
      ? 'expired'
      : paymentStatus === 'cancelled'
        ? 'cancelled'
        : 'pending_payment';

    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        status: mappedOrderStatus,
      })
      .eq('invoice_number', invoiceNumber);

    if (error) throw error;

    return jsonResponse({ ok: true, status: paymentStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected webhook error';
    return jsonResponse({ error: message }, 500);
  }
});
