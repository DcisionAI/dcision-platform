import type { NextApiRequest, NextApiResponse } from 'next';
import dns from 'dns';
import { URL } from 'url';

// Force DNS to prefer IPv4 to avoid IPv6 connection refused errors
dns.setDefaultResultOrder('ipv4first');
import { GoogleAuth } from 'google-auth-library';
import { Client } from 'pg';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const { id, config } = req.body;
  if (!id || !config) {
    return res.status(400).json({ error: 'Connector id and config are required' });
  }
  try {
    // Supabase connector test: list tables in the public schema
    if (id === 'supabase') {
      const dbUrl = process.env.SUPABASE_DB_URL;
      if (!dbUrl) {
        throw new Error('SUPABASE_DB_URL env var is required for supabase connector');
      }
      // Parse the connection string using URL to correctly decode credentials
      const { username: user, password, hostname: host, port: portStr, pathname } = new URL(dbUrl);
      const port = parseInt(portStr || '', 10) || 5432;
      const database = pathname?.startsWith('/') ? pathname.slice(1) : pathname;
      const pgClient = new Client({ user, password, host, port, database, ssl: { rejectUnauthorized: false } });
      await pgClient.connect();
      const result = await pgClient.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
      );
      await pgClient.end();
      return res.status(200).json({ success: true, details: { tables: result.rows.map(r => r.table_name) } });
    }
    // Google Connectors API test
    const projectId = process.env.GCLOUD_PROJECT || process.env.NEXT_PUBLIC_PROJECT_ID;
    const region = process.env.GCP_REGION || 'us-central1';
    if (!projectId) {
      throw new Error('GCLOUD_PROJECT env var is required');
    }
    const name = `projects/${projectId}/locations/${region}/connectors/${id}`;
    const endpoint = `https://connectors.googleapis.com/v1/${name}:test`;
    // Initialize GoogleAuth, use SA key if present, fallback to ADC
    const saKey = process.env.GCP_SA_KEY;
    const auth = new GoogleAuth({
      credentials: saKey ? JSON.parse(saKey) : undefined,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
    const response = await client.request({ url: endpoint, method: 'POST', data: config });
    if (response.status === 200) {
      return res.status(200).json({ success: true, details: response.data });
    }
    return res.status(response.status).json({ success: false, details: response.data });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
}