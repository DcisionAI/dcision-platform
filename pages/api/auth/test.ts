import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../src/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Test the connection by getting the current user count
    const { data, error } = await supabase
      .from('auth.users')
      .select('count', { count: 'exact' });

    if (error) {
      throw error;
    }

    return res.status(200).json({ 
      message: 'Supabase connection successful',
      data 
    });
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return res.status(500).json({ 
      message: 'Failed to connect to Supabase',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 