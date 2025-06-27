import { BaseAgent, AgentConfig, AgentContext } from './BaseAgent';
import { EVENT_TYPES, AGENT_TYPES } from './EventTypes';

type Message = { type: string; payload: any; correlationId?: string; from?: string; to?: string };

export class ExplainAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      name: 'ExplainAgent',
      type: AGENT_TYPES.EXPLAIN_AGENT,
      capabilities: ['explanation_generation', 'content_synthesis', 'context_enhancement'],
      maxRetries: 2,
      timeout: 15000
    };
    super(config);
  }

  protected subscribeToEvents(): void {
    // Subscribe to RAG response events
    this.subscribe(EVENT_TYPES.RAG_RESPONSE_READY, (event: Message) => {
      this.processEvent(event);
    });

    // Subscribe to solution found events for optimization explanations
    this.subscribe(EVENT_TYPES.SOLUTION_FOUND, (event: Message) => {
      this.processEvent(event);
    });
  }

  protected async handleEvent(event: Message): Promise<void> {
    const correlationId = event.correlationId;
    if (!correlationId) {
      console.warn('⚠️ ExplainAgent: No correlationId provided');
      return;
    }

    console.log(`💡 ExplainAgent processing event: ${event.type} for session: ${correlationId}`);

    try {
      let content: string;
      let context: any = {};

      // Handle different event types
      if (event.type === EVENT_TYPES.RAG_RESPONSE_READY) {
        content = this.generateKnowledgeExplanation(event.payload);
        context = {
          query: event.payload.query,
          sources: event.payload.sources,
          resultCount: event.payload.results?.length || 0
        };
      } else if (event.type === EVENT_TYPES.SOLUTION_FOUND) {
        content = this.generateOptimizationExplanation(event.payload);
        context = {
          problemType: event.payload.problemType,
          metrics: event.payload.metrics
        };
      } else {
        throw new Error(`Unsupported event type: ${event.type}`);
      }

      // Set context for this processing session
      const agentContext: AgentContext = {
        sessionId: correlationId,
        correlationId,
        userQuery: event.payload.query || 'Unknown query',
        customerData: context
      };
      this.setContext(agentContext);

      // Update progress
      this.updateProgress(correlationId, 'started', 'Generating explanation');

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));

      // Publish explanation ready event
      this.publish({
        type: EVENT_TYPES.EXPLANATION_READY,
        payload: {
          content,
          format: 'text',
          context,
          metadata: {
            explanationType: event.type === EVENT_TYPES.RAG_RESPONSE_READY ? 'knowledge' : 'optimization',
            confidence: 0.85
          }
        },
        correlationId
      });

      // Update progress
      this.updateProgress(correlationId, 'completed', 'Explanation generated');

      // Clear context after processing
      this.clearContext();

    } catch (error) {
      console.error(`❌ ExplainAgent failed to process event:`, error);
      
      this.publish({
        type: EVENT_TYPES.EXPLANATION_ERROR,
        payload: {
          error: {
            code: 'EXPLANATION_GENERATION_FAILED',
            message: error instanceof Error ? error.message : String(error),
            context: { eventType: event.type, agent: this.config.name }
          },
          recoverable: true
        },
        correlationId
      });

      // Clear context on error
      this.clearContext();
    }
  }

  private generateKnowledgeExplanation(ragPayload: any): string {
    const query = ragPayload.query;
    const results = ragPayload.results || [];
    const sources = ragPayload.sources || [];

    if (results.length === 0) {
      return `I couldn't find specific information about "${query}" in our knowledge base. This might be because the information is not yet available in our database, or the query needs to be rephrased.`;
    }

    const mainContent = results[0]?.content || 'Information retrieved from knowledge base';
    
    let explanation = `Based on the information I found, here's what I can tell you about "${query}":\n\n`;
    explanation += `${mainContent}\n\n`;
    
    if (sources.length > 0) {
      explanation += `**Sources:** ${sources.join(', ')}\n\n`;
    }
    
    explanation += `This information is based on construction industry standards and best practices. For the most current and specific requirements, I recommend consulting the official OSHA documentation or consulting with a qualified safety professional.`;

    return explanation;
  }

  private generateOptimizationExplanation(optimizationPayload: any): string {
    const problemType = optimizationPayload.problemType || 'optimization problem';
    const solution = optimizationPayload.solution;
    const metrics = optimizationPayload.metrics;

    let explanation = `I've analyzed your ${problemType} and found an optimal solution.\n\n`;
    
    if (solution) {
      explanation += `**Solution:** ${JSON.stringify(solution, null, 2)}\n\n`;
    }
    
    if (metrics) {
      explanation += `**Performance Metrics:**\n`;
      Object.entries(metrics).forEach(([key, value]) => {
        explanation += `- ${key}: ${value}\n`;
      });
      explanation += `\n`;
    }
    
    explanation += `This solution has been optimized using mathematical programming techniques to ensure the best possible outcome given your constraints and objectives.`;

    return explanation;
  }

  public canHandle(eventType: string): boolean {
    return eventType === EVENT_TYPES.RAG_RESPONSE_READY || 
           eventType === EVENT_TYPES.SOLUTION_FOUND;
  }
}

// Export singleton instance
export const explainAgent = new ExplainAgent(); 