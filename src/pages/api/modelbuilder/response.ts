import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSupabase } from '../../../lib/supabase';
import { resolveUser } from '../../../lib/resolveUser';
import { validateApiKey } from '@/utils/validateApiKey';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (!apiKey || !(await validateApiKey(apiKey))) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }

  const { userId } = await resolveUser(req);

  if (req.method === 'POST') {
    const { prompt_id, response_text } = req.body;
    if (!userId || !prompt_id || !response_text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const supabase = getServerSupabase();
    const { data, error } = await supabase.from('responses').insert([
      { prompt_id, user_id: userId, response_text }
    ]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'GET') {
    const { prompt_id } = req.query;
    if (!prompt_id) {
      return res.status(400).json({ error: 'Missing prompt_id' });
    }
    const supabase = getServerSupabase();
    const { data, error } = await supabase.from('responses').select('*').eq('prompt_id', prompt_id).eq('user_id', userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 