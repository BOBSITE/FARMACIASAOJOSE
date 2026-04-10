import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

export const onRequestPost: PagesFunction<any> = async (context) => {
  const { request, env } = context;

  try {
    const { items, payerEmail, userId } = await request.json() as any;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid items" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get MP Access Token
    let accessToken = env.MERCADOPAGO_ACCESS_TOKEN;
    
    // Check database fallback
    const { data: settingsData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'mercadopago_private')
      .single();

    if (settingsData?.value?.access_token) {
      accessToken = settingsData.value.access_token;
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

    const subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.price) * Number(item.quantity)), 0);
    const shipping = subtotal >= 100 ? 0 : 15.00; // Match frontend logic (threshold 100)

    if (shipping > 0) {
      mpItems.push({
        id: 'shipping',
        title: 'Frete',
        quantity: 1,
        unit_price: shipping,
        currency_id: 'BRL',
      });
    }

    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;
    const isHttps = origin.startsWith('https://');

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

    if (isHttps) {
      preferenceData.body.auto_return = "approved";
    }

    const response = await preference.create(preferenceData);

    // Save PENDING order
    try {
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
    } catch (dbErr) {
      console.error('Failed to save order:', dbErr);
    }

    return new Response(JSON.stringify({ 
      id: response.id, 
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("Error creating preference:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to create preference", 
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
