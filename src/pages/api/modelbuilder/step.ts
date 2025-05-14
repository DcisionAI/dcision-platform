import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSupabase } from '../../../lib/supabase';
import { resolveUser } from '../../../lib/resolveUser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = await resolveUser(req);

  if (req.method === 'POST') {
    const { session_id, step_type, step_data } = req.body;
    if (!userId || !session_id || !step_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const supabase = getServerSupabase();
    const { data, error } = await supabase.from('steps').insert([
      { session_id, user_id: userId, step_type, step_data }
    ]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'GET') {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ error: 'Missing session_id' });
    }
    const supabase = getServerSupabase();
    const { data, error } = await supabase.from('steps').select('*').eq('session_id', session_id).eq('user_id', userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 