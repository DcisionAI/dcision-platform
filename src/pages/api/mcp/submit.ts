import type { NextApiRequest, NextApiResponse } from 'next';
import { orchestrateMCP } from '@server/mcp/orchestrator';
import { MCP } from '@server/mcp/types';

// In-memory store for MCP orchestration results
declare global {
  var decisions: Map<string, any[]> | undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const mcp: MCP = req.body;
    // Optionally: validate MCP structure here
    const results = await orchestrateMCP(mcp);
    // Store results by sessionId for later retrieval
    if (!global.decisions) {
      global.decisions = new Map<string, any[]>();
    }
    global.decisions.set(mcp.sessionId, results);
    return res.status(200).json({ results });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to orchestrate MCP',
      details: error instanceof Error ? error.message : String(error),
    });
  }
} 