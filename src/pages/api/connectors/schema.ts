import type { NextApiRequest, NextApiResponse } from 'next';
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
      // Manual parse of connection string to support passwords with special characters
      // Expected format: postgresql://user:password@host:port/database
      const stripped = dbUrl.replace(/^postgres(?:ql)?:\/\//, '');
      const [userInfo, hostDb] = stripped.split('@');
      const [user, password] = userInfo.split(':');
      const [hostPort, database] = hostDb.split('/');
      const [host, portStr] = hostPort.split(':');
      const port = parseInt(portStr, 10);
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