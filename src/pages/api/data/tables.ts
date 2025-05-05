import type { NextApiRequest, NextApiResponse } from 'next';
// GET list of tables from a Supabase project via direct DB URL or REST fallback

// Expects POST with JSON body: { url: string; key: string }
// Expects POST with JSON body: { url: string; key: string }

type TableResponse = string[];
type ErrorResponse = { error: string };

import { Client } from 'pg';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TableResponse | ErrorResponse>
) {

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Extract Supabase credentials from request body or environment
  const body = req.body as { url?: string; key?: string };
  const url = body.url || process.env.SUPABASE_URL;
  const key = body.key || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    return res.status(400).json({ error: 'Missing Supabase URL or service key in request or environment' });
  }
  
  // Derive DB connection string: use SUPABASE_DB_URL env var or construct from provided URL/key
  let dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    try {
      const parsed = new URL(url);
      const host = parsed.host.startsWith('db.') ? parsed.host : `db.${parsed.host}`;
      dbUrl = `postgresql://postgres:${key}@${host}:5432/postgres?sslmode=require`;
    } catch (e) {
      console.warn('Invalid Supabase URL provided, cannot derive DB URL:', url);
    }
  }
  
  // Attempt direct Postgres introspection if DB URL is available
  if (dbUrl) {
    try {
      const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
      await client.connect();
      const result = await client.query(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema='public' AND table_type='BASE TABLE';`
      );
      await client.end();
      const tables = (result.rows || [])
        .map((row: any) => row.table_name)
        .filter((t: any) => typeof t === 'string');
      return res.status(200).json(tables);
    } catch (err: any) {
      console.warn('Postgres introspection failed:', err?.message || err);
    }
  }

  // Fallback: fetch via Supabase PostgREST endpoint using provided URL/key
  const baseUrl = url.replace(/\/+$/, '');
  const endpoint = `${baseUrl}/rest/v1/visible_tables?select=table_name`;
  try {
    const resp = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
    });
    if (!resp.ok) {
      const errText = await resp.text().catch(() => resp.statusText);
      console.error('Supabase REST error:', resp.status, errText);
      return res.status(resp.status).json({ error: `REST error: ${resp.status} ${errText}` });
    }
    const data = await resp.json();
    const tables = Array.isArray(data)
      ? data.map((row: any) => row.table_name).filter((t: any) => typeof t === 'string')
      : [];
    return res.status(200).json(tables);
  } catch (err: any) {
    console.error('REST fallback failed:', err);
    return res.status(500).json({ error: err?.message || 'Unknown error' });
  }
}