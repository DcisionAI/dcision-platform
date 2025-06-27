import { BaseAgent, AgentConfig, AgentContext } from './BaseAgent';
import { EVENT_TYPES, INTENT_TYPES, AGENT_TYPES } from './EventTypes';
import { agnoIntentAgent, IntentResult } from '../pages/api/_lib/dcisionai-agents/intentAgent/agnoIntentAgent';

type Message = { type: string; payload: any; correlationId?: string; from?: string; to?: string };

export class IntentAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      name: 'IntentAgent',
      type: AGENT_TYPES.INTENT_AGENT,
      capabilities: ['intent_analysis', 'query_classification', 'entity_extraction'],
      maxRetries: 3,
      timeout: 30000
    };
    super(config);
  }

  protected subscribeToEvents(): void {
    console.log(`🔔 IntentAgent subscribing to events...`);
    
    // Subscribe to user query events
    this.subscribe(EVENT_TYPES.USER_QUERY_RECEIVED, (event: Message) => {
      console.log(`🔔 IntentAgent received USER_QUERY_RECEIVED event:`, event);
      this.processEvent(event);
    });

    // Subscribe to workflow start events (for backward compatibility)
    this.subscribe('start', (event: Message) => {
      console.log(`🔔 IntentAgent received start event:`, event);
      this.processEvent(event);
    });
    
    console.log(`✅ IntentAgent subscribed to events`);
  }

  protected async handleEvent(event: Message): Promise<void> {
    const correlationId = event.correlationId;
    if (!correlationId) {
      console.warn('⚠️ IntentAgent: No correlationId provided');
      return;
    }

    console.log(`🧠 IntentAgent processing event: ${event.type} for session: ${correlationId}`);

    try {
      let userQuery: string;
      let customerData: any = {};
      let sessionId: string;

      // Handle different event types
      if (event.type === EVENT_TYPES.USER_QUERY_RECEIVED) {
        userQuery = event.payload.query;
        customerData = event.payload.customerData || {};
        sessionId = event.payload.sessionId;
      } else if (event.type === 'start') {
        userQuery = event.payload.query || event.payload.message;
        customerData = event.payload.customerData || {};
        sessionId = event.payload.sessionId || correlationId;
      } else {
        throw new Error(`Unsupported event type: ${event.type}`);
      }

      // Set context for this processing session
      const context: AgentContext = {
        sessionId,
        correlationId,
        userQuery,
        customerData
      };
      this.setContext(context);

      // Update progress
      this.updateProgress(correlationId, 'started', 'Analyzing user intent');

      // Analyze intent using the existing agno intent agent with fallback
      let intentResult: any;
      try {
        intentResult = await this.executeWithRetry(
          () => agnoIntentAgent.interpretIntent(userQuery, sessionId),
          context
        );
      } catch (agnoError) {
        console.warn(`⚠️ Agno intent analysis failed, using fallback:`, agnoError);
        intentResult = this.createFallbackIntentResult(userQuery);
      }

      console.log(`✅ Intent analysis completed for session: ${correlationId}:`, intentResult);

      // Determine the primary intent and capabilities needed
      const primaryIntent = this.determinePrimaryIntent(intentResult);
      const requiresOptimization = this.requiresOptimization(intentResult);
      const requiresKnowledgeRetrieval = this.requiresKnowledgeRetrieval(intentResult);

      // Publish intent identified event
      this.publish({
        type: EVENT_TYPES.INTENT_IDENTIFIED,
        payload: {
          primaryIntent,
          confidence: intentResult.confidence || 0.8,
          keywords: intentResult.keywords || [],
          decisionType: intentResult.decisionType,
          requiresOptimization,
          requiresKnowledgeRetrieval,
          originalQuery: userQuery,
          fullIntentAnalysis: intentResult
        },
        correlationId
      });

      // Update progress
      this.updateProgress(correlationId, 'completed', `Intent identified: ${primaryIntent}`);

      // Publish workflow started event
      this.publish({
        type: EVENT_TYPES.WORKFLOW_STARTED,
        payload: {
          sessionId,
          userQuery,
          customerData,
          intent: primaryIntent,
          timestamp: new Date().toISOString()
        },
        correlationId
      });

      // Clear context after processing
      this.clearContext();

    } catch (error) {
      console.error(`❌ IntentAgent failed to process event:`, error);
      
      this.publish({
        type: EVENT_TYPES.AGENT_ERROR,
        payload: {
          error: {
            code: 'INTENT_ANALYSIS_FAILED',
            message: error instanceof Error ? error.message : String(error),
            context: { eventType: event.type, agent: this.config.name }
          },
          step: this.config.type,
          agent: this.config.name,
          recoverable: true
        },
        correlationId
      });

      // Clear context on error
      this.clearContext();
    }
  }

  private createFallbackIntentResult(userQuery: string): any {
    const lowerQuery = userQuery.toLowerCase();
    
    // Simple keyword-based intent detection
    const optimizationKeywords = ['optimize', 'optimization', 'minimize', 'maximize', 'best', 'efficient', 'crew', 'assignment', 'schedule', 'resource', 'allocation', 'cost', 'budget', 'timeline', 'deadline', 'constraint'];
    const knowledgeKeywords = ['what', 'how', 'why', 'when', 'where', 'osha', 'safety', 'regulation', 'requirement', 'standard', 'best practice', 'guide'];
    
    const hasOptimizationKeywords = optimizationKeywords.some(keyword => lowerQuery.includes(keyword));
    const hasKnowledgeKeywords = knowledgeKeywords.some(keyword => lowerQuery.includes(keyword));
    
    let primaryIntent = 'knowledge_retrieval';
    let decisionType = 'information_request';
    
    if (hasOptimizationKeywords) {
      primaryIntent = 'optimization';
      decisionType = 'resource_allocation';
      
      if (lowerQuery.includes('crew') || lowerQuery.includes('assignment')) {
        decisionType = 'crew_assignment';
      } else if (lowerQuery.includes('cost') || lowerQuery.includes('budget')) {
        decisionType = 'cost_optimization';
      } else if (lowerQuery.includes('schedule') || lowerQuery.includes('timeline')) {
        decisionType = 'project_scheduling';
      }
    }
    
    return {
      decisionType,
      primaryIntent,
      confidence: 0.7,
      reasoning: 'Fallback response due to error in intent analysis',
      keywords: this.extractKeywords(userQuery),
      optimizationType: hasOptimizationKeywords ? 'crew_assignment' : null,
      modelType: 'LP',
      problemComplexity: 'basic',
      templateRecommendations: hasOptimizationKeywords ? ['crew_assignment_basic'] : [],
      extractedParameters: {}
    };
  }

  private extractKeywords(userQuery: string): string[] {
    const keywords = [];
    const lowerQuery = userQuery.toLowerCase();
    
    // Extract optimization-related keywords
    if (lowerQuery.includes('optimize')) keywords.push('optimization');
    if (lowerQuery.includes('crew')) keywords.push('crew');
    if (lowerQuery.includes('assignment')) keywords.push('assignment');
    if (lowerQuery.includes('schedule')) keywords.push('scheduling');
    if (lowerQuery.includes('cost')) keywords.push('cost');
    if (lowerQuery.includes('budget')) keywords.push('budget');
    if (lowerQuery.includes('timeline')) keywords.push('timeline');
    if (lowerQuery.includes('deadline')) keywords.push('deadline');
    if (lowerQuery.includes('constraint')) keywords.push('constraints');
    
    // Extract knowledge-related keywords
    if (lowerQuery.includes('osha')) keywords.push('osha');
    if (lowerQuery.includes('safety')) keywords.push('safety');
    if (lowerQuery.includes('regulation')) keywords.push('regulations');
    if (lowerQuery.includes('requirement')) keywords.push('requirements');
    
    return keywords;
  }

  private determinePrimaryIntent(intentResult: IntentResult): string {
    // Extract the primary intent from the intent analysis
    if (intentResult.primaryIntent) {
      return intentResult.primaryIntent;
    }

    // Fallback logic based on decision type
    if (intentResult.decisionType) {
      const decisionType = intentResult.decisionType.toLowerCase();
      
      if (decisionType.includes('knowledge') || decisionType.includes('information') || 
          decisionType.includes('what') || decisionType.includes('how')) {
        return INTENT_TYPES.KNOWLEDGE_RETRIEVAL;
      }
      
      if (decisionType.includes('optimize') || decisionType.includes('schedule') || 
          decisionType.includes('plan') || decisionType.includes('allocate')) {
        return INTENT_TYPES.OPTIMIZATION;
      }
      
      if (decisionType.includes('explain') || decisionType.includes('analyze')) {
        return INTENT_TYPES.EXPLANATION;
      }
    }

    // Default to knowledge retrieval for safety
    return INTENT_TYPES.KNOWLEDGE_RETRIEVAL;
  }

  private requiresOptimization(intentResult: IntentResult): boolean {
    const primaryIntent = this.determinePrimaryIntent(intentResult);
    return primaryIntent === INTENT_TYPES.OPTIMIZATION || 
           primaryIntent === INTENT_TYPES.HYBRID ||
           intentResult.decisionType?.toLowerCase().includes('optimize') ||
           intentResult.decisionType?.toLowerCase().includes('schedule') ||
           intentResult.decisionType?.toLowerCase().includes('plan');
  }

  private requiresKnowledgeRetrieval(intentResult: IntentResult): boolean {
    const primaryIntent = this.determinePrimaryIntent(intentResult);
    return primaryIntent === INTENT_TYPES.KNOWLEDGE_RETRIEVAL || 
           primaryIntent === INTENT_TYPES.HYBRID ||
           intentResult.decisionType?.toLowerCase().includes('knowledge') ||
           intentResult.decisionType?.toLowerCase().includes('information') ||
           intentResult.decisionType?.toLowerCase().includes('what') ||
           intentResult.decisionType?.toLowerCase().includes('how');
  }

  public canHandle(eventType: string): boolean {
    return eventType === EVENT_TYPES.USER_QUERY_RECEIVED || eventType === 'start';
  }
}

// Export singleton instance
export const intentAgent = new IntentAgent(); 