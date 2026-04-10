import { createClient } from '@supabase/supabase-js';

export const onRequestPost: PagesFunction<any> = async (context) => {
  const { request, env } = context;

  try {
    const { preference_id, status } = await request.json() as any;
    
    if (!preference_id || !status) {
      return new Response(JSON.stringify({ error: "Missing preference_id or status" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('preference_id', preference_id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, message: "Order updated successfully" }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error("Order Update Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
