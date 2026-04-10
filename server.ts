import 'dotenv/config';
import express from "express";
import { createServer as createViteServer } from "vite";
import { MercadoPagoConfig, Preference } from 'mercadopago';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client for server-side use
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: ReturnType<typeof createClient> | null = null;
try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  } else {
    console.warn("Supabase credentials missing in .env");
  }
} catch (error) {
  console.warn("Supabase Client failed to initialize:", (error as any).message);
}

// Global safe DB helper
const safeDb = {
  get: async (table: string, docId: string): Promise<any> => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from(table).select('*').eq('id', docId).single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn(`Supabase get failed (${table}/${docId}):`, (e as any).message);
      return null;
    }
  },
  set: async (table: string, docId: string, data: any) => {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from(table).upsert({ id: docId, ...data });
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn(`Supabase set failed (${table}/${docId}):`, (e as any).message);
      return false;
    }
  }
};

function getOrigin(req: express.Request) {
  let origin = req.headers.origin as string;
  if (!origin && req.headers.referer) {
    const refererUrl = new URL(req.headers.referer as string);
    origin = `${refererUrl.protocol}//${refererUrl.host}`;
  }
  
  if (!origin || origin.includes('localhost')) {
    const forwardedHost = req.headers['x-forwarded-host'];
    const forwardedProto = req.headers['x-forwarded-proto'] || 'https';
    if (forwardedHost) {
      origin = `${forwardedProto}://${forwardedHost}`;
    } else {
      origin = origin || `https://${req.get('host')}`;
    }
  }
  return origin;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API routes FIRST
  // Mercado Pago status check - works with env vars directly
  app.get("/api/mercadopago/status", async (req, res) => {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const publicKey = process.env.VITE_MERCADOPAGO_PUBLIC_KEY;
    
    if (accessToken && publicKey) {
      res.json({ 
        connected: true, 
        source: 'environment',
        publicKey: publicKey.substring(0, 20) + '...',
      });
    } else {
      // Try Supabase Auth as fallback
      const settings = await safeDb.get('settings', 'mercadopago_private');
      if (settings?.access_token) {
        res.json({ 
          connected: true, 
          source: 'database',
          userId: settings.user_id,
        });
      } else {
        res.json({ connected: false });
      }
    }
  });

  // Mercado Pago status check - works with env vars directly
  app.get("/api/auth/mercadopago/url", (req, res) => {
    const clientId = process.env.MERCADOPAGO_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: "MERCADOPAGO_CLIENT_ID not configured" });
    }

    const origin = getOrigin(req);
    const redirectUri = `${origin}/api/auth/mercadopago/callback`;

    const authUrl = `https://auth.mercadopago.com.br/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(redirectUri)}`;

    res.json({ url: authUrl });
  });

  // Mercado Pago OAuth Callback
  app.get("/api/auth/mercadopago/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send("Authorization code missing");
    }

    try {
      const clientId = process.env.MERCADOPAGO_CLIENT_ID;
      const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;
      const origin = getOrigin(req);
      const redirectUri = `${origin}/api/auth/mercadopago/callback`;

      const response = await fetch("https://api.mercadopago.com/oauth/token", {
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

      const data = await response.json();

      if (data.access_token) {
        // Store public info (safely)
        await safeDb.set('settings', 'mercadopago_public', {
          public_key: data.public_key,
          updated_at: new Date().toISOString(),
        });

        // Store private tokens (safely)
        await safeDb.set('settings', 'mercadopago_private', {
          access_token: data.access_token,
          user_id: data.user_id,
          refresh_token: data.refresh_token,
          updated_at: new Date().toISOString(),
        });

        // Send success message and close popup
        res.send(`
          <html>
            <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f0fdf4;">
              <div style="text-align: center; padding: 2rem; background: white; border-radius: 2rem; shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
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
        `);
      } else {
        throw new Error(data.message || "Failed to exchange code for tokens");
      }
    } catch (error) {
      console.error("Mercado Pago OAuth Error:", error);
      res.status(500).send("Erro ao conectar com o Mercado Pago. Verifique os logs do servidor.");
    }
  });

  app.post("/api/create-preference", async (req, res) => {
    try {
      console.log("DEBUG: create-preference started");
      const { items, payerEmail, userId } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Invalid items" });
      }

      console.log("DEBUG: checking settings via safeDb");
      // Check for stored tokens first (safely)
      const settingsData = await safeDb.get('settings', 'mercadopago_private');
      console.log("DEBUG: settingsData retrieved:", !!settingsData);
      
      let accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

      if (settingsData && settingsData.access_token) {
        accessToken = settingsData.access_token;
      }

      if (!accessToken) {
        throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured - env or database");
      }

      console.log("DEBUG: initializing Mercado Pago client");
      const client = new MercadoPagoConfig({ accessToken });
      const preference = new Preference(client);

      console.log("DEBUG: mapping items");
      const mpItems = items.map((item: any) => ({
        id: item.id,
        title: item.name,
        quantity: Number(item.quantity),
        unit_price: Number(item.price),
        currency_id: 'BRL',
      }));

      // Add shipping if applicable
      const subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.price) * Number(item.quantity)), 0);
      const shipping = subtotal > 150 ? 0 : 15.00;

      if (shipping > 0) {
        mpItems.push({
          id: 'shipping',
          title: 'Frete',
          quantity: 1,
          unit_price: shipping,
          currency_id: 'BRL',
        });
      }

      const origin = getOrigin(req);
      const isHttps = origin.startsWith('https://');

      console.log("DEBUG: creating preference via Mercado Pago SDK");
      const preferenceData: any = {
        body: {
          items: mpItems,
          back_urls: {
            success: `${origin}/checkout?status=success`,
            failure: `${origin}/checkout?status=failure`,
            pending: `${origin}/checkout?status=pending`,
          },
          statement_descriptor: "FARMACIA ONLINE",
        }
      };

      // Mercado Pago API rejects auto_return if back_urls.success is not HTTPS
      if (isHttps) {
        preferenceData.body.auto_return = "approved";
      }

      const response = await preference.create(preferenceData);
      console.log("DEBUG: preference created successfully:", response.id);

      // Create PENDING order in database with auto-generated UUID
      try {
        if (supabase) {
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
            amount_paid: 0,
            change: 0,
          });
          console.log(`DEBUG: Order for preference ${response.id} stored in database as PENDING`);
        }
      } catch (dbErr) {
        console.error('Failed to save order:', dbErr);
      }

      res.json({ 
        id: response.id, 
        init_point: response.init_point,
        sandbox_init_point: response.sandbox_init_point,
      });
    } catch (error: any) {
      console.error("Error creating preference:", error);
      res.status(500).json({ 
        error: "Failed to create preference", 
        message: error.message,
        details: error.api_response?.body || error
      });
    }
  });

  app.post("/api/update-order-status", async (req, res) => {
    try {
      const { preference_id, status } = req.body;
      
      if (!preference_id || !status) {
        return res.status(400).json({ error: "Missing preference_id or status" });
      }

      console.log(`DEBUG: Updating order ${preference_id} status to ${status}`);
      
      const orderData = await safeDb.get('orders', preference_id);
      
      if (!orderData) {
        return res.status(404).json({ error: "Order not found" });
      }

      await safeDb.set('orders', preference_id, {
        status: status,
      });

      res.json({ success: true, message: "Order updated successfully" });
    } catch (error) {
      console.error("Order Update Error:", error);
      res.status(500).json({ error: (error as any).message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
