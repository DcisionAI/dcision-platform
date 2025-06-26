import { agnoIntentAgent } from './dcisionai-agents/intentAgent/agnoIntentAgent';
import { agnoDataAgent } from './dcisionai-agents/dataAgent/agnoDataAgent';
import { agnoModelBuilderAgent } from './dcisionai-agents/modelBuilderAgent/agnoModelBuilderAgent';
import { enhancedModelBuilder } from './dcisionai-agents/modelBuilderAgent/enhancedModelBuilder';
import { agnoExplainAgent } from './dcisionai-agents/explainAgent/agnoExplainAgent';
import { ConstructionMCPSolver } from './ConstructionMCPSolver';
import { constructionIndex, getEmbeddings } from '../../../lib/pinecone';
import OpenAI from 'openai';
import { generateMermaidFromMCP } from '../../../utils/mermaid.ts';
import { messageBus } from '@/agent/MessageBus';
import { agnoClient, AgnoChatRequest } from './agno-client';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface OrchestrationResult {
  sessionId: string;
  executionPath: 'rag' | 'optimization' | 'hybrid' | 'event-driven';
  intentAnalysis: any;
  ragResult?: any;
  optimizationResult?: any;
  explanation?: any;
  mermaidDiagram?: string;
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

export interface ProgressEvent {
  step: string;
  status: 'start' | 'progress' | 'complete' | 'error';
  message: string;
  data?: any;
  error?: any;
}

export class AgentOrchestrator {
  private solver: ConstructionMCPSolver | null = null;

  constructor() {}

  async initialize() {
    if (!this.solver) {
      this.solver = new ConstructionMCPSolver();
      await this.solver.initialize();
    }
  }

  async orchestrate(
    userInput: string,
    customerData: any = {},
    sessionId: string,
    onProgress?: (event: ProgressEvent) => void
  ): Promise<OrchestrationResult> {
    const correlationId = sessionId;
    return new Promise((resolve) => {
      // Subscribe for the final result
      messageBus.subscribe('explanation_ready', (msg: any) => {
        if (msg.correlationId === correlationId) {
          resolve({
            sessionId,
            executionPath: 'event-driven',
            intentAnalysis: null, // You can extract from earlier events if needed
            ragResult: null,
            optimizationResult: null,
            explanation: msg.payload.explanation,
            mermaidDiagram: null,
            status: 'success',
            timestamps: { start: '', end: '', steps: {} }
          });
        }
      });
      // Start the process
      messageBus.publish({ type: 'user_query', payload: { query: userInput, sessionId, customerData }, correlationId });
    });
  }

  private async executeRAG(userInput: string, intentAnalysis: any): Promise<any> {
    const queryEmbedding = await getEmbeddings(userInput);
    const queryResponse = await constructionIndex.query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
    });

    const context = queryResponse.matches.map(match => match.metadata?.text).join('\n\n');

    const prompt = `You are a helpful construction knowledge base assistant. Answer the user's question based on the provided context.

    Context:
    ${context}
    
    Question: ${userInput}
    
    Answer:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
    });

    return {
      answer: completion.choices[0].message.content || 'No information found.',
      sources: queryResponse.matches.map(match => ({
        text: match.metadata?.text,
        score: match.score,
        metadata: match.metadata
      }))
    };
  }

  private async executeOptimization(
    userInput: string,
    customerData: any,
    intentAnalysis: any,
    ragResult: any,
    sessionId: string,
    onProgress?: (event: ProgressEvent) => void
  ): Promise<any> {
    const timestamps: Record<string, string> = {};

    onProgress?.({
      step: 'data_enrichment',
      status: 'start',
      message: 'Enriching data...'
    });
    
    // Pass userInput to the data agent
    const enrichedData = await agnoDataAgent.enrichData(
      customerData,
      intentAnalysis,
      sessionId,
      'anthropic',
      undefined,
      userInput
    );

    onProgress?.({
      step: 'data_enrichment',
      status: 'complete',
      message: 'Data enrichment complete',
      data: enrichedData
    });
    timestamps.dataEnrichmentEnd = new Date().toISOString();

    // Step 2: Model Building
    timestamps.modelBuildingStart = new Date().toISOString();
    onProgress?.({
      step: 'model_building',
      status: 'start',
      message: 'Building optimization model...'
    });

    // Use enhanced model builder with GPT-4o-mini for better performance
    const modelResult = await enhancedModelBuilder.buildModel(
      userInput, // Pass user input for dynamic generation
      enrichedData,
      intentAnalysis
    );

    console.log('Model Builder Result:', {
      approach: modelResult.approach,
      confidence: modelResult.confidence,
      modelType: modelResult.modelType,
      problemComplexity: modelResult.problemComplexity,
      reasoning: modelResult.reasoning
    });

    onProgress?.({
      step: 'model_building',
      status: 'complete',
      message: 'Model building complete',
      data: modelResult,
    });
    timestamps.modelBuildingEnd = new Date().toISOString();

    // Generate Mermaid Diagram
    const mermaidDiagram = generateMermaidFromMCP(modelResult.mcpConfig);

    // Step 3: Solve the problem
    timestamps.solvingStart = new Date().toISOString();
    onProgress?.({
      step: 'solving',
      status: 'start',
      message: 'Solving optimization problem...'
    });

    await this.initialize();
    const solution = await this.solver!.solveConstructionOptimization(modelResult);

    onProgress?.({
      step: 'solving',
      status: 'complete',
      message: 'Optimization solved',
      data: solution
    });
    timestamps.solvingEnd = new Date().toISOString();

    return { ...solution, mermaidDiagram, timestamps };
  }

  private async generateExplanation(
    executionPath: string,
    intentAnalysis: any,
    ragResult: any,
    optimizationResult: any,
    sessionId: string
  ): Promise<any> {
    // Format the solution data according to what the Explain Agent expects
    let solutionData: any;
    
    if (executionPath === 'rag') {
      solutionData = {
        status: 'rag_completed',
        intent: intentAnalysis,
        ragResult: {
          answer: ragResult?.answer,
          sources: ragResult?.sources
        }
      };
    } else if (executionPath === 'optimization') {
      solutionData = {
        status: 'optimization_completed',
        intent: intentAnalysis,
        optimizationResult: {
          problem: optimizationResult?.problem,
          solution: optimizationResult?.solution,
          enrichedData: optimizationResult?.enrichedData
        }
      };
    } else if (executionPath === 'hybrid') {
      solutionData = {
        status: 'hybrid_completed',
        intent: intentAnalysis,
        ragResult: {
          answer: ragResult?.answer,
          sources: ragResult?.sources
        },
        optimizationResult: {
          problem: optimizationResult?.problem,
          solution: optimizationResult?.solution,
          enrichedData: optimizationResult?.enrichedData
        }
      };
    }

    try {
      const explanation = await agnoExplainAgent.explainSolution(solutionData, sessionId);
      return explanation;
    } catch (error) {
      console.error('Explain Agent error:', error);
      // Return a fallback explanation
      return {
        explanation: {
          summary: `Analysis completed via ${executionPath} path.`,
          keyDecisions: [],
          recommendations: [],
          insights: []
        }
      };
    }
  }
}

export const agentOrchestrator = new AgentOrchestrator(); 