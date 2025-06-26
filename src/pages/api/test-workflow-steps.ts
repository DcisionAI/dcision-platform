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
    
    console.log(`🧪 Testing workflow steps for session: ${sessionId}, useCase: ${useCase}`);
    console.log(`📝 Query: ${userQuery}`);

    const events: any[] = [];
    let workflowCompleted = false;

    // Subscribe to all workflow events
    const eventTypes = [
      'progress', 'agent_interaction', 'debate_result', 'critique_ready',
      'intent_identified', 'data_prepared', 'model_built', 'solution_found', 'explanation_ready',
      'critique_complete', 'debate_complete', 'workflow_finished'
    ];

    eventTypes.forEach(eventType => {
      messageBus.subscribe(eventType, (msg: any) => {
        if (msg.correlationId === sessionId) {
          events.push({
            type: eventType,
            payload: msg.payload,
            timestamp: new Date().toISOString()
          });
          console.log(`📊 Event: ${eventType} for session: ${sessionId}`);
          
          if (eventType === 'workflow_finished') {
            workflowCompleted = true;
            console.log(`🎉 Workflow completed for session: ${sessionId}`);
          }
        }
      });
    });

    // Start the workflow
    messageBus.publish({
      type: 'start',
      payload: {
        query: userQuery,
        useCase: useCase,
        sessionId
      },
      correlationId: sessionId
    });

    console.log(`🚀 Workflow started for session: ${sessionId}`);

    // Wait for completion with timeout
    const timeout = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (!workflowCompleted && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const response = {
      success: workflowCompleted,
      events,
      sessionId,
      useCase,
      query: userQuery,
      duration: Date.now() - startTime,
      timeout: !workflowCompleted
    };

    console.log(`📊 Workflow test completed for session: ${sessionId}, success: ${workflowCompleted}`);

    res.status(200).json(response);

  } catch (error: any) {
    console.error('❌ Workflow test error:', error);
    res.status(500).json({
      error: 'Test failed',
      message: error.message
    });
  }
} 