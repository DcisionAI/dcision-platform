import type { NextApiRequest, NextApiResponse } from 'next';
import { resolveUser } from '../../../lib/resolveUser';

// Add type declaration for globalThis.stepsStore
declare global {
  // eslint-disable-next-line no-var
  var stepsStore: { [userId: string]: { id: string; step: any; created_at: string }[] } | undefined;
}

// In-memory step store (for demo only; not persistent)
const stepsStore: { [userId: string]: { id: string; step: any; created_at: string }[] } = global.stepsStore || (global.stepsStore = {});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await resolveUser(req);
  const userId = user.id;

  if (req.method === 'POST') {
    const { step } = req.body;
    if (!step) {
      return res.status(400).json({ error: 'Step is required' });
    }
    const id = Math.random().toString(36).slice(2);
    const created_at = new Date().toISOString();
    if (!stepsStore[userId]) stepsStore[userId] = [];
    stepsStore[userId].push({ id, step, created_at });
    return res.status(201).json({ id, step, created_at });
  }

  if (req.method === 'GET') {
    return res.status(200).json(stepsStore[userId] || []);
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 