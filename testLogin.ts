import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function testLogin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'robert1588@gmail.com',
    password: '123456789'
  });
  console.log('Data:', data);
  console.log('Error:', error?.message);
}

testLogin();
