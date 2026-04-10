import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.log("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  console.log("Attempting to sign in to get a session...");
  // Use admin email to pretend we are the user from the screenshot
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'betvdoc@gmail.com',
    password: 'password123'
  });
  
  if (authError) {
    console.error("Login Error:", authError.message);
    return;
  }
  
  const uid = authData.user?.id;
  console.log("Logged in. UID:", uid);
  
  const newProfile = {
    id: uid,
    email: 'betvdoc@gmail.com',
    display_name: 'Test',
    role: 'ADMIN',
    loyalty_points: 0
  };
  
  console.log("Testing insert...");
  const start = Date.now();
  const { error } = await supabase.from('users').insert(newProfile);
  console.log(`Insert finished in ${Date.now() - start}ms`);
  
  if (error) {
    console.error("Insert error:", error);
  } else {
    console.log("Insert success!");
  }
}

testInsert();
