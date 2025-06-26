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
    const { message, query, useCase = 'rag', sessionId = uuidv4() } = req.body;
    const userQuery = message || query || 'What is the capital of France?';
    
    console.log(`🧪 Testing simple agent response for session: ${sessionId}, useCase: ${useCase}`);

    const events: any[] = [];
    let intentReceived = false;

    // Subscribe to intent_identified event
    messageBus.subscribe('intent_identified', (msg: any) => {
      if (msg.correlationId === sessionId) {
        events.push({
          type: 'intent_identified',
          payload: msg.payload,
          timestamp: new Date().toISOString()
        });
        intentReceived = true;
        console.log(`✅ Intent received: ${JSON.stringify(msg.payload)}`);
      }
    });

    // Subscribe to intent_error event
    messageBus.subscribe('intent_error', (msg: any) => {
      if (msg.correlationId === sessionId) {
        events.push({
          type: 'intent_error',
          payload: msg.payload,
          timestamp: new Date().toISOString()
        });
        console.log(`❌ Intent error: ${JSON.stringify(msg.payload)}`);
      }
    });

    // Directly call intent agent
    messageBus.publish({
      type: 'call_intent_agent',
      payload: {
        query: userQuery,
        useCase: useCase,
        sessionId
      },
      correlationId: sessionId
    });

    // Wait for response
    const timeout = 10000; // 10 seconds
    const startTime = Date.now();
    
    while (!intentReceived && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const response = {
      success: intentReceived,
      events,
      sessionId,
      useCase,
      query: userQuery,
      duration: Date.now() - startTime,
      timeout: !intentReceived
    };

    res.status(200).json(response);

  } catch (error: any) {
    console.error('❌ Simple agent test error:', error);
    res.status(500).json({
      error: 'Test failed',
      message: error.message
    });
  }
} 