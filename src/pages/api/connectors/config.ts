import type { NextApiRequest, NextApiResponse } from 'next';
import { encrypt } from '@/lib/encryption';
import { validateApiKey } from '@/utils/validateApiKey';

// Add type declaration for globalThis.connectorConfigs
declare global {
  // eslint-disable-next-line no-var
  var connectorConfigs: { [userId: string]: { [connectorId: string]: any } } | undefined;
}

// In-memory connector config store (for demo only; not persistent)
const connectorConfigs: { [userId: string]: { [connectorId: string]: any } } = global.connectorConfigs || (global.connectorConfigs = {});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey || !(await validateApiKey(apiKey))) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }

  // For demo, use API key as userId
  const userId = apiKey;

  if (req.method === 'POST') {
    const { connectorId, config } = req.body;
    if (!connectorId || !config) {
      return res.status(400).json({ error: 'connectorId and config are required' });
    }
    if (!connectorConfigs[userId]) connectorConfigs[userId] = {};
    // Optionally encrypt config
    connectorConfigs[userId][connectorId] = encrypt ? encrypt(JSON.stringify(config)) : config;
    return res.status(200).json({ success: true });
  }

  if (req.method === 'GET') {
    const { connectorId } = req.query;
    if (!connectorId || typeof connectorId !== 'string') {
      return res.status(400).json({ error: 'connectorId is required' });
    }
    const config = connectorConfigs[userId]?.[connectorId];
    if (!config) {
      return res.status(404).json({ error: 'Config not found' });
    }
    return res.status(200).json({ config });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}