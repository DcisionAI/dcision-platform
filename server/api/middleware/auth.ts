import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../utils/Logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function authenticate(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<boolean> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header' });
      return false;
    }

    // Extract the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '');

    // Verify the session with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.error({ error }, 'Authentication failed');
      res.status(401).json({ error: 'Invalid token' });
      return false;
    }

    // Add the user to the request object
    (req as any).user = user;
    return true;
  } catch (error) {
    logger.error({ error }, 'Authentication failed');
    res.status(401).json({ error: 'Authentication failed' });
    return false;
  }
} 