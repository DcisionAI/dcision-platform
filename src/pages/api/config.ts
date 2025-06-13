import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    // Add any other configuration values needed by the client
    apiVersion: '1.0.0'
  });
} 