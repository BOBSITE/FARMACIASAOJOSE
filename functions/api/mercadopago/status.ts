import { createClient } from '@supabase/supabase-js';

export const onRequestGet: PagesFunction<any> = async (context) => {
  const { env } = context;

  const accessToken = env.MERCADOPAGO_ACCESS_TOKEN;
  const publicKey = env.VITE_MERCADOPAGO_PUBLIC_KEY;
  
  if (accessToken && publicKey) {
    return new Response(JSON.stringify({ 
      connected: true, 
      source: 'environment',
      publicKey: publicKey.substring(0, 20) + '...',
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Fallback to Supabase
  try {
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'mercadopago_private')
      .single();

    if (data?.value?.access_token) {
      return new Response(JSON.stringify({ 
        connected: true, 
        source: 'database',
        userId: data.value.user_id,
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (e) {
    console.error("Status check failed:", e);
  }

  return new Response(JSON.stringify({ connected: false }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
