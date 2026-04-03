import express from "express";
import { createServer as createViteServer } from "vite";
import { MercadoPagoConfig, Preference } from 'mercadopago';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/create-preference", async (req, res) => {
    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Invalid items" });
      }

      // Initialize Mercado Pago
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
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

      const origin = req.headers.origin || `https://${req.get('host')}`;

      const response = await preference.create({
        body: {
          items: mpItems,
          back_urls: {
            success: `${origin}/checkout?status=success`,
            failure: `${origin}/checkout?status=failure`,
            pending: `${origin}/checkout?status=pending`,
          },
          auto_return: "approved",
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
