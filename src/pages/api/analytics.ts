import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSupabase } from '../../lib/supabase';
import { resolveUser } from '../../lib/resolveUser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = await resolveUser(req);
  const supabase = getServerSupabase();
  const { data, error } = await supabase.from('analytics').select('*').eq('user_id', userId).single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data);
} 