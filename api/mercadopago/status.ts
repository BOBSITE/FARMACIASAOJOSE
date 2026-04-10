import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const publicKey = process.env.VITE_MERCADOPAGO_PUBLIC_KEY;
  
  if (accessToken && publicKey) {
    return res.status(200).json({ connected: true, source: 'env' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: "Missing Supabase configuration" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data } = await supabase.from('settings').select('value').eq('key', 'mercadopago_private').single();

    return res.status(200).json({ connected: !!data?.value?.access_token });
  } catch (err) {
    return res.status(500).json({ connected: false });
  }
}
