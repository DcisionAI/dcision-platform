import { agnoIntentAgent } from './dcisionai-agents/intentAgent/agnoIntentAgent';
import { agnoDataAgent } from './dcisionai-agents/dataAgent/agnoDataAgent';
import { agnoModelBuilderAgent } from './dcisionai-agents/modelBuilderAgent/agnoModelBuilderAgent';
import { agnoExplainAgent } from './dcisionai-agents/explainAgent/agnoExplainAgent';
import { ConstructionMCPSolver } from './ConstructionMCPSolver';
import { constructionIndex, getEmbeddings } from '../../../lib/pinecone';
import OpenAI from 'openai';
import { generateMermaidFromMCP } from '../../../utils/mermaid.ts';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface OrchestrationResult {
  sessionId: string;
  executionPath: 'rag' | 'optimization' | 'hybrid';
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
    const startTime = new Date().toISOString();
    const timestamps: Record<string, string> = {};

    try {
      // Step 1: Intent Analysis
      timestamps.intentStart = new Date().toISOString();
      onProgress?.({
        step: 'intent',
        status: 'start',
        message: 'Analyzing user intent...'
      });

      const intentAnalysis = await agnoIntentAgent.analyzeIntent(userInput, sessionId);
      
      // Determine execution path
      let executionPath: 'rag' | 'optimization' | 'hybrid';
      switch (intentAnalysis.primaryIntent) {
        case 'knowledge_retrieval':
          executionPath = 'rag';
          break;
        case 'optimization':
          executionPath = 'optimization';
          break;
        case 'hybrid_analysis':
          executionPath = 'hybrid';
          break;
        default:
          executionPath = 'optimization';
      }

      onProgress?.({
        step: 'intent',
        status: 'complete',
        message: `Intent analysis complete. Execution path: ${executionPath}`,
        data: intentAnalysis
      });
      timestamps.intentEnd = new Date().toISOString();

      // Step 2: Execute based on path
      let ragResult: any = null;
      let optimizationResult: any = null;

      if (executionPath === 'rag' || executionPath === 'hybrid') {
        // RAG Processing
        timestamps.ragStart = new Date().toISOString();
        onProgress?.({
          step: 'rag',
          status: 'start',
          message: 'Searching knowledge base...'
        });

        ragResult = await this.executeRAG(userInput, intentAnalysis);
        
        onProgress?.({
          step: 'rag',
          status: 'complete',
          message: 'Knowledge base search complete',
          data: ragResult
        });
        timestamps.ragEnd = new Date().toISOString();
      }

      if (executionPath === 'optimization' || executionPath === 'hybrid') {
        // Optimization Processing
        timestamps.optimizationStart = new Date().toISOString();
        onProgress?.({
          step: 'optimization',
          status: 'start',
          message: 'Starting optimization workflow...'
        });

        optimizationResult = await this.executeOptimization(
          userInput, 
          customerData, 
          intentAnalysis, 
          ragResult,
          sessionId,
          onProgress
        );

        onProgress?.({
          step: 'optimization',
          status: 'complete',
          message: 'Optimization workflow complete',
          data: optimizationResult
        });
        timestamps.optimizationEnd = new Date().toISOString();
      }

      // Step 3: Generate Explanation
      timestamps.explanationStart = new Date().toISOString();
      onProgress?.({
        step: 'explanation',
        status: 'start',
        message: 'Generating explanation...'
      });

      const explanation = await this.generateExplanation(
        executionPath,
        intentAnalysis,
        ragResult,
        optimizationResult,
        sessionId
      );

      onProgress?.({
        step: 'explanation',
        status: 'complete',
        message: 'Explanation generated',
        data: explanation
      });
      timestamps.explanationEnd = new Date().toISOString();

      // The explanation from the agent is already wrapped in an "explanation" object.
      // We need to destructure it to avoid double-wrapping.
      const { explanation: explanationContent } = explanation;

      const endTime = new Date().toISOString();

      // Attach diagram to the final result
      if (optimizationResult?.mermaidDiagram) {
        optimizationResult.mermaidDiagram = optimizationResult.mermaidDiagram;
      }

      return {
        sessionId,
        executionPath,
        intentAnalysis,
        ragResult,
        optimizationResult,
        explanation: explanationContent, // Use the destructured content
        mermaidDiagram: optimizationResult?.mermaidDiagram,
        status: 'success',
        timestamps: {
          start: startTime,
          end: endTime,
          steps: timestamps
        }
      };

    } catch (error: any) {
      const endTime = new Date().toISOString();
      
      onProgress?.({
        step: 'error',
        status: 'error',
        message: error.message,
        error
      });

      return {
        sessionId,
        executionPath: 'rag' as any, // fallback
        intentAnalysis: null,
        status: 'error',
        error: {
          code: 'ORCHESTRATION_ERROR',
          message: error.message,
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

    // Use the enrichedData from the previous step
    const modelResult = await agnoModelBuilderAgent.buildModel(
      enrichedData,
      intentAnalysis,
      sessionId
    );

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