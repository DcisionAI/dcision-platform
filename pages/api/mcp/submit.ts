import { NextApiRequest, NextApiResponse } from 'next';
import { MCP } from '../../../server/mcp/types/MCPTypes';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { config } = req.body;

    // Validate the MCP configuration
    if (!config) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'MCP configuration is required'
      });
    }

    // Validate required MCP fields
    if (!config.context?.problemType) {
      return res.status(400).json({
        error: 'Invalid MCP configuration',
        details: 'Missing required field: context.problemType'
      });
    }

    // Map problem type to appropriate next steps
    let nextSteps: string[] = [];
    switch (config.context.problemType) {
      case 'vehicle_routing':
        nextSteps = [
          'Validating vehicle and delivery data',
          'Building VRP optimization model',
          'Solving with OR-Tools engine',
          'Generating route visualizations'
        ];
        break;
      case 'workforce_optimization':
        nextSteps = [
          'Validating technician and job data',
          'Building workforce scheduling model',
          'Solving with CP-SAT solver',
          'Generating schedule visualizations'
        ];
        break;
      default:
        nextSteps = [
          'Validating input data',
          'Building optimization model',
          'Solving with selected solver',
          'Generating solution visualizations'
        ];
    }

    const response = {
      status: 'accepted',
      jobId: `job-${Date.now()}`,
      problemType: config.context.problemType,
      estimatedTime: config.context.problemType === 'vehicle_routing' ? '10 minutes' : '5 minutes',
      nextSteps
    };

    res.status(202).json(response);
  } catch (error) {
    console.error('Error processing MCP submission:', error);
    res.status(500).json({ 
      error: 'Failed to process MCP',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 