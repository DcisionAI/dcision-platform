import type { NextApiRequest, NextApiResponse } from 'next';
import { resolveUser } from '../../../lib/resolveUser';

// Add type declaration for globalThis.promptsStore
declare global {
  // eslint-disable-next-line no-var
  var promptsStore: { [userId: string]: { id: string; prompt: string; created_at: string }[] } | undefined;
}

// In-memory prompt store (for demo only; not persistent)
const promptsStore: { [userId: string]: { id: string; prompt: string; created_at: string }[] } = global.promptsStore || (global.promptsStore = {});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await resolveUser(req);
  const userId = user.id;

  if (req.method === 'POST') {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    const id = Math.random().toString(36).slice(2);
    const created_at = new Date().toISOString();
    if (!promptsStore[userId]) promptsStore[userId] = [];
    promptsStore[userId].push({ id, prompt, created_at });
    return res.status(201).json({ id, prompt, created_at });
  }

  if (req.method === 'GET') {
    return res.status(200).json(promptsStore[userId] || []);
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 