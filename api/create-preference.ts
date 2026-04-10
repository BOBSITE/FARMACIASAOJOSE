import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { items, payerEmail, userId } = req.body;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: "Missing Supabase configuration" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get MP Access Token from env or database
    let accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const { data: settingsData } = await supabase.from('settings').select('value').eq('key', 'mercadopago_private').single();
    if (settingsData?.value?.access_token) accessToken = settingsData.value.access_token;

    if (!accessToken) {
      return res.status(500).json({ error: "Mercado Pago Access Token not configured" });
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

    const subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.price) * Number(item.quantity)), 0);
    const shipping = subtotal >= 100 ? 0 : 15.00;

    if (shipping > 0) {
      mpItems.push({ id: 'shipping', title: 'Frete', quantity: 1, unit_price: shipping, currency_id: 'BRL' });
    }

    const host = req.headers.host;
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const origin = `${protocol}://${host}`;
    
    const mpResponse = await preference.create({
      body: {
        items: mpItems,
        back_urls: {
          success: `${origin}/checkout?status=success`,
          failure: `${origin}/checkout?status=failure`,
          pending: `${origin}/checkout?status=pending`,
        },
        auto_return: "approved",
        statement_descriptor: "FARMACIA ONLINE",
      }
    });

    // Save order to Supabase
    await supabase.from('orders').insert({
      preference_id: mpResponse.id,
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

    return res.status(200).json({ id: mpResponse.id, init_point: mpResponse.init_point });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
}
