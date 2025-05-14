import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSupabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const supabase = getServerSupabase();

  // Fetch latest logs from each table
  const [sessions, prompts, responses, steps] = await Promise.all([
    supabase.from('sessions').select('id, user_id, description, created_at').order('created_at', { ascending: false }).limit(15),
    supabase.from('prompts').select('id, user_id, prompt_text, created_at').order('created_at', { ascending: false }).limit(15),
    supabase.from('responses').select('id, user_id, response_text, created_at').order('created_at', { ascending: false }).limit(15),
    supabase.from('steps').select('id, user_id, step_type, created_at').order('created_at', { ascending: false }).limit(15),
  ]);

  // Map to unified log format
  const logs = [
    ...(sessions.data || []).map((row: any) => ({
      type: 'session',
      id: row.id,
      user_id: row.user_id,
      timestamp: row.created_at,
      summary: `Session created: ${row.description || row.id}`
    })),
    ...(prompts.data || []).map((row: any) => ({
      type: 'prompt',
      id: row.id,
      user_id: row.user_id,
      timestamp: row.created_at,
      summary: `Prompt: ${row.prompt_text?.slice(0, 60)}`
    })),
    ...(responses.data || []).map((row: any) => ({
      type: 'response',
      id: row.id,
      user_id: row.user_id,
      timestamp: row.created_at,
      summary: `Response: ${row.response_text?.slice(0, 60)}`
    })),
    ...(steps.data || []).map((row: any) => ({
      type: 'step',
      id: row.id,
      user_id: row.user_id,
      timestamp: row.created_at,
      summary: `Step: ${row.step_type}`
    })),
  ];

  // Sort by timestamp descending and limit to 50
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const latestLogs = logs.slice(0, 50);

  return res.status(200).json(latestLogs);
} 