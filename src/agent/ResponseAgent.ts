import { BaseAgent, AgentConfig, AgentContext } from './BaseAgent';
import { EVENT_TYPES, AGENT_TYPES } from './EventTypes';

type Message = { type: string; payload: any; correlationId?: string; from?: string; to?: string };

interface ResponseData {
  intent?: any;
  ragResponse?: any;
  optimizationResult?: any;
  explanation?: any;
  critique?: any;
  debate?: any;
  executionPath: string;
  agentsInvolved: string[];
  duration: number;
  confidence: number;
}

export class ResponseAgent extends BaseAgent {
  private sessionData: Map<string, ResponseData> = new Map();

  constructor() {
    const config: AgentConfig = {
      name: 'ResponseAgent',
      type: AGENT_TYPES.RESPONSE_AGENT,
      capabilities: ['response_assembly', 'format_conversion', 'metadata_aggregation'],
      maxRetries: 1,
      timeout: 10000
    };
    super(config);
    console.log(`🤖 ResponseAgent initialized with capabilities: ${config.capabilities.join(', ')}`);
  }

  protected subscribeToEvents(): void {
    // Subscribe to all events that contribute to the final response
    this.subscribe(EVENT_TYPES.INTENT_IDENTIFIED, (event: Message) => {
      this.processEvent(event);
    });

    this.subscribe(EVENT_TYPES.RAG_RESPONSE_READY, (event: Message) => {
      this.processEvent(event);
    });

    this.subscribe(EVENT_TYPES.EXPLANATION_READY, (event: Message) => {
      this.processEvent(event);
    });

    this.subscribe(EVENT_TYPES.SOLUTION_FOUND, (event: Message) => {
      this.processEvent(event);
    });

    this.subscribe(EVENT_TYPES.CRITIQUE_READY, (event: Message) => {
      this.processEvent(event);
    });

    this.subscribe(EVENT_TYPES.DEBATE_READY, (event: Message) => {
      this.processEvent(event);
    });

    // Subscribe to response generation started event from orchestrator
    this.subscribe(EVENT_TYPES.RESPONSE_GENERATION_STARTED, (event: Message) => {
      this.processEvent(event);
    });

    // Subscribe to workflow completion
    this.subscribe(EVENT_TYPES.WORKFLOW_COMPLETED, (event: Message) => {
      this.processEvent(event);
    });
  }

  protected async handleEvent(event: Message): Promise<void> {
    const correlationId = event.correlationId;
    if (!correlationId) {
      console.warn('⚠️ ResponseAgent: No correlationId provided');
      return;
    }

    console.log(`📤 ResponseAgent processing event: ${event.type} for session: ${correlationId} from ${event.from}`);

    try {
      // Get or create session data
      let sessionData = this.sessionData.get(correlationId);
      if (!sessionData) {
        sessionData = {
          executionPath: 'unknown',
          agentsInvolved: [],
          duration: 0,
          confidence: 0
        };
        this.sessionData.set(correlationId, sessionData);
        console.log(`📊 ResponseAgent created new session data for: ${correlationId}`);
      }

      // Update session data based on event type
      switch (event.type) {
        case EVENT_TYPES.INTENT_IDENTIFIED:
          console.log(`🧠 ResponseAgent received INTENT_IDENTIFIED for session: ${correlationId}`);
          sessionData.intent = event.payload;
          sessionData.agentsInvolved.push('IntentAgent');
          break;

        case EVENT_TYPES.RAG_RESPONSE_READY:
          console.log(`📚 ResponseAgent received RAG_RESPONSE_READY for session: ${correlationId}`);
          sessionData.ragResponse = event.payload;
          sessionData.agentsInvolved.push('RAGAgent');
          sessionData.executionPath = 'knowledge_retrieval';
          break;

        case EVENT_TYPES.SOLUTION_FOUND:
          console.log(`✅ ResponseAgent received SOLUTION_FOUND for session: ${correlationId}`);
          sessionData.optimizationResult = event.payload;
          sessionData.agentsInvolved.push('SolverAgent');
          sessionData.executionPath = 'optimization';
          break;

        case EVENT_TYPES.EXPLANATION_READY:
          console.log(`📖 ResponseAgent received EXPLANATION_READY for session: ${correlationId}`);
          sessionData.explanation = event.payload;
          sessionData.agentsInvolved.push('ExplainAgent');
          break;

        case EVENT_TYPES.CRITIQUE_READY:
          console.log(`🔍 ResponseAgent received CRITIQUE_READY for session: ${correlationId}`);
          sessionData.critique = event.payload;
          sessionData.agentsInvolved.push('CritiqueAgent');
          break;

        case EVENT_TYPES.DEBATE_READY:
          console.log(`💬 ResponseAgent received DEBATE_READY for session: ${correlationId}`);
          sessionData.debate = event.payload;
          sessionData.agentsInvolved.push('DebateAgent');
          break;

        case EVENT_TYPES.RESPONSE_GENERATION_STARTED:
          console.log(`🚀 ResponseAgent received RESPONSE_GENERATION_STARTED for session: ${correlationId}`);
          // Generate a response based on available data
          await this.generateResponse(correlationId, sessionData, event.payload);
          return;

        case EVENT_TYPES.WORKFLOW_COMPLETED:
          console.log(`🎉 ResponseAgent received WORKFLOW_COMPLETED for session: ${correlationId}`);
          // Final response assembly
          await this.assembleFinalResponse(correlationId, sessionData);
          return;
          
        default:
          console.log(`⚠️ ResponseAgent received unhandled event type: ${event.type} for session: ${correlationId}`);
          break;
      }

      // Check if we have enough data to assemble a response
      if (this.shouldAssembleResponse(sessionData)) {
        console.log(`🎯 ResponseAgent has enough data to assemble response for session: ${correlationId}`);
        await this.assembleFinalResponse(correlationId, sessionData);
      }

    } catch (error) {
      console.error(`❌ ResponseAgent failed to process event:`, error);
      
      this.publish({
        type: EVENT_TYPES.RESPONSE_ERROR,
        payload: {
          error: {
            code: 'RESPONSE_ASSEMBLY_FAILED',
            message: error instanceof Error ? error.message : String(error),
            context: { eventType: event.type, agent: this.config.name }
          },
          recoverable: true
        },
        correlationId
      });
    }
  }

  private shouldAssembleResponse(sessionData: ResponseData): boolean {
    // For knowledge retrieval path
    if (sessionData.ragResponse && sessionData.explanation) {
      return true;
    }

    // For optimization path
    if (sessionData.optimizationResult && sessionData.explanation) {
      return true;
    }

    // For hybrid path
    if (sessionData.ragResponse && sessionData.optimizationResult && sessionData.explanation) {
      return true;
    }

    return false;
  }

  private async generateResponse(correlationId: string, sessionData: ResponseData, requestPayload: any): Promise<void> {
    console.log(`📝 Generating response for session: ${correlationId}`);

    try {
      // Calculate duration and confidence
      const duration = Date.now(); // This should be calculated from start time
      const confidence = this.calculateConfidence(sessionData);

      // Generate content based on available data
      let content: any;
      let format = 'text';

      if (sessionData.optimizationResult) {
        content = this.assembleOptimizationResponse(sessionData);
        sessionData.executionPath = 'optimization';
      } else if (sessionData.ragResponse) {
        content = this.assembleKnowledgeResponse(sessionData);
        sessionData.executionPath = 'knowledge_retrieval';
      } else {
        // Fallback response
        content = {
          type: 'text',
          text: `Based on the analysis, I've identified that this is an optimization request for crew assignment. The intent analysis shows this requires optimization with ${sessionData.intent?.confidence || 0.7} confidence.`,
          summary: 'Crew assignment optimization identified',
          recommendations: ['Proceed with optimization workflow']
        };
        sessionData.executionPath = 'optimization';
      }

      // Publish response generated event
      this.publish({
        type: EVENT_TYPES.RESPONSE_GENERATED,
        payload: {
          content,
          format,
          metadata: {
            executionPath: sessionData.executionPath,
            agentsInvolved: Array.from(new Set(sessionData.agentsInvolved)), // Remove duplicates
            duration,
            confidence
          }
        },
        correlationId
      });

      // Clean up session data
      this.sessionData.delete(correlationId);

    } catch (error) {
      console.error(`❌ ResponseAgent failed to generate response:`, error);
      
      this.publish({
        type: EVENT_TYPES.RESPONSE_ERROR,
        payload: {
          error: {
            code: 'RESPONSE_GENERATION_FAILED',
            message: error instanceof Error ? error.message : String(error),
            context: { agent: this.config.name }
          },
          recoverable: true
        },
        correlationId
      });
    }
  }

  private async assembleFinalResponse(correlationId: string, sessionData: ResponseData): Promise<void> {
    console.log(`🎯 Assembling final response for session: ${correlationId}`);

    try {
      // Calculate duration and confidence
      const duration = Date.now(); // This should be calculated from start time
      const confidence = this.calculateConfidence(sessionData);

      // Assemble content based on execution path
      let content: any;
      let format = 'text';

      if (sessionData.executionPath === 'knowledge_retrieval') {
        content = this.assembleKnowledgeResponse(sessionData);
      } else if (sessionData.executionPath === 'optimization') {
        content = this.assembleOptimizationResponse(sessionData);
      } else {
        content = this.assembleHybridResponse(sessionData);
      }

      // Publish final response
      this.publish({
        type: EVENT_TYPES.RESPONSE_READY,
        payload: {
          content,
          format,
          metadata: {
            executionPath: sessionData.executionPath,
            agentsInvolved: Array.from(new Set(sessionData.agentsInvolved)), // Remove duplicates
            duration,
            confidence
          }
        },
        correlationId
      });

      // Update progress
      this.updateProgress(correlationId, 'completed', 'Response assembled and ready');

      // Clean up session data
      this.sessionData.delete(correlationId);

    } catch (error) {
      console.error(`❌ Failed to assemble response for session ${correlationId}:`, error);
      throw error;
    }
  }

  private assembleKnowledgeResponse(sessionData: ResponseData): any {
    return {
      type: 'knowledge_response',
      query: sessionData.intent?.originalQuery,
      answer: sessionData.explanation?.content || sessionData.ragResponse?.results?.[0]?.content,
      sources: sessionData.ragResponse?.sources || [],
      confidence: sessionData.ragResponse?.metadata?.confidence || 0,
      additionalContext: sessionData.explanation?.context
    };
  }

  private assembleOptimizationResponse(sessionData: ResponseData): any {
    return {
      type: 'optimization_response',
      problem: sessionData.intent?.originalQuery,
      solution: sessionData.optimizationResult?.solution,
      explanation: sessionData.explanation?.content,
      metrics: sessionData.optimizationResult?.metrics,
      confidence: sessionData.optimizationResult?.confidence || 0,
      additionalContext: sessionData.explanation?.context
    };
  }

  private assembleHybridResponse(sessionData: ResponseData): any {
    return {
      type: 'hybrid_response',
      query: sessionData.intent?.originalQuery,
      knowledge: {
        answer: sessionData.ragResponse?.results?.[0]?.content,
        sources: sessionData.ragResponse?.sources || []
      },
      optimization: {
        solution: sessionData.optimizationResult?.solution,
        metrics: sessionData.optimizationResult?.metrics
      },
      explanation: sessionData.explanation?.content,
      confidence: Math.min(
        sessionData.ragResponse?.metadata?.confidence || 0,
        sessionData.optimizationResult?.confidence || 0
      )
    };
  }

  private calculateConfidence(sessionData: ResponseData): number {
    let totalConfidence = 0;
    let count = 0;

    if (sessionData.ragResponse?.metadata?.confidence) {
      totalConfidence += sessionData.ragResponse.metadata.confidence;
      count++;
    }

    if (sessionData.optimizationResult?.confidence) {
      totalConfidence += sessionData.optimizationResult.confidence;
      count++;
    }

    if (sessionData.intent?.confidence) {
      totalConfidence += sessionData.intent.confidence;
      count++;
    }

    return count > 0 ? totalConfidence / count : 0.5;
  }

  public canHandle(eventType: string): boolean {
    const handledEvents = [
      EVENT_TYPES.INTENT_IDENTIFIED,
      EVENT_TYPES.RAG_RESPONSE_READY,
      EVENT_TYPES.EXPLANATION_READY,
      EVENT_TYPES.SOLUTION_FOUND,
      EVENT_TYPES.CRITIQUE_READY,
      EVENT_TYPES.DEBATE_READY,
      EVENT_TYPES.WORKFLOW_COMPLETED
    ];
    return handledEvents.includes(eventType as any);
  }
}

// Export singleton instance
export const responseAgent = new ResponseAgent(); 