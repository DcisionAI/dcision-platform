import type { NextApiRequest, NextApiResponse } from 'next';
import { ExampleSessionService } from '../../../server/mcp/services/ExampleSessionService';
import { MCP, MCPStatus } from '../../../server/mcp/types';

const exampleService = new ExampleSessionService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { page, pageSize, status, problemType, dateStart, dateEnd } = req.query;

      const filters = {
        status: status ? (status as string).split(',') as MCPStatus[] : undefined,
        problemType: problemType ? (problemType as string).split(',') : undefined,
        dateRange: dateStart && dateEnd ? {
          start: dateStart as string,
          end: dateEnd as string
        } : undefined
      };

      const sessions = await exampleService.listSessions(
        parseInt(page as string) || 1,
        parseInt(pageSize as string) || 10,
        filters
      );

      res.status(200).json(sessions);
    } catch (error) {
      console.error('Error in /api/mcp/examples:', error);
      res.status(500).json({ error: 'Failed to fetch example sessions' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 