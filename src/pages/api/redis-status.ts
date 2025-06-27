import { NextApiRequest, NextApiResponse } from 'next';
import { messageBus } from '../../agent/MessageBus';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const status = messageBus.getStatus();
    
    res.status(200).json({
      message: 'Redis status check completed',
      status,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Redis status check failed:', error);
    res.status(500).json({
      error: 'Failed to check Redis status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 