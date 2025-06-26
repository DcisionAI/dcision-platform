// Import only essential agents for testing
import '@/agent/CoordinatorAgent';
import '@/agent/CritiqueAgent';
import '@/agent/DebateAgent';
import '@/agent/MultiAgentDebate';

import { NextApiRequest, NextApiResponse } from 'next';
import { messageBus } from '@/agent/MessageBus';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, sessionId = uuidv4() } = req.body;
    
    console.log(`🧪 Testing simple agentic workflow for session: ${sessionId}`);
    console.log(`📝 Message: ${message}`);

    // Simple test response
    const testResponse = {
      type: 'agentic_test',
      content: {
        message: `Test response for: ${message}`,
        sessionId,
        timestamp: new Date().toISOString(),
        testMode: true
      }
    };

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.status(200).json(testResponse);

  } catch (error: any) {
    console.error('❌ Test agentic API error:', error);
    res.status(500).json({
      error: 'Test failed',
      message: error.message
    });
  }
} 