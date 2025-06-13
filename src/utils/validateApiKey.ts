import { getServerSupabase } from '@/lib/supabase';

export async function validateApiKey(apiKey: string) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('customer_api_keys')
    .select('id, status')
    .eq('api_key', apiKey)
    .eq('status', 'active')
    .single();
  return !!data && !error;
} 