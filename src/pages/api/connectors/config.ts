import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSupabase } from '@/lib/supabase';
import { encrypt } from '@/lib/encryption';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getServerSupabase();
  const { method } = req;

  try {
    switch (method) {
      case 'GET': {
        const { data, error } = await supabase
          .from('connectors')
          .select('id, config');
        if (error) throw error;
        return res.status(200).json(data);
      }
      case 'POST': {
        const { id, config } = req.body;
        if (!id || !config) {
          return res.status(400).json({ error: 'Connector id and config are required' });
        }

        // Encrypt sensitive credentials before storing
        const encryptedConfig = {
          ...config,
          connection: config.connection ? {
            ...config.connection,
            password: config.connection.password ? await encrypt(config.connection.password) : undefined
          } : undefined,
          apiKey: config.apiKey ? await encrypt(config.apiKey) : undefined
        };

        const { data, error } = await supabase
          .from('connectors')
          .upsert({ id, config: encryptedConfig });
        if (error) throw error;
        return res.status(200).json(data?.[0] || null);
      }
      case 'DELETE': {
        const id = req.query.id as string;
        if (!id) {
          return res.status(400).json({ error: 'Connector id is required' });
        }
        const { error } = await supabase
          .from('connectors')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return res.status(204).end();
      }
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error: any) {
    console.error('Connector config error:', error);
    return res.status(500).json({ error: error.message });
  }
}