import { createClient } from '@supabase/supabase-js';

export const onRequestGet: PagesFunction<any> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response("Authorization code missing", { status: 400 });
  }

  try {
    const clientId = env.MERCADOPAGO_CLIENT_ID;
    const clientSecret = env.MERCADOPAGO_CLIENT_SECRET;
    const origin = `${url.protocol}//${url.host}`;
    const redirectUri = `${origin}/api/auth/mercadopago/callback`;

    const mpResponse = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await mpResponse.json() as any;

    if (data.access_token) {
      const supabaseUrl = env.VITE_SUPABASE_URL;
      const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Store public info
      await supabase.from('settings').upsert({
        key: 'mercadopago_public',
        value: {
          public_key: data.public_key,
          updated_at: new Date().toISOString(),
        }
      });

      // Store private tokens
      await supabase.from('settings').upsert({
        key: 'mercadopago_private',
        value: {
          access_token: data.access_token,
          user_id: data.user_id,
          refresh_token: data.refresh_token,
          updated_at: new Date().toISOString(),
        }
      });

      return new Response(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f0fdf4;">
            <div style="text-align: center; padding: 2rem; background: white; border-radius: 2rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
              <h1 style="color: #16a34a; margin-bottom: 1rem;">Conectado com Sucesso!</h1>
              <p style="color: #4b5563;">O Mercado Pago foi integrado à sua farmácia.</p>
              <p style="color: #9ca3af; font-size: 0.875rem;">Esta janela fechará automaticamente...</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'MERCADOPAGO_AUTH_SUCCESS' }, '*');
                  setTimeout(() => window.close(), 2000);
                } else {
                  window.location.href = '/dashboard/settings';
                }
              </script>
            </div>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    } else {
      throw new Error(data.message || "Failed to exchange code for tokens");
    }
  } catch (error: any) {
    console.error("Mercado Pago OAuth Error:", error);
    return new Response(`Erro ao conectar com o Mercado Pago: ${error.message}`, { status: 500 });
  }
};
