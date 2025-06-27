import '@/agent/CoordinatorAgent';
import './_lib/dcisionai-agents/intentAgent/agnoIntentAgent';
import './_lib/dcisionai-agents/dataAgent/agnoDataAgent';
import './_lib/dcisionai-agents/modelBuilderAgent/agnoModelBuilderAgent';
import './_lib/dcisionai-agents/explainAgent/agnoExplainAgent';
import './_lib/ConstructionMCPSolver';

import { NextApiRequest, NextApiResponse } from 'next';
import { messageBus } from '@/agent/MessageBus';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionId = uuidv4();
    console.log(`🧪 Testing message bus for session: ${sessionId}`);

    const events: any[] = [];
    let testEventReceived = false;

    // Subscribe to a test event
    messageBus.subscribe('test_event', (msg: any) => {
      if (msg.correlationId === sessionId) {
        events.push({
          type: 'test_event',
          payload: msg.payload,
          timestamp: new Date().toISOString()
        });
        testEventReceived = true;
        console.log(`✅ Test event received: ${JSON.stringify(msg.payload)}`);
      }
    });

    // Subscribe to all events for debugging
    messageBus.subscribe('*', (msg: any) => {
      if (msg.correlationId === sessionId) {
        console.log(`🔍 Event received: ${msg.type} for session ${sessionId}`);
        events.push({
          type: msg.type,
          payload: msg.payload,
          timestamp: new Date().toISOString()
        });
      }
    });

    console.log(`📤 Publishing test_event for session: ${sessionId}`);
    
    // Publish a test event
    messageBus.publish({
      type: 'test_event',
      payload: {
        message: 'Hello from test',
        sessionId
      },
      correlationId: sessionId
    });

    // Wait for response
    const timeout = 5000; // 5 seconds
    const startTime = Date.now();
    
    while (!testEventReceived && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const response = {
      success: testEventReceived,
      events,
      sessionId,
      duration: Date.now() - startTime,
      timeout: !testEventReceived
    };

    console.log(`📊 Message bus test completed: ${JSON.stringify(response)}`);
    res.status(200).json(response);

  } catch (error: any) {
    console.error('❌ Message bus test error:', error);
    res.status(500).json({
      error: 'Test failed',
      message: error.message
    });
  }
} 