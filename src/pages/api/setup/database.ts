import type { NextApiRequest, NextApiResponse } from 'next';
import { Client } from 'pg';
import { encrypt } from '@/lib/encryption';
import { validateApiKey } from '@/utils/validateApiKey';

// Add type declaration for globalThis.dbConfigs
declare global {
  // eslint-disable-next-line no-var
  var dbConfigs: { [userId: string]: any[] } | undefined;
}

// In-memory DB config store (for demo only; not persistent)
const dbConfigs: { [userId: string]: any[] } = global.dbConfigs || (global.dbConfigs = {});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (!apiKey || !(await validateApiKey(apiKey))) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // For demo, use API key as userId
  const userId = apiKey;

  try {
    const { host, port, database, username, password } = req.body;

    // Validate required fields
    if (!host || !port || !database || !username || !password) {
      return res.status(400).json({ error: 'Missing required database configuration' });
    }

    // Test database connection
    const client = new Client({
      host,
      port: parseInt(port),
      database,
      user: username,
      password,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      // Optionally, check for existing tables or run migrations here
      await client.end();
    } catch (error) {
      await client.end();
      throw error;
    }

    // Store encrypted connection details in memory
    const config = {
      host,
      port: parseInt(port),
      database,
      username,
      password: await encrypt(password),
      created_at: new Date().toISOString()
    };
    if (!dbConfigs[userId]) dbConfigs[userId] = [];
    dbConfigs[userId].push(config);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to store DB config' });
  }
} 