import type { NextApiRequest, NextApiResponse } from 'next';
import { encrypt } from '@/lib/encryption';
import { validateApiKey } from '@/utils/validateApiKey';

// Add type declaration for globalThis.llmConfigs
declare global {
  // eslint-disable-next-line no-var
  var llmConfigs: { [userId: string]: { provider: string; apiKey: string; created_at: string }[] } | undefined;
}

// In-memory LLM config store (for demo only; not persistent)
const llmConfigs: { [userId: string]: { provider: string; apiKey: string; created_at: string }[] } = global.llmConfigs || (global.llmConfigs = {});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (!apiKey || !(await validateApiKey(apiKey))) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }

  // For demo, use API key as userId
  const userId = apiKey;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { provider, apiKey: llmApiKey } = req.body;
    if (!provider || !llmApiKey) {
      return res.status(400).json({ error: 'Provider and API key are required' });
    }
    // Optionally validate the LLM API key here (e.g., test with provider API)
    const encryptedKey = await encrypt(llmApiKey);
    const config = {
      provider,
      apiKey: encryptedKey,
      created_at: new Date().toISOString()
    };
    if (!llmConfigs[userId]) llmConfigs[userId] = [];
    llmConfigs[userId].push(config);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to store LLM config' });
  }
} 