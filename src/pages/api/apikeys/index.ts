import type { NextApiRequest, NextApiResponse } from 'next';
import { resolveUser } from '../../../lib/resolveUser';
import crypto from 'crypto';

// Add type declaration for globalThis.apiKeysStore
declare global {
  // eslint-disable-next-line no-var
  var apiKeysStore: { [userId: string]: { id: string; created_at: string }[] } | undefined;
}

// In-memory API key store (for demo only; not persistent)
const apiKeysStore: { [userId: string]: { id: string; created_at: string }[] } = global.apiKeysStore || (global.apiKeysStore = {});

function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await resolveUser(req);
  const userId = user.id;

  if (req.method === 'POST') {
    // Generate and store API key
    const id = generateApiKey();
    const created_at = new Date().toISOString();
    if (!apiKeysStore[userId]) apiKeysStore[userId] = [];
    apiKeysStore[userId].push({ id, created_at });
    // Return only the raw key once
    return res.status(201).json({ id, apiKey: id, created_at });
  }

  if (req.method === 'GET') {
    // List all API keys for the user (do not return raw keys)
    return res.status(200).json(apiKeysStore[userId] || []);
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 