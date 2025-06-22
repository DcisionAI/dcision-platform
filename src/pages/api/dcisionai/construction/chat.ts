import { NextApiRequest, NextApiResponse } from 'next';
import { agentOrchestrator, ProgressEvent } from '../../_lib/AgentOrchestrator';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ type: 'error', content: 'Method not allowed' });
  }

  try {
    const { message, customerData = {}, sessionId = uuidv4(), useOrchestration = true } = req.body;
    if (!message) {
      return res.status(400).json({ type: 'error', content: 'Message is required' });
    }

    // If orchestration is enabled (default), use the full orchestrated workflow
    if (useOrchestration) {
      console.log(`🚀 Starting orchestrated workflow for session: ${sessionId}`);
      console.log(`📝 User message: ${message}`);

      // Progress tracking
      const progressEvents: ProgressEvent[] = [];
      const onProgress = (event: ProgressEvent) => {
        progressEvents.push(event);
        console.log(`📊 Progress [${event.step}]: ${event.status} - ${event.message}`);
      };

      // Execute the full orchestrated workflow
      const result = await agentOrchestrator.orchestrate(
        message,
        customerData,
        sessionId,
        onProgress
      );

      if (result.status === 'error') {
        console.error('❌ Orchestration failed:', result.error);
        return res.status(500).json({
          type: 'error',
          content: result.error?.message || 'Workflow execution failed'
        });
      }

      // Format response based on execution path
      let responseContent: any = {
        intentAgentAnalysis: result.intentAnalysis,
        progressEvents,
        timestamps: result.timestamps
      };

      switch (result.executionPath) {
        case 'rag':
          responseContent.rag = result.ragResult?.answer;
          responseContent.sources = result.ragResult?.sources;
          break;

        case 'optimization':
          // Pass the entire optimizationResult object to the frontend
          responseContent.solution = result.optimizationResult;
          break;

        case 'hybrid':
          responseContent.rag = result.ragResult?.answer;
          responseContent.sources = result.ragResult?.sources;
          // Pass the entire optimizationResult object to the frontend
          responseContent.solution = result.optimizationResult;
          break;
      }

      // Add explanation and visualization if available
      if (result.explanation) {
        responseContent.explanation = result.explanation;
      }
      if (result.mermaidDiagram) {
        responseContent.visualization = result.mermaidDiagram;
      }

      console.log(`✅ Orchestration completed successfully for session: ${sessionId}`);
      console.log(`📊 Execution path: ${result.executionPath}`);
      console.log(`⏱️ Total time: ${new Date(result.timestamps.end).getTime() - new Date(result.timestamps.start).getTime()}ms`);

      res.status(200).json({
        type: result.executionPath,
        content: responseContent
      });
    } else {
      // Fallback to simple chat (for backward compatibility)
      res.status(200).json({
        type: 'chat',
        content: {
          message: 'Simple chat mode is deprecated. Please use orchestration mode.',
          summary: 'Orchestration is now the default AI Assistant mode.'
        }
      });
    }

  } catch (error: any) {
    console.error('❌ Construction chat API error:', error);
    res.status(500).json({
      type: 'error',
      content: 'Network or server error. Please try again in a moment.'
    });
  }
} 