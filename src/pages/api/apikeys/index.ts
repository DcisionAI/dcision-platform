import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSupabase } from '../../../lib/supabase';
import { resolveUser } from '../../../lib/resolveUser';
import crypto from 'crypto';

function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

function hashApiKey(apiKey: string) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = await resolveUser(req);
  const supabase = getServerSupabase();

  if (req.method === 'POST') {
    // Generate and hash API key
    const rawKey = generateApiKey();
    const hashedKey = hashApiKey(rawKey);
    // Store hashed key
    const { data, error } = await supabase.from('api_keys').insert([
      { user_id: userId, api_key: hashedKey }
    ]).select('id, created_at').single();
    if (error) return res.status(500).json({ error: error.message });
    // Return only the raw key once
    return res.status(201).json({ id: data.id, apiKey: rawKey, created_at: data.created_at });
  }

  if (req.method === 'GET') {
    // List all API keys for the user (do not return raw keys)
    const { data, error } = await supabase.from('api_keys').select('id, created_at').eq('user_id', userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 