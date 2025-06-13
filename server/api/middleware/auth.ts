import { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '../../utils/Logger';

export async function authenticate(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<boolean> {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['X-API-KEY'];
    
    if (!apiKey) {
      res.status(401).json({ error: 'No API key provided' });
      return false;
    }

    // TODO: Add API key validation logic here
    // For now, we'll just check if the key exists
    if (typeof apiKey !== 'string' || apiKey.length === 0) {
      logger.error('Invalid API key format');
      res.status(401).json({ error: 'Invalid API key' });
      return false;
    }

    // Add the API key to the request object for use in the route handler
    (req as any).apiKey = apiKey;
    return true;
  } catch (error) {
    logger.error({ error }, 'Authentication failed');
    res.status(401).json({ error: 'Authentication failed' });
    return false;
  }
} 