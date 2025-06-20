// End-to-end orchestrating workflow for the construction vertical using Agno-based agents
import { agnoIntentAgent } from '@/pages/api/_lib/dcisionai-agents/intentAgent/agnoIntentAgent';
import { agnoDataAgent } from '@/pages/api/_lib/dcisionai-agents/dataAgent/agnoDataAgent';
import { agnoModelBuilderAgent } from '@/pages/api/_lib/dcisionai-agents/modelBuilderAgent/agnoModelBuilderAgent';
import { agnoExplainAgent } from '@/pages/api/_lib/dcisionai-agents/explainAgent/agnoExplainAgent';
import { v4 as uuidv4 } from 'uuid';
import { withRetry } from '@/utils/agno/retry';
import { withProgress, ProgressTracker } from '@/utils/agno/progress';
import { intentMemory, dataMemory, modelMemory, explainMemory } from '@/utils/agno/memory';
import { AgnoError, ErrorCodes } from '@/utils/agno/errors';

export interface WorkflowResult {
  sessionId: string;
  intent: any;
  enriched: any;
  mcp: any;
  solverSolution: any;
  explanation: any;
  status: 'success' | 'error';
  error?: {
    code: string;
    message: string;
    context?: Record<string, any>;
  };
  timestamps: {
    start: string;
    end: string;
    steps: Record<string, string>;
  };
}

export async function constructionWorkflow({
  userInput,
  customerData,
  humanInTheLoop = false,
  sessionId = uuidv4(),
  onProgress
}: {
  userInput: string;
  customerData: any;
  humanInTheLoop?: boolean;
  sessionId?: string;
  onProgress?: (event: any) => void;
}): Promise<WorkflowResult> {
  const startTime = new Date().toISOString();
  const timestamps: Record<string, string> = {};
  const progressTracker = new ProgressTracker(sessionId);

  if (onProgress) {
    progressTracker.subscribe(onProgress);
  }

  try {
    // 1. Intent Agent: Understand the decision
    timestamps.intentStart = new Date().toISOString();
    const intent = await withProgress(
      async (progress) => {
        try {
          const result = await withRetry(
            () => agnoIntentAgent.interpretIntent(userInput, sessionId),
            { maxAttempts: 3 }
          );
          await intentMemory.saveContext({
            sessionId,
            timestamp: new Date().toISOString(),
            type: 'intent',
            data: result
          });
          return result;
        } catch (error) {
          progress.error('intent', 'Intent analysis failed', error);
          throw error;
        }
      },
      sessionId,
      'intent',
      'Analyzing user intent'
    );
    timestamps.intentEnd = new Date().toISOString();

    // 2. Data Agent: Enrich customer data
    timestamps.dataStart = new Date().toISOString();
    const enriched = await withProgress(
      async (progress) => {
        try {
          const result = await withRetry(
            () => agnoDataAgent.enrichData(customerData, sessionId),
            { maxAttempts: 3 }
          );
          await dataMemory.saveContext({
            sessionId,
            timestamp: new Date().toISOString(),
            type: 'data',
            data: result
          });
          return result;
        } catch (error) {
          progress.error('data', 'Data enrichment failed', error);
          throw error;
        }
      },
      sessionId,
      'data',
      'Enriching customer data'
    );
    timestamps.dataEnd = new Date().toISOString();

    // 3. Model Builder Agent: Build MCP config
    timestamps.modelStart = new Date().toISOString();
    const mcp = await withProgress(
      async (progress) => {
        try {
          const result = await withRetry(
            () => agnoModelBuilderAgent.buildModel(enriched.enrichedData, intent, sessionId),
            { maxAttempts: 3 }
          );
          await modelMemory.saveContext({
            sessionId,
            timestamp: new Date().toISOString(),
            type: 'model',
            data: result
          });
          return result;
        } catch (error) {
          progress.error('model', 'Model building failed', error);
          throw error;
        }
      },
      sessionId,
      'model',
      'Building optimization model'
    );
    timestamps.modelEnd = new Date().toISOString();

    // 4. (Optional) Human-in-the-loop review
    if (humanInTheLoop) {
      timestamps.reviewStart = new Date().toISOString();
      await withProgress(
        async (progress) => {
          try {
            progress.progress('review', 'Waiting for human review');
            // TODO: Implement human review UI and wait for approval
            await new Promise(resolve => setTimeout(resolve, 5000));
            progress.complete('review', 'Human review completed');
          } catch (error) {
            progress.error('review', 'Human review failed', error);
            throw error;
          }
        },
        sessionId,
        'review',
        'Human review'
      );
      timestamps.reviewEnd = new Date().toISOString();
    }

    // 5. Call the solver (MCP/optimization engine)
    timestamps.solverStart = new Date().toISOString();
    const solverSolution = await withProgress(
      async (progress) => {
        try {
          // TODO: Integrate with your solver service
          const solution = { /* ...mock solution... */ };
          progress.complete('solver', 'Solver completed', solution);
          return solution;
        } catch (error) {
          progress.error('solver', 'Solver failed', error);
          throw error;
        }
      },
      sessionId,
      'solver',
      'Running optimization solver'
    );
    timestamps.solverEnd = new Date().toISOString();

    // 6. Explainability Agent: Generate explanation
    timestamps.explainStart = new Date().toISOString();
    const explanation = await withProgress(
      async (progress) => {
        try {
          const result = await withRetry(
            () => agnoExplainAgent.explainSolution(solverSolution, sessionId),
            { maxAttempts: 3 }
          );
          await explainMemory.saveContext({
            sessionId,
            timestamp: new Date().toISOString(),
            type: 'explanation',
            data: result
          });
          return result;
        } catch (error) {
          progress.error('explain', 'Explanation generation failed', error);
          throw error;
        }
      },
      sessionId,
      'explain',
      'Generating solution explanation'
    );
    timestamps.explainEnd = new Date().toISOString();

    const endTime = new Date().toISOString();

    // 7. Return all results
    return {
      sessionId,
      intent,
      enriched,
      mcp,
      solverSolution,
      explanation,
      status: 'success',
      timestamps: {
        start: startTime,
        end: endTime,
        steps: timestamps
      }
    };
  } catch (error) {
    const endTime = new Date().toISOString();
    
    // Handle Agno errors specifically
    if (error instanceof AgnoError) {
      return {
        sessionId,
        intent: null,
        enriched: null,
        mcp: null,
        solverSolution: null,
        explanation: null,
        status: 'error',
        error: {
          code: error.code,
          message: error.message,
          context: error.context
        },
        timestamps: {
          start: startTime,
          end: endTime,
          steps: timestamps
        }
      };
    }

    // Handle unknown errors
    return {
      sessionId,
      intent: null,
      enriched: null,
      mcp: null,
      solverSolution: null,
      explanation: null,
      status: 'error',
      error: {
        code: ErrorCodes.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        context: { error }
      },
      timestamps: {
        start: startTime,
        end: endTime,
        steps: timestamps
      }
    };
  }
} 