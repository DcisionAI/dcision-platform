import { NextApiRequest, NextApiResponse } from 'next';

// Extend the NodeJS.Global interface to include our in-memory decision store
declare global {
  var decisions: Map<string, any>;
}

// Ensure the global map exists
global.decisions = global.decisions || new Map<string, any>();

// Returns the stored decision result for a given session
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  const key = sessionId as string;
  if (!global.decisions.has(key)) {
    return res.status(404).json({ error: 'Decision not found' });
  }

  const results = global.decisions.get(key)!;
  return res.status(200).json(results);
}