import { createClient } from '@supabase/supabase-js';

let supabase: ReturnType<typeof createClient> | null = null;

export async function getSupabaseClient() {
  if (supabase) return supabase;

  const res = await fetch('/api/config');
  const { supabaseUrl, supabaseAnonKey } = await res.json();

  supabase = createClient(supabaseUrl, supabaseAnonKey);
  return supabase;
} 