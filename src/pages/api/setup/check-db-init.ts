import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSupabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = getServerSupabase();
    // Try to select from the platform_init_flag table
    const { error } = await supabase.from('platform_init_flag').select('id').limit(1);
    if (error) {
      return res.status(200).json({ initialized: false });
    }
    return res.status(200).json({ initialized: true });
  } catch (e) {
    return res.status(200).json({ initialized: false });
  }
} 