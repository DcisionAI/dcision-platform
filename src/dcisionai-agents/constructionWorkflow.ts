// Construction Workflow Orchestrator
// Coordinates all DcisionAI agents using the real Agno backend

import { agnoDataAgent, EnrichedData } from './dataAgent/agnoDataAgent';
import { agnoIntentAgent, IntentResult } from './intentAgent/agnoIntentAgent';
import { agnoModelBuilderAgent, MCPConfig } from './modelBuilderAgent/agnoModelBuilderAgent';
import { agnoExplainAgent, Explanation } from './explainAgent/agnoExplainAgent';
import { agnoClient } from '../lib/agno-client';
import ConstructionMCPSolver, { ConstructionOptimizationProblem, ConstructionOptimizationResult } from '../mcp-solver/ConstructionMCPSolver';

// Import RAG functionality
import { queryVectors } from '../utils/RAG/pinecone';
import { embedChunks } from '../lib/RAG/embedding';
import { getLLMAnswer } from '../lib/RAG/llm';

export interface ConstructionWorkflowResult {
  sessionId: string;
  enrichedData?: EnrichedData;
  intent: IntentResult;
  mcpConfig?: MCPConfig;
  optimizationProblem?: ConstructionOptimizationProblem;
  optimizationResult?: ConstructionOptimizationResult;
  explanation: Explanation;
  // RAG-specific fields
  ragResult?: {
    answer: string;
    sources: any[];
    query: string;
  };
  metadata: {
    startTime: string;
    endTime: string;
    duration: number;
    modelProvider: string;
    modelName: string;
    agentIds: string[];
    solverUsed?: string;
    highsAvailable?: boolean;
    executionPath: 'rag' | 'optimization' | 'hybrid';
  };
}

export interface WorkflowOptions {
  modelProvider?: 'anthropic' | 'openai';
  modelName?: string;
  createSpecializedAgents?: boolean;
  sessionId?: string;
  enableLogging?: boolean;
  solverOptions?: {
    time_limit?: number;
    construction_heuristics?: boolean;
    safety_constraint_weight?: number;
    quality_constraint_weight?: number;
  };
  // RAG options
  ragOptions?: {
    topK?: number;
    indexName?: string;
  };
}

export class ConstructionWorkflowOrchestrator {
  private sessionId: string;
  private modelProvider: 'anthropic' | 'openai';
  private modelName: string;
  private agentIds: string[] = [];
  private enableLogging: boolean;
  private solverOptions: any;
  private solver: ConstructionMCPSolver;
  private ragOptions: any;

  constructor(options: WorkflowOptions = {}) {
    this.sessionId = options.sessionId || `construction_${Date.now()}`;
    this.modelProvider = options.modelProvider || 'anthropic';
    this.modelName = options.modelName || (this.modelProvider === 'anthropic' ? 'claude-3-sonnet-20240229' : 'gpt-4-turbo-preview');
    this.enableLogging = options.enableLogging || false;
    this.solverOptions = options.solverOptions || {};
    this.solver = new ConstructionMCPSolver();
    this.ragOptions = options.ragOptions || { topK: 5, indexName: 'dcisionai-construction-kb' };
  }

  private log(message: string, data?: any) {
    if (this.enableLogging) {
      console.log(`[ConstructionWorkflow] ${message}`, data || '');
    }
  }

  /**
   * Execute RAG query against knowledge base
   */
  private async executeRAGQuery(query: string): Promise<{ answer: string; sources: any[] }> {
    this.log('Executing RAG query', { query });
    
    try {
      // Generate embedding for the query
      const [embedding] = await embedChunks([query]);
      
      // Query the vector database
      const results = await queryVectors(this.ragOptions.indexName, embedding, this.ragOptions.topK);
      
      // Build context from retrieved documents
      const context = results.map((r: any, i: number) =>
        `Source ${i + 1} (${r.metadata?.sourceType || 'unknown'}):\n${r.metadata?.chunk || ''}`
      ).join('\n---\n');

      // Generate answer using LLM
      let llmAnswer = '';
      try {
        llmAnswer = await getLLMAnswer(query, context);
      } catch (err) {
        llmAnswer = '[LLM answer synthesis failed]';
      }

      return {
        answer: llmAnswer,
        sources: results
      };
    } catch (error: any) {
      this.log('RAG query failed', { error: error.message });
      throw new Error(`RAG query failed: ${error.message}`);
    }
  }

  /**
   * Execute the complete construction optimization workflow
   * @param customerData Raw customer data (optional for RAG-only queries)
   * @param userIntent User's natural language request
   * @returns Complete workflow result
   */
  async executeWorkflow(
    customerData: any,
    userIntent: string
  ): Promise<ConstructionWorkflowResult> {
    const startTime = new Date().toISOString();
    this.log('Starting construction workflow', { sessionId: this.sessionId, userIntent });

    try {
      // Step 1: Create specialized agents if requested
      if (this.enableLogging) {
        this.log('Creating specialized agents...');
        const dataAgentId = await agnoDataAgent.createSpecializedAgent(this.modelProvider, this.modelName);
        const intentAgentId = await agnoIntentAgent.createSpecializedAgent(this.modelProvider, this.modelName);
        const modelBuilderAgentId = await agnoModelBuilderAgent.createSpecializedAgent(this.modelProvider, this.modelName);
        const explainAgentId = await agnoExplainAgent.createSpecializedAgent(this.modelProvider, this.modelName);
        
        this.agentIds = [dataAgentId, intentAgentId, modelBuilderAgentId, explainAgentId];
        this.log('Specialized agents created', { agentIds: this.agentIds });
      }

      // Step 2: Intent Interpretation (determines execution path)
      this.log('Step 1: Intent interpretation');
      const intent = await agnoIntentAgent.interpretIntent(
        userIntent,
        this.sessionId,
        this.modelProvider,
        this.modelName
      );
      this.log('Intent interpretation completed', { 
        decisionType: intent.decisionType,
        executionPath: intent.executionPath,
        confidence: intent.confidence 
      });

      let enrichedData: EnrichedData | undefined;
      let mcpConfig: MCPConfig | undefined;
      let optimizationProblem: ConstructionOptimizationProblem | undefined;
      let optimizationResult: ConstructionOptimizationResult | undefined;
      let ragResult: { answer: string; sources: any[]; query: string } | undefined;

      // Step 3: Execute based on determined path
      if (intent.executionPath === 'rag' || intent.executionPath === 'hybrid') {
        // Execute RAG query
        this.log('Step 2a: Executing RAG query');
        const ragQuery = intent.ragQuery || userIntent;
        const ragResponse = await this.executeRAGQuery(ragQuery);
        ragResult = {
          answer: ragResponse.answer,
          sources: ragResponse.sources,
          query: ragQuery
        };
        this.log('RAG query completed', { sourcesCount: ragResponse.sources.length });
      }

      if (intent.executionPath === 'optimization' || intent.executionPath === 'hybrid') {
        // Execute optimization workflow
        if (!customerData) {
          throw new Error('Customer data is required for optimization workflows');
        }

        // Step 2b/3b: Data Enrichment (for optimization)
        this.log('Step 2b: Data enrichment');
        enrichedData = await agnoDataAgent.enrichData(
          customerData,
          this.sessionId,
          this.modelProvider,
          this.modelName
        );
        this.log('Data enrichment completed', { constraintsCount: enrichedData.constraints.length });

        // Step 3b/4b: Model Building
        this.log('Step 3b: Model building');
        const modelResult = await agnoModelBuilderAgent.buildModel(
          enrichedData.enrichedData,
          intent,
          this.sessionId,
          this.modelProvider,
          this.modelName
        );
        mcpConfig = modelResult.mcpConfig;
        this.log('Model building completed', { 
          variablesCount: mcpConfig.variables.length,
          constraintsCount: mcpConfig.constraints.length 
        });

        // Step 4b/5b: Convert to Construction Optimization Problem
        this.log('Step 4b: Converting to construction optimization problem');
        optimizationProblem = this.convertMCPConfigToConstructionProblem(
          mcpConfig,
          enrichedData,
          intent
        );
        this.log('Problem conversion completed', { 
          problemType: optimizationProblem.problem_type,
          variablesCount: optimizationProblem.variables.length 
        });

        // Step 5b/6b: Solve Optimization Problem
        this.log('Step 5b: Solving optimization problem');
        optimizationResult = await this.solver.solveConstructionOptimization(
          optimizationProblem,
          this.solverOptions,
          { sessionId: this.sessionId, intent: intent }
        );
        this.log('Optimization completed', { 
          status: optimizationResult.status,
          objectiveValue: optimizationResult.objective_value,
          solverUsed: optimizationResult.metadata.solver_used
        });
      }

      // Step 6: Solution Explanation
      this.log('Step 6: Solution explanation');
      const explanation = await agnoExplainAgent.explainSolution(
        {
          enrichedData: enrichedData?.enrichedData,
          intent: intent,
          mcpConfig: mcpConfig,
          optimizationProblem: optimizationProblem,
          optimizationResult: optimizationResult,
          ragResult: ragResult,
          status: intent.executionPath === 'rag' ? 'rag_completed' : 
                 intent.executionPath === 'optimization' ? 'optimization_completed' : 'hybrid_completed'
        },
        this.sessionId,
        this.modelProvider,
        this.modelName
      );
      this.log('Solution explanation completed');

      const endTime = new Date().toISOString();
      const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

      const result: ConstructionWorkflowResult = {
        sessionId: this.sessionId,
        enrichedData,
        intent,
        mcpConfig,
        optimizationProblem,
        optimizationResult,
        explanation: explanation.explanation,
        ragResult,
        metadata: {
          startTime,
          endTime,
          duration,
          modelProvider: this.modelProvider,
          modelName: this.modelName,
          agentIds: this.agentIds,
          solverUsed: optimizationResult?.metadata.solver_used,
          highsAvailable: this.solver.isHighsAvailable(),
          executionPath: intent.executionPath
        }
      };

      this.log('Workflow completed successfully', { duration, executionPath: intent.executionPath });
      return result;

    } catch (error: any) {
      this.log('Workflow failed', { error: error.message });
      throw new Error(`Construction workflow failed: ${error.message}`);
    }
  }

  /**
   * Convert MCP config to construction optimization problem
   */
  private convertMCPConfigToConstructionProblem(
    mcpConfig: MCPConfig,
    enrichedData: EnrichedData,
    intent: IntentResult
  ): ConstructionOptimizationProblem {
    // Map decision type to problem type
    const problemTypeMap: Record<string, 'scheduling' | 'resource_allocation' | 'cost_optimization' | 'risk_management' | 'supply_chain'> = {
      'scheduling': 'scheduling',
      'resource-allocation': 'resource_allocation',
      'cost-optimization': 'cost_optimization',
      'risk-management': 'risk_management',
      'supply-chain': 'supply_chain'
    };

    const problemType = problemTypeMap[intent.decisionType] || 'resource_allocation';

    // Convert variables
    const variables = mcpConfig.variables.map((variable, index) => ({
      name: variable.name || `var_${index + 1}`,
      type: variable.type as 'cont' | 'int' | 'bin',
      lb: variable.bounds?.[0],
      ub: variable.bounds?.[1],
      description: variable.description || variable.name || `Variable ${index + 1}`,
      category: this.inferVariableCategory(variable.name, enrichedData)
    }));

    // Convert constraints
    const constraints = {
      dense: mcpConfig.constraints.map(constraint => {
        // This is a simplified conversion - in practice, you'd parse the expression
        // For now, we'll create a simple constraint matrix
        const row = new Array(variables.length).fill(0);
        // Placeholder: assume first variable has coefficient 1
        if (variables.length > 0) row[0] = 1;
        return row;
      }),
      sense: mcpConfig.constraints.map(() => '<=' as const), // Default to <=
      rhs: mcpConfig.constraints.map(() => 100), // Default RHS
      categories: mcpConfig.constraints.map(() => 'capacity' as const)
    };

    // Convert objective
    const objective = {
      linear: mcpConfig.objective.expression.split('+').map(() => 1) // Simplified conversion
    };

    return {
      problem_type: problemType,
      sense: mcpConfig.objective.type,
      objective,
      variables,
      constraints,
      metadata: {
        session_id: this.sessionId,
        created_by: 'construction_workflow',
        complexity_level: variables.length > 10 ? 'complex' : variables.length > 5 ? 'medium' : 'simple'
      }
    };
  }

  /**
   * Infer variable category based on name and enriched data
   */
  private inferVariableCategory(variableName: string, enrichedData: EnrichedData): 'worker' | 'equipment' | 'material' | 'time' | 'cost' | 'quality' | 'project' | 'supplier' | 'risk' {
    const name = variableName.toLowerCase();
    
    if (name.includes('worker') || name.includes('labor') || name.includes('crew')) return 'worker';
    if (name.includes('equipment') || name.includes('machine') || name.includes('tool')) return 'equipment';
    if (name.includes('material') || name.includes('supply') || name.includes('resource')) return 'material';
    if (name.includes('time') || name.includes('hour') || name.includes('duration')) return 'time';
    if (name.includes('cost') || name.includes('price') || name.includes('budget')) return 'cost';
    if (name.includes('quality') || name.includes('standard')) return 'quality';
    if (name.includes('project') || name.includes('task')) return 'project';
    if (name.includes('supplier') || name.includes('vendor')) return 'supplier';
    if (name.includes('risk') || name.includes('safety')) return 'risk';
    
    return 'material'; // Default category
  }

  /**
   * Execute a specific step of the workflow
   * @param step The step to execute
   * @param data Required data for the step
   * @returns Step result
   */
  async executeStep(
    step: 'data_enrichment' | 'intent_interpretation' | 'model_building' | 'optimization' | 'explanation',
    data: any
  ) {
    this.log(`Executing step: ${step}`);

    switch (step) {
      case 'data_enrichment':
        return await agnoDataAgent.enrichData(
          data.customerData,
          this.sessionId,
          this.modelProvider,
          this.modelName
        );

      case 'intent_interpretation':
        return await agnoIntentAgent.interpretIntent(
          data.userIntent,
          this.sessionId,
          this.modelProvider,
          this.modelName
        );

      case 'model_building':
        return await agnoModelBuilderAgent.buildModel(
          data.enrichedData,
          data.intent,
          this.sessionId,
          this.modelProvider,
          this.modelName
        );

      case 'optimization':
        const optimizationProblem = this.convertMCPConfigToConstructionProblem(
          data.mcpConfig,
          data.enrichedData,
          data.intent
        );
        return await this.solver.solveConstructionOptimization(
          optimizationProblem,
          this.solverOptions,
          { sessionId: this.sessionId }
        );

      case 'explanation':
        return await agnoExplainAgent.explainSolution(
          data.solution,
          this.sessionId,
          this.modelProvider,
          this.modelName
        );

      default:
        throw new Error(`Unknown step: ${step}`);
    }
  }

  /**
   * Get workflow status and metadata
   * @returns Workflow status
   */
  getStatus() {
    return {
      sessionId: this.sessionId,
      modelProvider: this.modelProvider,
      modelName: this.modelName,
      agentIds: this.agentIds,
      enableLogging: this.enableLogging,
      solverOptions: this.solverOptions,
      highsAvailable: this.solver.isHighsAvailable()
    };
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    this.log('Cleaning up workflow resources');
    // Clean up specialized agents if they were created
    for (const agentId of this.agentIds) {
      try {
        await agnoClient.deleteAgent(agentId);
      } catch (error: any) {
        this.log('Failed to delete agent', { agentId, error: error.message });
      }
    }
    this.agentIds = [];
  }
}

// Convenience function for quick workflow execution
export async function executeConstructionWorkflow(
  customerData: any,
  userIntent: string,
  options: WorkflowOptions = {}
): Promise<ConstructionWorkflowResult> {
  const orchestrator = new ConstructionWorkflowOrchestrator(options);
  try {
    return await orchestrator.executeWorkflow(customerData, userIntent);
  } finally {
    await orchestrator.cleanup();
  }
} 