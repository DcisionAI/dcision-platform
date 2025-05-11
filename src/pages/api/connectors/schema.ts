import type { NextApiRequest, NextApiResponse } from 'next';
import dns from 'dns';
import { URL } from 'url';

// Force DNS to prefer IPv4 to avoid IPv6 connection refused errors
dns.setDefaultResultOrder('ipv4first');
import { Client } from 'pg';

/**
 * GET /api/connectors/schema?id=supabase
 * Returns table/column schema for the specified connector.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const id = req.query.id as string;
  if (!id) {
    return res.status(400).json({ error: 'Connector id is required' });
  }
  try {
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
      // List tables
      const tablesRes = await pgClient.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
      );
      // For each table, fetch columns
      const schema = await Promise.all(
        tablesRes.rows.map(async row => {
          const table = row.table_name;
          const colsRes = await pgClient.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=$1",
            [table]
          );
          return { table, columns: colsRes.rows };
        })
      );
      await pgClient.end();
      return res.status(200).json({ schema });
    }
    // Unsupported connector
    return res.status(400).json({ error: `Schema introspection not supported for connector: ${id}` });
  } catch (error: any) {
    console.error('Connector schema error:', error);
    return res.status(500).json({ error: error.message });
  }
}