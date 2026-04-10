import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function createUser() {
  const { data, error } = await supabase.auth.signUp({
    email: 'robert1588@gmail.com',
    password: '123456789',
    options: {
      data: {
        display_name: 'Robert',
        cpf: '00000000000'
      }
    }
  });
  console.log('SignUp Data:', data);
  console.log('SignUp Error:', error?.message);
}

createUser();
