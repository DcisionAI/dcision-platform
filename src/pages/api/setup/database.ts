import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSupabase } from '@/lib/supabase';
import { Client } from 'pg';
import { encrypt } from '@/lib/encryption';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getServerSupabase();
  const { user } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

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
      
      // Check if tables already exist
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'profiles'
        );
      `);

      if (result.rows[0].exists) {
        await client.end();
        return res.status(400).json({ error: 'Database already initialized' });
      }

      // Run schema migration
      const fs = require('fs');
      const path = require('path');
      const schema = fs.readFileSync(
        path.join(process.cwd(), 'scripts/migrations/customer_schema.sql'),
        'utf8'
      );

      await client.query(schema);
      await client.end();

      // Store encrypted connection details
      const { error: dbError } = await supabase
        .from('connectors')
        .insert({
          user_id: user.id,
          type: 'postgres',
          name: 'Primary Database',
          config: {
            connection: {
              host,
              port: parseInt(port),
              database,
              username,
              password: await encrypt(password)
            }
          }
        });

      if (dbError) throw dbError;

      return res.status(200).json({ success: true });
    } catch (error) {
      await client.end();
      throw error;
    }
  } catch (error: any) {
    console.error('Database setup error:', error);
    return res.status(500).json({ 
      error: 'Failed to setup database',
      details: error.message 
    });
  }
} 