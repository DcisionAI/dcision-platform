import { BaseAgent, AgentConfig, AgentContext } from './BaseAgent';
import { EVENT_TYPES, AGENT_TYPES } from './EventTypes';
import { getEmbedding } from '../../lib/openai-embedding';

type Message = { type: string; payload: any; correlationId?: string; from?: string; to?: string };

interface RAGResult {
  id: string;
  score: number;
  metadata: any;
  content: string;
}

export class RAGAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      name: 'RAGAgent',
      type: AGENT_TYPES.RAG_AGENT,
      capabilities: ['knowledge_retrieval', 'semantic_search', 'context_enhancement'],
      maxRetries: 3,
      timeout: 30000
    };
    super(config);
  }

  protected subscribeToEvents(): void {
    // Subscribe to knowledge retrieval requests
    this.subscribe(EVENT_TYPES.KNOWLEDGE_RETRIEVAL_REQUESTED, (event: Message) => {
      this.processEvent(event);
    });

    // Subscribe to intent identified events where knowledge retrieval is needed
    this.subscribe(EVENT_TYPES.INTENT_IDENTIFIED, (event: Message) => {
      if (event.payload?.requiresKnowledgeRetrieval) {
        this.processEvent(event);
      }
    });
  }

  protected async handleEvent(event: Message): Promise<void> {
    const correlationId = event.correlationId;
    if (!correlationId) {
      console.warn('⚠️ RAGAgent: No correlationId provided');
      return;
    }

    console.log(`🔍 RAGAgent processing event: ${event.type} for session: ${correlationId}`);

    try {
      let query: string;
      let context: any = {};

      // Handle different event types
      if (event.type === EVENT_TYPES.KNOWLEDGE_RETRIEVAL_REQUESTED) {
        query = event.payload.query;
        context = event.payload.context || {};
      } else if (event.type === EVENT_TYPES.INTENT_IDENTIFIED) {
        query = event.payload.originalQuery;
        context = {
          intent: event.payload.primaryIntent,
          decisionType: event.payload.decisionType,
          keywords: event.payload.keywords
        };
      } else {
        throw new Error(`Unsupported event type: ${event.type}`);
      }

      // Set context for this processing session
      const agentContext: AgentContext = {
        sessionId: correlationId,
        correlationId,
        userQuery: query,
        customerData: context
      };
      this.setContext(agentContext);

      // Update progress
      this.updateProgress(correlationId, 'started', 'Retrieving knowledge from database');

      // Perform RAG retrieval
      const ragResult = await this.executeWithRetry(
        () => this.performRAGRetrieval(query, context),
        agentContext
      );

      console.log(`✅ RAG retrieval completed for session: ${correlationId}`);

      // Publish RAG response ready event
      this.publish({
        type: EVENT_TYPES.RAG_RESPONSE_READY,
        payload: {
          query,
          results: ragResult.results,
          sources: ragResult.sources,
          context,
          metadata: {
            retrievalTime: ragResult.retrievalTime,
            resultCount: ragResult.results.length,
            confidence: ragResult.confidence
          }
        },
        correlationId
      });

      // Update progress
      this.updateProgress(correlationId, 'completed', `Retrieved ${ragResult.results.length} relevant documents`);

      // Clear context after processing
      this.clearContext();

    } catch (error) {
      console.error(`❌ RAGAgent failed to process event:`, error);
      
      this.publish({
        type: EVENT_TYPES.KNOWLEDGE_RETRIEVAL_ERROR,
        payload: {
          error: {
            code: 'RAG_RETRIEVAL_FAILED',
            message: error instanceof Error ? error.message : String(error),
            context: { eventType: event.type, agent: this.config.name }
          },
          query: event.payload?.query || event.payload?.originalQuery,
          recoverable: true
        },
        correlationId
      });

      // Clear context on error
      this.clearContext();
    }
  }

  private async performRAGRetrieval(query: string, context: any): Promise<{
    results: RAGResult[];
    sources: string[];
    retrievalTime: number;
    confidence: number;
  }> {
    const startTime = Date.now();

    try {
      // Get embeddings for the query
      const queryEmbedding = await getEmbedding(query);
      
      // For now, simulate RAG retrieval since we don't have the full pinecone setup
      // In a real implementation, this would query the construction index
      console.log(`🔍 Simulating RAG retrieval for query: ${query}`);
      
      // Simulate results
      const results: RAGResult[] = [
        {
          id: 'simulated-1',
          score: 0.85,
          metadata: { source: 'construction-standards', content: 'Simulated construction knowledge content' },
          content: 'This is a simulated response from the knowledge base about construction standards and best practices.'
        }
      ];

      const sources: string[] = results.map((result: RAGResult) => result.metadata?.source || 'unknown');

      const retrievalTime = Date.now() - startTime;
      const confidence = results.length > 0 ? Math.max(...results.map((r: RAGResult) => r.score || 0)) : 0;

      console.log(`🔍 RAG retrieval: ${results.length} results found in ${retrievalTime}ms`);

      return {
        results,
        sources,
        retrievalTime,
        confidence
      };

    } catch (error) {
      console.error('❌ RAG retrieval failed:', error);
      
      // Fallback: return empty results with error context
      return {
        results: [],
        sources: [],
        retrievalTime: Date.now() - startTime,
        confidence: 0
      };
    }
  }

  public canHandle(eventType: string): boolean {
    return eventType === EVENT_TYPES.KNOWLEDGE_RETRIEVAL_REQUESTED || 
           eventType === EVENT_TYPES.INTENT_IDENTIFIED;
  }
}

// Export singleton instance
export const ragAgent = new RAGAgent(); 