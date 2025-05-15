import { MCPAgent, AgentRunContext, AgentRunResult, AgentType } from './types';
import { ProtocolStep, MCP } from '../types/core';
import { StepAction } from './types';
// Add Pinecone and embedding utilities
import { getPineconeIndex } from '../../../lib/pinecone';
import { getEmbedding } from '../../../lib/openai-embedding';

/**
 * Agent to extract decision variables, constraints, and objective from a business problem.
 */
export class ModelDefinitionAgent implements MCPAgent {
  name = 'Model Definition Agent';
  type: AgentType = 'model_definition';
  supportedActions: StepAction[] = ['define_model'];

  async run(
    step: ProtocolStep,
    mcp: MCP,
    context?: AgentRunContext
  ): Promise<AgentRunResult> {
    if (step.action !== 'define_model') {
      throw new Error(`Unsupported action: ${step.action}`);
    }
    // Extract the problem description and problemType from MCP metadata
    const metadata = mcp.context.dataset?.metadata;
    const description = metadata && typeof metadata === 'object' && 'userInput' in metadata
      ? String(metadata.userInput)
      : '';
    const problemType = mcp.context.problemType || (metadata && metadata.problemType);
    if (!context?.llm) {
      throw new Error('LLM service is required for model definition');
    }
    // Retrieve top 3 relevant samples from Pinecone
    const retrievedExamples = await this.retrieveRelevantExamples(description, problemType, 3);
    console.log('[ModelDefinitionAgent] RAG retrieved examples:', JSON.stringify(retrievedExamples, null, 2));
    // Build the hybrid prompt
    const prompt = this.buildHybridPrompt(description, problemType, retrievedExamples, mcp);
    console.log('[ModelDefinitionAgent] Hybrid LLM prompt:', prompt);
    // Call the LLM with the hybrid prompt
    const result = await context.llm.interpretModelDefinition(prompt);
    console.log('[ModelDefinitionAgent] LLM raw output:', JSON.stringify(result, null, 2));
    // Fallback: ensure externalDataSources is always present and non-empty
    if (!Array.isArray(result.externalDataSources) || result.externalDataSources.length === 0) {
      result.externalDataSources = [
        { source: 'TrafficPredictions', description: 'Predicted traffic for each route or delivery.', valueAdd: 'Improves delivery time estimates.' },
        { source: 'WeatherForecasts', description: 'Weather forecasts for each delivery location and time.', valueAdd: 'Improves route planning.' }
      ];
    }
    // Fallback: ensure protocolSteps is always present and non-empty
    if (!Array.isArray(result.protocolSteps) || result.protocolSteps.length === 0) {
      result.protocolSteps = [
        { id: 'solve_step', action: 'solve_model', description: 'Solve the optimization model', required: true }
      ];
    }
    // Fallback: ensure dataset is present
    if (!result.dataset) {
      result.dataset = {};
    }
    return {
      output: result,
      thoughtProcess: `Used RAG with ${retrievedExamples.length} examples for hybrid prompt.`
    };
  }

  // Retrieve top N relevant samples from Pinecone
  private async retrieveRelevantExamples(description: string, problemType: string, topN: number) {
    const pineconeIndex = getPineconeIndex();
    const embedding = await getEmbedding(description);
    // Query Pinecone
    const queryResult = await pineconeIndex.query({
      topK: topN,
      vector: embedding,
      includeMetadata: true,
      filter: problemType ? { problemType } : undefined
    });
    // Return the matched examples (content + metadata)
    return (queryResult.matches || []).map((match: any) => match.metadata);
  }

  // Build the hybrid prompt for the LLM
  private buildHybridPrompt(description: string, problemType: string, examples: any[], mcp: MCP): string {
    // Example MCP config template (can be improved or imported)
    const sampleMcp = `{
  "sessionId": "example-session-001",
  "version": "1.0",
  "created": "2025-05-10T12:00:00Z",
  "lastModified": "2025-05-10T12:00:00Z",
  "status": "pending",
  "model": {
    "variables": [ ... ],
    "constraints": [ ... ],
    "objective": { ... }
  },
  "context": {
    "problemType": "${problemType || 'unknown'}",
    "industry": "test",
    "environment": { ... },
    "dataset": { ... }
  },
  "protocol": {
    "steps": [ { "action": "solve_model", "required": true } ],
    "allowPartialSolutions": false,
    "explainabilityEnabled": false,
    "humanInTheLoop": { "required": false }
  }
}`;
    // Build examples section
    const examplesSection = examples.length > 0
      ? examples.map((ex, i) => `Example ${i + 1} (type: ${ex.problemType || 'unknown'}):\n${ex.content || ex.code || ex.text || ''}`).join('\n\n')
      : 'No relevant examples found.';
    // Compose the prompt
    return `You are a world-class operations research scientist. Given the following business scenario and enriched dataset, generate a complete MCP configuration in the following JSON format:\n\n${sampleMcp}\n\nHere are some relevant optimization model examples:\n\n${examplesSection}\n\nBusiness Scenario:\n${description}\n\nEnriched Dataset:\n${JSON.stringify(mcp.context.dataset, null, 2)}\n\nOutput only the JSON MCP config.`;
  }
}