import type { NextApiRequest, NextApiResponse } from 'next';
import { resolveUser } from '../../../lib/resolveUser';

// Add type declaration for globalThis.apiKeysStore
declare global {
  // eslint-disable-next-line no-var
  var apiKeysStore: { [userId: string]: { id: string; created_at: string }[] } | undefined;
}

// In-memory API key store (for demo only; not persistent)
const apiKeysStore: { [userId: string]: { id: string; created_at: string }[] } = global.apiKeysStore || (global.apiKeysStore = {});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Missing API key id' });

  const user = await resolveUser(req);
  const userId = user.id;

  if (!apiKeysStore[userId]) {
    return res.status(404).json({ error: 'No API keys found for user' });
  }

  const idx = apiKeysStore[userId].findIndex((k) => k.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'API key not found' });
  }

  apiKeysStore[userId].splice(idx, 1);
  return res.status(204).end();
} 