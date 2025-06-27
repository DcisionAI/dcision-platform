import { NextApiRequest, NextApiResponse } from 'next';
import { intentAgent } from '../../agent/IntentAgent';
import { EVENT_TYPES } from '../../agent/EventTypes';
import { messageBus } from '../../agent/MessageBus';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, customerData = {} } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const sessionId = `test-simple-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🧪 Testing simple intent analysis for session: ${sessionId}`);
    console.log(`📝 Query: ${query}`);

    // Set up response tracking
    let intentResult: any = null;
    let intentError: any = null;

    // Subscribe to intent identified events
    const handleIntentIdentified = (event: any) => {
      if (event.correlationId === sessionId) {
        intentResult = event.payload;
        console.log(`✅ Intent identified for session: ${sessionId}`);
      }
    };

    const handleAgentError = (event: any) => {
      if (event.correlationId === sessionId) {
        intentError = event.payload;
        console.error(`❌ Intent analysis failed for session: ${sessionId}`);
      }
    };

    // Subscribe to events
    messageBus.subscribe(EVENT_TYPES.INTENT_IDENTIFIED, handleIntentIdentified);
    messageBus.subscribe(EVENT_TYPES.AGENT_ERROR, handleAgentError);

    // Publish user query event
    messageBus.publish({
      type: EVENT_TYPES.USER_QUERY_RECEIVED,
      payload: {
        query: query,
        customerData: customerData,
        sessionId: sessionId
      },
      correlationId: sessionId,
      from: 'test-simple-endpoint'
    });

    // Wait for intent analysis with timeout
    const maxWaitTime = 10000; // 10 seconds
    const startTime = Date.now();
    
    while (!intentResult && !intentError && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Clean up subscriptions
    messageBus.unsubscribe(EVENT_TYPES.INTENT_IDENTIFIED, handleIntentIdentified);
    messageBus.unsubscribe(EVENT_TYPES.AGENT_ERROR, handleAgentError);

    // Check for timeout
    if (!intentResult && !intentError) {
      console.error(`⏰ Simple intent test timed out for session: ${sessionId}`);
      return res.status(408).json({
        error: 'Intent analysis timeout',
        sessionId,
        message: 'Intent analysis did not complete within the expected time'
      });
    }

    // Return result
    if (intentError) {
      console.error(`❌ Simple intent test failed:`, intentError);
      return res.status(500).json({
        error: 'Intent analysis failed',
        sessionId,
        ...intentError
      });
    }

    console.log(`✅ Simple intent test completed successfully for session: ${sessionId}`);
    return res.status(200).json({
      success: true,
      sessionId,
      intent: intentResult
    });

  } catch (error) {
    console.error('❌ Error in simple intent test:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 