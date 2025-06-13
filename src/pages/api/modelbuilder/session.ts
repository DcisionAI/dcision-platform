import type { NextApiRequest, NextApiResponse } from 'next';
import { resolveUser } from '../../../lib/resolveUser';

// Add type declaration for globalThis.sessionsStore
declare global {
  // eslint-disable-next-line no-var
  var sessionsStore: { [userId: string]: { id: string; created_at: string; data?: any }[] } | undefined;
}

// In-memory session store (for demo only; not persistent)
const sessionsStore: { [userId: string]: { id: string; created_at: string; data?: any }[] } = global.sessionsStore || (global.sessionsStore = {});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await resolveUser(req);
  const userId = user.id;

  if (req.method === 'POST') {
    const { data } = req.body;
    const id = Math.random().toString(36).slice(2);
    const created_at = new Date().toISOString();
    if (!sessionsStore[userId]) sessionsStore[userId] = [];
    sessionsStore[userId].push({ id, created_at, data });
    return res.status(201).json({ id, created_at, data });
  }

  if (req.method === 'GET') {
    return res.status(200).json(sessionsStore[userId] || []);
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 