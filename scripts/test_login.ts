import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.log("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey);

async function testSelect() {
  console.log("Attempting to select user...");
  const start = Date.now();
  const { data, error } = await supabase.from('users').select('*').limit(1);
  console.log(`Select finished in ${Date.now() - start}ms`);
  console.log(data, error);
}

testSelect();
