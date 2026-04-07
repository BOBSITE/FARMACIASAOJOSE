import express from "express";
import { createServer as createViteServer } from "vite";
import { MercadoPagoConfig, Preference } from 'mercadopago';
import path from 'path';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase Admin for server-side use (bypasses rules)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const db = getFirestore(firebaseConfig.firestoreDatabaseId || '(default)');

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

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Mercado Pago OAuth URL
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
        // Store public info
        await db.collection('settings').doc('mercadopago_public').set({
          publicKey: data.public_key,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        // Store private tokens using Admin SDK
        await db.collection('settings').doc('mercadopago_private').set({
          accessToken: data.access_token,
          userId: data.user_id,
          refreshToken: data.refresh_token,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

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
      const { items, payerEmail } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Invalid items" });
      }

      // Check for stored tokens first using Admin SDK
      const settingsDoc = await db.collection('settings').doc('mercadopago_private').get();
      let accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

      if (settingsDoc.exists) {
        accessToken = settingsDoc.data()?.accessToken;
      }

      if (!accessToken) {
        throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured");
      }

      const client = new MercadoPagoConfig({ accessToken });
      const preference = new Preference(client);

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

      const response = await preference.create({
        body: {
          items: mpItems,
          payer: payerEmail ? { email: payerEmail } : undefined,
          back_urls: {
            success: `${origin}/checkout?status=success`,
            failure: `${origin}/checkout?status=failure`,
            pending: `${origin}/checkout?status=pending`,
          },
          auto_return: "approved",
          statement_descriptor: "FARMACIA ONLINE",
        }
      });

      res.json({ id: response.id });
    } catch (error) {
      console.error("Error creating preference:", error);
      res.status(500).json({ error: "Failed to create preference" });
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
