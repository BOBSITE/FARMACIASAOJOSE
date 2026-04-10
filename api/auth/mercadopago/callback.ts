import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { code } = req.query;
    if (!code) return res.status(400).send("Missing code");

    const clientId = process.env.MERCADOPAGO_CLIENT_ID;
    const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;
    
    const host = req.headers.host;
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/api/auth/mercadopago/callback`;

    const mpRes = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await mpRes.json() as any;
    if (!data.access_token) {
      console.error('OAuth token failed:', data);
      return res.status(500).send("OAuth failed: " + (data.message || "Unknown error"));
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).send("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    await supabase.from('settings').upsert({ key: 'mercadopago_public', value: { public_key: data.public_key } });
    await supabase.from('settings').upsert({ key: 'mercadopago_private', value: { access_token: data.access_token, user_id: data.user_id } });

    return res.status(200).send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({type: 'MERCADOPAGO_AUTH_SUCCESS'}, '*');
            window.close();
          </script>
          <p>Conexão realizada com sucesso! Você pode fechar esta janela.</p>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('OAuth callback error:', err);
    return res.status(500).send("An error occurred: " + err.message);
  }
}
