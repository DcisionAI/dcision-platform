import { NextApiRequest, NextApiResponse } from 'next';
import { ExampleSessionService } from '@server/mcp/services/ExampleSessionService';

const exampleService = new ExampleSessionService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { sessionId } = req.query;

  try {
    const session = await exampleService.getSession(sessionId as string);
    res.status(200).json(session);
  } catch (error) {
    console.error('Error in /api/mcp/examples/[sessionId]:', error);
    res.status(404).json({ error: `Example session ${sessionId} not found` });
  }
} 