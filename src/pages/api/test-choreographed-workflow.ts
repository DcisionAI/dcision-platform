import { NextApiRequest, NextApiResponse } from 'next';
import { choreographedOrchestrator } from '../../agent/ChoreographedOrchestrator';
import { EVENT_TYPES } from '../../agent/EventTypes';
import { intentAgent } from '../../agent/IntentAgent';
import { messageBus } from '../../agent/MessageBus';

// Import additional agents for complete workflow
import '../../agent/ModelBuilderAgent';
import '../../agent/SolverAgent';
import '../../agent/DataAgent';
import '../../agent/ResponseAgent';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, customerData = {} } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const sessionId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🧪 Testing choreographed workflow for session: ${sessionId}`);
    console.log(`📝 Query: ${query}`);

    // Debug: Check if IntentAgent is initialized
    console.log(`🔍 IntentAgent status:`, intentAgent.getStatus());

    // Set up response tracking
    let workflowResult: any = null;
    let workflowError: any = null;
    let allEvents: any[] = [];
    let intentIdentified = false;

    // Subscribe to workflow completion events
    const handleWorkflowCompleted = (event: any) => {
      if (event.correlationId === sessionId) {
        workflowResult = event.payload;
        console.log(`✅ Workflow completed for session: ${sessionId}`);
      }
    };

    const handleWorkflowFailed = (event: any) => {
      if (event.correlationId === sessionId) {
        workflowError = event.payload;
        console.error(`❌ Workflow failed for session: ${sessionId}`);
      }
    };

    const handleWorkflowTimeout = (event: any) => {
      if (event.correlationId === sessionId) {
        workflowError = event.payload;
        console.error(`⏰ Workflow timed out for session: ${sessionId}`);
      }
    };

    // Debug: Track all events for this session
    const handleAllEvents = (event: any) => {
      if (event.correlationId === sessionId) {
        allEvents.push({
          type: event.type,
          from: event.from,
          timestamp: new Date().toISOString(),
          payload: event.payload
        });
        console.log(`📊 Event tracked: ${event.type} from ${event.from} for session: ${sessionId}`);
        
        // Track if intent was identified
        if (event.type === EVENT_TYPES.INTENT_IDENTIFIED) {
          intentIdentified = true;
          console.log(`🎯 Intent identified for session: ${sessionId}`);
        }
      }
    };

    // Subscribe to events
    choreographedOrchestrator.subscribe(EVENT_TYPES.WORKFLOW_COMPLETED, handleWorkflowCompleted);
    choreographedOrchestrator.subscribe(EVENT_TYPES.WORKFLOW_FAILED, handleWorkflowFailed);
    choreographedOrchestrator.subscribe(EVENT_TYPES.WORKFLOW_TIMEOUT, handleWorkflowTimeout);
    
    // Subscribe to all events for debugging
    messageBus.subscribe('*', handleAllEvents);

    // Test direct event publishing to IntentAgent
    console.log(`🧪 Testing direct event to IntentAgent...`);
    messageBus.publish({
      type: EVENT_TYPES.USER_QUERY_RECEIVED,
      payload: {
        query: query,
        customerData: customerData,
        sessionId: sessionId
      },
      correlationId: sessionId,
      from: 'test-endpoint'
    });

    // Start the workflow
    choreographedOrchestrator.publish({
      type: EVENT_TYPES.USER_QUERY_RECEIVED,
      payload: {
        query,
        customerData
      },
      correlationId: sessionId
    });

    // Wait for workflow completion with timeout
    const maxWaitTime = 300000; // 5 minutes
    const startTime = Date.now();
    
    while (!workflowResult && !workflowError && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // If intent was identified but workflow didn't complete, return partial success
      if (intentIdentified && (Date.now() - startTime) > 10000) {
        console.log(`⚠️ Intent identified but workflow didn't complete, returning partial success`);
        break;
      }
    }

    // Clean up subscriptions
    choreographedOrchestrator.unsubscribe(EVENT_TYPES.WORKFLOW_COMPLETED, handleWorkflowCompleted);
    choreographedOrchestrator.unsubscribe(EVENT_TYPES.WORKFLOW_FAILED, handleWorkflowFailed);
    choreographedOrchestrator.unsubscribe(EVENT_TYPES.WORKFLOW_TIMEOUT, handleWorkflowTimeout);
    messageBus.unsubscribe('*', handleAllEvents);

    // Check for timeout
    if (!workflowResult && !workflowError && !intentIdentified) {
      console.error(`⏰ Choreographed workflow test timed out for session: ${sessionId}`);
      console.log(`📊 Events captured during timeout:`, allEvents);
      return res.status(408).json({
        error: 'Workflow timeout',
        sessionId,
        message: 'Workflow did not complete within the expected time',
        events: allEvents
      });
    }

    // Return result
    if (workflowError) {
      console.error(`❌ Choreographed workflow test failed:`, workflowError);
      return res.status(500).json({
        error: 'Workflow failed',
        sessionId,
        events: allEvents,
        ...workflowError
      });
    }

    // If intent was identified but workflow didn't complete, return partial success
    if (intentIdentified && !workflowResult) {
      console.log(`⚠️ Partial success: Intent identified but workflow didn't complete for session: ${sessionId}`);
      return res.status(200).json({
        success: true,
        partial: true,
        sessionId,
        events: allEvents,
        message: 'Intent analysis completed successfully, but workflow did not complete',
        intent: allEvents.find(e => e.type === EVENT_TYPES.INTENT_IDENTIFIED)?.payload
      });
    }

    console.log(`✅ Choreographed workflow test completed successfully for session: ${sessionId}`);
    return res.status(200).json({
      success: true,
      sessionId,
      events: allEvents,
      ...workflowResult
    });

  } catch (error) {
    console.error('❌ Error in choreographed workflow test:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 