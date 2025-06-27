// Global subscription registry to prevent duplicates
declare global {
  var __subscriptionRegistry: Set<string>;
}

if (!global.__subscriptionRegistry) {
  global.__subscriptionRegistry = new Set();
}

// All agent imports working - restore full workflow
// Import all agents and handlers (side-effect imports must use consistent paths to avoid duplicate subscriptions)
if (!global.__subscriptionRegistry.has('agents_imported')) {
  global.__subscriptionRegistry.add('agents_imported');
  import('@/agent/CoordinatorAgent');
  import('@/agent/CritiqueAgent');
  import('@/agent/DebateAgent');
  import('@/agent/MultiAgentDebate');
  import('@/pages/api/_lib/dcisionai-agents/intentAgent');
  import('@/pages/api/_lib/dcisionai-agents/dataAgent');
  import('@/pages/api/_lib/dcisionai-agents/modelBuilderAgent');
  import('@/pages/api/_lib/dcisionai-agents/explainAgent');
  import('@/pages/api/_lib/ConstructionMCPSolver');
}

import { NextApiRequest, NextApiResponse } from 'next';
import { messageBus } from '@/agent/MessageBus';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ type: 'error', content: 'Method not allowed' });
  }

  // Define cleanup functions at the top level
  let onProgress: ((msg: any) => void) | null = null;
  let onAgentInteraction: ((msg: any) => void) | null = null;
  let onCritiqueReady: ((msg: any) => void) | null = null;
  let onWorkflowFinished: ((msg: any) => void) | null = null;

  const cleanup = () => {
    if (onProgress) messageBus.unsubscribe('progress', onProgress);
    if (onAgentInteraction) messageBus.unsubscribe('agent_interaction', onAgentInteraction);
    if (onCritiqueReady) messageBus.unsubscribe('critique_ready', onCritiqueReady);
    if (onWorkflowFinished) messageBus.unsubscribe('workflow_finished', onWorkflowFinished);
  };

  try {
    const { message, customerData = {}, sessionId = uuidv4() } = req.body;
    if (!message) {
      return res.status(400).json({ type: 'error', content: 'Message is required' });
    }

    console.log(`🚀 Starting agentic workflow for session: ${sessionId}`);
    console.log(`📝 User message: ${message}`);

    // Set up timeout for the entire workflow
    const workflowTimeout = setTimeout(() => {
      console.error(`⏰ Workflow timeout for session: ${sessionId}`);
      messageBus.publish({ 
        type: 'workflow_error', 
        payload: { error: 'Workflow timeout', step: 'timeout' }, 
        correlationId: sessionId 
      });
      
      // Clean up all state
      cleanup();
      
      res.status(408).json({ 
        type: 'error', 
        content: 'Request timeout - agentic workflow took too long to complete',
        sessionId: sessionId
      });
    }, 45000); // 45 second timeout (5 seconds less than the 50 second curl timeout)

    // Set up progress tracking
    const progressEvents: any[] = [];
    const agentInteractions: any[] = [];

    // Subscribe to workflow events with cleanup
    let finalResult: any = null;
    let workflowError: any = null;
    
    // Progress events
    onProgress = (msg: any) => {
      if (msg.correlationId === sessionId) {
        progressEvents.push({
          step: msg.payload.step,
          status: msg.payload.status,
          message: msg.payload.message,
          timestamp: new Date().toISOString()
        });
        console.log(`📊 Progress [${msg.payload.step}]: ${msg.payload.status} - ${msg.payload.message}`);
      }
    };
    messageBus.subscribe('progress', onProgress);
    
    // Agent interactions
    onAgentInteraction = (msg: any) => {
      if (msg.correlationId === sessionId) {
        agentInteractions.push({
          from: msg.payload.from,
          to: msg.payload.to,
          type: msg.payload.type,
          content: msg.payload.content,
          timestamp: new Date().toISOString()
        });
        console.log(`🤖 Agent Interaction: ${msg.payload.from} → ${msg.payload.to} (${msg.payload.type})`);
      }
    };
    messageBus.subscribe('agent_interaction', onAgentInteraction);
    
    // Critique events
    onCritiqueReady = (msg: any) => {
      if (msg.correlationId === sessionId) {
        console.log(`🔍 Critique: ${msg.payload.critique}`);
      }
    };
    messageBus.subscribe('critique_ready', onCritiqueReady);
    
    // Final result
    onWorkflowFinished = (msg: any) => {
      if (msg.correlationId === sessionId) {
        finalResult = msg.payload;
        console.log(`✅ Agentic workflow completed for session: ${sessionId}`);
        clearTimeout(workflowTimeout);
        
        // Clean up all state
        cleanup();
        
        // Format the response
        const responseContent = {
          // Core result
          solution: finalResult.solution,
          explanation: finalResult.explanation,
          visualization: finalResult.visualization,
          intent: finalResult.intent,
          enrichedData: finalResult.enrichedData,
          model: finalResult.model,
          
          // Agentic features
          progressEvents,
          agentInteractions,
          
          // New agentic results
          critique: finalResult.critique,
          
          // Metadata
          sessionId,
          workflowType: 'agentic',
          timestamps: {
            start: new Date(Date.now() - (Date.now() - Date.parse(msg.payload.timestamps.start))).toISOString(),
            end: new Date().toISOString(),
            duration: Date.now() - Date.parse(msg.payload.timestamps.start)
          }
        };
        
        res.status(200).json({
          type: 'agentic',
          content: responseContent
        });
      }
    };
    messageBus.subscribe('workflow_finished', onWorkflowFinished);

    // Error handling
    const onWorkflowError = (msg: any) => {
      if (msg.correlationId === sessionId) {
        workflowError = msg.payload;
        console.error(`❌ Workflow error for session: ${sessionId}:`, msg.payload);
        clearTimeout(workflowTimeout);
        
        // Clean up all state
        cleanup();
        
        res.status(500).json({
          type: 'error',
          content: `Workflow error: ${msg.payload.error}`,
          sessionId: sessionId,
          step: msg.payload.step
        });
      }
    };
    messageBus.subscribe('workflow_error', onWorkflowError);

    // Start the agentic workflow
    // Kick off the agentic workflow; disable critique/debate by default
    messageBus.publish({
      type: 'start',
      payload: {
        query: message,
        sessionId,
        customerData,
        runCritique: false,
        runDebate: false
      },
      correlationId: sessionId
    });

    // Wait for the workflow to complete (with timeout)
    const timeout = 45000; // 45 seconds (reduced from 60)
    const startTime = Date.now();
    
    while (!finalResult && !workflowError && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Cleanup error handler
    messageBus.unsubscribe('workflow_error', onWorkflowError);

    if (workflowError) {
      cleanup();
      return res.status(500).json({
        type: 'error',
        content: `Workflow error: ${workflowError.error?.message || workflowError.error || 'Unknown error'}`
      });
    }

    if (!finalResult) {
      cleanup();
      return res.status(408).json({
        type: 'error',
        content: 'Request timeout - agentic workflow took too long to complete'
      });
    }

  } catch (error: any) {
    console.error('❌ Agentic chat API error:', error);
    cleanup();
    res.status(500).json({
      type: 'error',
      content: 'Network or server error. Please try again in a moment.'
    });
  }
} 