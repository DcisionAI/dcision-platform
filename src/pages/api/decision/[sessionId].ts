import type { NextApiRequest, NextApiResponse } from 'next';

// Returns the stored decision result for a given session
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { sessionId } = req.query;
  if (!sessionId || Array.isArray(sessionId)) {
    return res.status(400).json({ error: 'Invalid sessionId' });
  }
  const key = sessionId as string;
  if (!global.decisions || !global.decisions.has(key)) {
    return res.status(404).json({ error: 'Decision not found' });
  }
  const results = global.decisions.get(key)!;
  // Find the solve_model step result
  const solveStep = results.find(r => r.step.action === 'solve_model');
  if (!solveStep) {
    return res.status(200).json({ message: 'Model built but not solved', buildResults: results });
  }
  return res.status(200).json({ solution: solveStep.result, details: solveStep });
}