import { getServerSupabase } from './supabase';
import { createClient } from '@supabase/supabase-js';

const DEMO_USER_ID = process.env.DEMO_USER_ID!;

export async function resolveUser(req: any) {
  // 1. Try Supabase Auth JWT
  try{
    const supabase = getServerSupabase();
    const authHeader = req.headers.authorization || req.headers['Authorization'];
    console.log('resolveUser: authHeader', authHeader);
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      console.log('resolveUser: user', user);
      if (user) return { userId: user.id, method: 'jwt' };
    }
  }catch(error){
    console.error('Error getting server supabase:', error);
  }
  

  // 2. Try API Key
  const apiKey = req.headers['x-api-key'] || req.headers['X-API-KEY'];
  if (apiKey) {
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data } = await admin.from('api_keys').select('user_id').eq('api_key', apiKey).single();
    if (data?.user_id) return { userId: data.user_id, method: 'api_key' };
  }

  // 3. No valid user found
  throw new Error('No valid user found');
} 