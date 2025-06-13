import type { NextApiRequest, NextApiResponse } from 'next';
import { resolveUser } from '../../../lib/resolveUser';
import { validateApiKey } from '@/utils/validateApiKey';

// Add type declaration for globalThis.responsesStore
declare global {
  // eslint-disable-next-line no-var
  var responsesStore: { [userId: string]: { id: string; response: string; created_at: string }[] } | undefined;
}

// In-memory response store (for demo only; not persistent)
const responsesStore: { [userId: string]: { id: string; response: string; created_at: string }[] } = global.responsesStore || (global.responsesStore = {});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await resolveUser(req);
  const userId = user.id;

  if (req.method === 'POST') {
    const { response } = req.body;
    if (!response) {
      return res.status(400).json({ error: 'Response is required' });
    }
    const id = Math.random().toString(36).slice(2);
    const created_at = new Date().toISOString();
    if (!responsesStore[userId]) responsesStore[userId] = [];
    responsesStore[userId].push({ id, response, created_at });
    return res.status(201).json({ id, response, created_at });
  }

  if (req.method === 'GET') {
    return res.status(200).json(responsesStore[userId] || []);
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 