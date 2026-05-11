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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    const { code } = await req.json();

    if (!authHeader) return jsonResponse({ error: 'Authentication required' }, 401);
    if (!code || typeof code !== 'string') return jsonResponse({ error: 'Pickup code is required' }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data, error } = await supabase.rpc('verify_pickup_code', {
      input_code: code,
    });

    if (error) return jsonResponse({ error: error.message }, 400);

    return jsonResponse({ ok: true, result: data?.[0] ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected pickup verification error';
    return jsonResponse({ error: message }, 500);
  }
});
