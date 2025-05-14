import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSupabase } from '../../../lib/supabase';
import { resolveUser } from '../../../lib/resolveUser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = await resolveUser(req);
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing API key id' });

  const supabase = getServerSupabase();
  // Only delete if the key belongs to the user
  const { error } = await supabase.from('api_keys').delete().eq('id', id).eq('user_id', userId);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(204).end();
} 