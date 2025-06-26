// All agent imports working - restore full workflow
import '@/agent/CoordinatorAgent';
import '@/agent/CritiqueAgent';
import '@/agent/DebateAgent';
import '@/agent/MultiAgentDebate';
import '../../_lib/dcisionai-agents/intentAgent/agnoIntentAgent';
import '../../_lib/dcisionai-agents/dataAgent/agnoDataAgent';
import '../../_lib/dcisionai-agents/modelBuilderAgent/agnoModelBuilderAgent';
import '../../_lib/dcisionai-agents/explainAgent/agnoExplainAgent';
import '../../_lib/ConstructionMCPSolver';

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

  try {
    const { message, customerData = {}, sessionId = uuidv4() } = req.body;
    if (!message) {
      return res.status(400).json({ type: 'error', content: 'Message is required' });
    }

    console.log(`🚀 Starting agentic workflow for session: ${sessionId}`);
    console.log(`📝 User message: ${message}`);

    // Progress tracking
    const progressEvents: any[] = [];
    const agentInteractions: any[] = [];
    const debateResults: any[] = [];

    // Subscribe to progress events
    messageBus.subscribe('progress', (msg: any) => {
      if (msg.correlationId === sessionId) {
        progressEvents.push({
          step: msg.payload.step,
          status: msg.payload.status,
          message: msg.payload.message,
          timestamp: new Date().toISOString()
        });
        console.log(`📊 Progress [${msg.payload.step}]: ${msg.payload.status} - ${msg.payload.message}`);
      }
    });

    // Subscribe to agent interactions
    messageBus.subscribe('agent_interaction', (msg: any) => {
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
    });

    // Subscribe to debate events
    messageBus.subscribe('debate_result', (msg: any) => {
      if (msg.correlationId === sessionId) {
        debateResults.push({
          topic: msg.payload.topic,
          participants: msg.payload.participants,
          winner: msg.payload.winner,
          reasoning: msg.payload.reasoning,
          timestamp: new Date().toISOString()
        });
        console.log(`🗣️ Debate Result: ${msg.payload.winner} won debate on ${msg.payload.topic}`);
      }
    });

    // Subscribe to critique events
    messageBus.subscribe('critique_ready', (msg: any) => {
      if (msg.correlationId === sessionId) {
        console.log(`🔍 Critique: ${msg.payload.critique}`);
      }
    });

    // Subscribe to final result
    let finalResult: any = null;
    messageBus.subscribe('workflow_finished', (msg: any) => {
      if (msg.correlationId === sessionId) {
        finalResult = msg.payload;
        console.log(`✅ Agentic workflow completed for session: ${sessionId}`);
      }
    });

    // Start the agentic workflow
    messageBus.publish({
      type: 'start',
      payload: {
        query: message,
        sessionId,
        customerData
      },
      correlationId: sessionId
    });

    // Wait for the workflow to complete (with timeout)
    const timeout = 60000; // 60 seconds (increased for critique and debate)
    const startTime = Date.now();
    
    while (!finalResult && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!finalResult) {
      return res.status(408).json({
        type: 'error',
        content: 'Request timeout - agentic workflow took too long to complete'
      });
    }

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
      debateResults,
      
      // New agentic results
      critique: finalResult.critique,
      debate: finalResult.debate,
      
      // Metadata
      sessionId,
      workflowType: 'agentic',
      timestamps: {
        start: new Date(startTime).toISOString(),
        end: new Date().toISOString(),
        duration: Date.now() - startTime
      }
    };

    res.status(200).json({
      type: 'agentic',
      content: responseContent
    });

  } catch (error: any) {
    console.error('❌ Agentic chat API error:', error);
    res.status(500).json({
      type: 'error',
      content: 'Network or server error. Please try again in a moment.'
    });
  }
} 