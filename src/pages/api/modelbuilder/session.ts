import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSupabase } from '../../../lib/supabase';
import { resolveUser } from '../../../lib/resolveUser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = await resolveUser(req);

  if (req.method === 'POST') {
    const { description, problem_type, status } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const supabase = getServerSupabase();
    const { data, error } = await supabase.from('sessions').insert([
      { user_id: userId, description, problem_type, status }
    ]).select().single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'GET') {
    const supabase = getServerSupabase();
    const { data, error } = await supabase.from('sessions').select('*').eq('user_id', userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 