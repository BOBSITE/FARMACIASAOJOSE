import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

export interface Env {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  MERCADOPAGO_ACCESS_TOKEN: string;
  VITE_MERCADOPAGO_PUBLIC_KEY: string;
  MERCADOPAGO_CLIENT_ID: string;
  MERCADOPAGO_CLIENT_SECRET: string;
  ASSETS: any; // Service binding for static assets
}

// Trigger redeploy to pick up new Cloudflare environment variables
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // API Routes
    if (path.startsWith('/api/')) {
      
      // 1. POST /api/create-preference
      if (path === '/api/create-preference' && request.method === 'POST') {
        return await handleCreatePreference(request, env);
      }

      // 2. GET /api/mercadopago/status
      if (path === '/api/mercadopago/status' && request.method === 'GET') {
        return await handleMpStatus(env);
      }

      // 3. GET /api/auth/mercadopago/url
      if (path === '/api/auth/mercadopago/url' && request.method === 'GET') {
        return await handleMpAuthUrl(request, env);
      }

      // 4. GET /api/auth/mercadopago/callback
      if (path === '/api/auth/mercadopago/callback' && request.method === 'GET') {
        return await handleMpAuthCallback(request, env);
      }

      // 5. POST /api/update-order-status
      if (path === '/api/update-order-status' && request.method === 'POST') {
        return await handleUpdateOrderStatus(request, env);
      }

      // If API route not found
      return new Response(JSON.stringify({ error: "API Route not found" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Default: Serve static assets
    // The new Workers Assets feature provides env.ASSETS.fetch
    return await env.ASSETS.fetch(request);
  }
};

// --- HANDLERS ---

async function handleCreatePreference(request: Request, env: Env) {
  try {
    const { items, payerEmail, userId } = await request.json() as any;

    const supabaseUrl = env.VITE_SUPABASE_URL || (env as any).SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || (env as any).SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      throw new Error("Configuração ausente: VITE_SUPABASE_URL não encontrada no painel da Cloudflare.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get MP Access Token
    let accessToken = env.MERCADOPAGO_ACCESS_TOKEN;
    const { data: settingsData } = await supabase.from('settings').select('value').eq('key', 'mercadopago_private').single();
    if (settingsData?.value?.access_token) accessToken = settingsData.value.access_token;

    if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const mpItems = items.map((item: any) => ({
      id: item.id,
      title: item.name,
      quantity: Number(item.quantity),
      unit_price: Number(item.price),
      currency_id: 'BRL',
    }));

    const subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.price) * Number(item.quantity)), 0);
    const shipping = subtotal >= 100 ? 0 : 15.00;

    if (shipping > 0) {
      mpItems.push({ id: 'shipping', title: 'Frete', quantity: 1, unit_price: shipping, currency_id: 'BRL' });
    }

    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;
    
    const response = await preference.create({
      body: {
        items: mpItems,
        back_urls: {
          success: `${origin}/checkout?status=success`,
          failure: `${origin}/checkout?status=failure`,
          pending: `${origin}/checkout?status=pending`,
        },
        auto_return: origin.startsWith('https://') ? "approved" : undefined,
        statement_descriptor: "FARMACIA ONLINE",
      }
    });

    // Save order
    await supabase.from('orders').insert({
      preference_id: response.id,
      user_id: userId || null,
      operator_name: payerEmail || '',
      items: items.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        selectedVariations: item.selectedVariations || {}
      })),
      total: subtotal + shipping,
      status: 'PENDING',
      payment_method: 'MERCADOPAGO',
    });

    return new Response(JSON.stringify({ id: response.id, init_point: response.init_point }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

async function handleMpStatus(env: Env) {
  const accessToken = env.MERCADOPAGO_ACCESS_TOKEN;
  const publicKey = env.VITE_MERCADOPAGO_PUBLIC_KEY;
  
  if (accessToken && publicKey) {
    return new Response(JSON.stringify({ connected: true, source: 'env' }), { headers: { 'Content-Type': 'application/json' } });
  }

  const supabaseUrl = env.VITE_SUPABASE_URL || (env as any).SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || (env as any).SUPABASE_ANON_KEY;
  if (!supabaseUrl) return new Response(JSON.stringify({ connected: false, error: "Missing Supabase URL" }), { headers: { 'Content-Type': 'application/json' } });

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data } = await supabase.from('settings').select('value').eq('key', 'mercadopago_private').single();

  return new Response(JSON.stringify({ connected: !!data?.value?.access_token }), { headers: { 'Content-Type': 'application/json' } });
}

async function handleMpAuthUrl(request: Request, env: Env) {
  const clientId = env.MERCADOPAGO_CLIENT_ID;
  if (!clientId) return new Response(JSON.stringify({ error: "Missing Client ID" }), { status: 500 });

  const url = new URL(request.url);
  const redirectUri = `${url.protocol}//${url.host}/api/auth/mercadopago/callback`;
  const authUrl = `https://auth.mercadopago.com.br/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return new Response(JSON.stringify({ url: authUrl }), { headers: { 'Content-Type': 'application/json' } });
}

async function handleMpAuthCallback(request: Request, env: Env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code) return new Response("Missing code", { status: 400 });

  const redirectUri = `${url.protocol}//${url.host}/api/auth/mercadopago/callback`;
  const mpRes = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.MERCADOPAGO_CLIENT_ID,
      client_secret: env.MERCADOPAGO_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = await mpRes.json() as any;
  if (!data.access_token) return new Response("OAuth failed", { status: 500 });

  const supabaseUrl = env.VITE_SUPABASE_URL || (env as any).SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || (env as any).SUPABASE_ANON_KEY;
  if (!supabaseUrl) throw new Error("Missing Supabase URL for OAuth");

  const supabase = createClient(supabaseUrl, supabaseKey);
  await supabase.from('settings').upsert({ key: 'mercadopago_public', value: { public_key: data.public_key } });
  await supabase.from('settings').upsert({ key: 'mercadopago_private', value: { access_token: data.access_token, user_id: data.user_id } });

  return new Response(`<html><body><script>window.opener.postMessage({type:'MERCADOPAGO_AUTH_SUCCESS'},'*');window.close();</script></body></html>`, { headers: { 'Content-Type': 'text/html' } });
}

async function handleUpdateOrderStatus(request: Request, env: Env) {
  const { preference_id, status } = await request.json() as any;
  const supabaseUrl = env.VITE_SUPABASE_URL || (env as any).SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || (env as any).SUPABASE_ANON_KEY;
  if (!supabaseUrl) throw new Error("Missing Supabase URL for order update");

  const supabase = createClient(supabaseUrl, supabaseKey);
  await supabase.from('orders').update({ status }).eq('preference_id', preference_id);
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
}
