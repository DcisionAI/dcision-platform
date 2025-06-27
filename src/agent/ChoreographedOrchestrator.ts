import { BaseAgent, AgentConfig, AgentContext } from './BaseAgent';
import { EVENT_TYPES, AGENT_TYPES } from './EventTypes';
import { messageBus } from './MessageBus';

type Message = { type: string; payload: any; correlationId?: string; from?: string; to?: string; timestamp?: string };

export class ChoreographedOrchestrator extends BaseAgent {
  private workflowSessions: Map<string, any> = new Map();
  private timeoutHandlers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    const config: AgentConfig = {
      name: 'ChoreographedOrchestrator',
      type: AGENT_TYPES.COORDINATOR_AGENT,
      capabilities: ['workflow_coordination', 'event_routing', 'session_management'],
      maxRetries: 1,
      timeout: 300000 // 5 minutes
    };
    super(config);

    this.initializeEventHandlers();
  }

  private initializeEventHandlers(): void {
    console.log(`🔔 Orchestrator initializing event handlers...`);
    
    // Subscribe to all events from the message bus
    messageBus.subscribe('*', (event: Message) => {
      console.log(`🔔 Orchestrator received event: ${event.type} from ${event.from} for session: ${event.correlationId}`);
      this.handleAgentEvent(event);
    });
    
    console.log(`✅ Orchestrator event handlers initialized`);
  }

  protected subscribeToEvents(): void {
    // Subscribe to user queries to start workflows - but only from external sources
    this.subscribe(EVENT_TYPES.USER_QUERY_RECEIVED, (event: Message) => {
      // Only start workflow if it's not from the orchestrator itself
      if (event.from !== this.config.name) {
        this.startWorkflow(event);
      }
    });

    // Subscribe to workflow control events
    this.subscribe(EVENT_TYPES.WORKFLOW_STARTED, (event: Message) => {
      this.handleWorkflowStarted(event);
    });

    this.subscribe(EVENT_TYPES.WORKFLOW_COMPLETED, (event: Message) => {
      this.handleWorkflowCompleted(event);
    });

    this.subscribe(EVENT_TYPES.WORKFLOW_FAILED, (event: Message) => {
      this.handleWorkflowFailed(event);
    });

    this.subscribe(EVENT_TYPES.WORKFLOW_TIMEOUT, (event: Message) => {
      this.handleWorkflowTimeout(event);
    });
  }

  protected async handleEvent(event: Message): Promise<void> {
    // This method is required by BaseAgent but not used in this orchestrator
    // as we handle events through the subscribeToEvents method
    console.log(`🎭 Orchestrator received event: ${event.type} for session: ${event.correlationId}`);
  }

  private async startWorkflow(event: Message): Promise<void> {
    const correlationId = event.correlationId;
    if (!correlationId) {
      console.error('❌ No correlationId provided for workflow start');
      return;
    }

    console.log(`🚀 Starting choreographed workflow for session: ${correlationId}`);

    // Initialize workflow session
    const session = {
      sessionId: correlationId,
      correlationId,
      startTime: Date.now(),
      status: 'running',
      events: [],
      agentsInvolved: [],
      currentStep: 'intent_analysis',
      userQuery: event.payload.query,
      customerData: event.payload.customerData || {}
    };

    this.workflowSessions.set(correlationId, session);

    // Set timeout for the entire workflow
    const timeoutHandler = setTimeout(() => {
      this.handleWorkflowTimeout({ 
        type: EVENT_TYPES.WORKFLOW_TIMEOUT,
        payload: { sessionId: correlationId },
        correlationId 
      });
    }, this.config.timeout);

    this.timeoutHandlers.set(correlationId, timeoutHandler);

    // Start with intent analysis
    await this.triggerIntentAnalysis(event);
  }

  private async triggerIntentAnalysis(event: Message): Promise<void> {
    const correlationId = event.correlationId;
    if (!correlationId) return;
    
    console.log(`🧠 Triggering intent analysis for session: ${correlationId}`);

    // Publish intent analysis event
    this.publish({
      type: EVENT_TYPES.USER_QUERY_RECEIVED,
      payload: {
        query: event.payload.query,
        customerData: event.payload.customerData || {},
        requiresOptimization: this.detectOptimizationRequest(event.payload.query)
      },
      correlationId
    });
  }

  private detectOptimizationRequest(query: string): boolean {
    const optimizationKeywords = [
      'optimize', 'optimization', 'minimize', 'maximize', 'best', 'efficient',
      'crew', 'assignment', 'schedule', 'resource', 'allocation', 'cost',
      'budget', 'timeline', 'deadline', 'constraint'
    ];

    const lowerQuery = query.toLowerCase();
    return optimizationKeywords.some(keyword => lowerQuery.includes(keyword));
  }

  private handleAgentEvent(event: Message): void {
    const correlationId = event.correlationId;
    if (!correlationId) return;

    const session = this.workflowSessions.get(correlationId);
    if (!session) {
      console.log(`⚠️ No session found for event: ${event.type} from ${event.from} for session: ${correlationId}`);
      return;
    }

    // Skip events from the orchestrator itself
    if (event.from === this.config.name) return;

    // Record the event
    session.events.push({
      type: event.type,
      agent: event.from,
      timestamp: Date.now(),
      payload: event.payload
    });

    console.log(`📝 Event recorded: ${event.type} from ${event.from} for session: ${correlationId}`);

    // Update session based on event type
    switch (event.type) {
      case EVENT_TYPES.INTENT_IDENTIFIED:
        console.log(`🧠 Processing INTENT_IDENTIFIED for session: ${correlationId}`);
        this.handleIntentIdentified(event, session);
        break;
      
      case EVENT_TYPES.KNOWLEDGE_RETRIEVED:
        console.log(`📚 Processing KNOWLEDGE_RETRIEVED for session: ${correlationId}`);
        this.handleKnowledgeRetrieved(event, session);
        break;
      
      case EVENT_TYPES.DATA_PREPARED:
        console.log(`📊 Processing DATA_PREPARED for session: ${correlationId}`);
        this.handleDataPrepared(event, session);
        break;
      
      case EVENT_TYPES.MODEL_BUILT:
        console.log(`🏗️ Processing MODEL_BUILT for session: ${correlationId}`);
        this.handleModelBuilt(event, session);
        break;
      
      case EVENT_TYPES.SOLUTION_FOUND:
        console.log(`✅ Processing SOLUTION_FOUND for session: ${correlationId}`);
        this.handleSolutionFound(event, session);
        break;
      
      case EVENT_TYPES.RESPONSE_GENERATED:
        console.log(`📝 Processing RESPONSE_GENERATED for session: ${correlationId}`);
        this.handleResponseGenerated(event, session);
        break;
      
      case EVENT_TYPES.OPTIMIZATION_ERROR:
        console.log(`❌ Processing OPTIMIZATION_ERROR for session: ${correlationId}`);
        this.handleOptimizationError(event, session);
        break;
      
      case EVENT_TYPES.PROGRESS_UPDATE:
        console.log(`📊 Processing PROGRESS_UPDATE for session: ${correlationId}`);
        this.handleProgressUpdate(event, session);
        break;
      
      default:
        console.log(`⚠️ Unhandled event type: ${event.type} for session: ${correlationId}`);
        break;
    }
  }

  private async handleIntentIdentified(event: Message, session: any): Promise<void> {
    console.log(`📝 Intent identified for session: ${session.correlationId}`);
    
    session.currentStep = 'intent_analysis_complete';
    session.intent = event.payload;

    // For testing purposes, skip the complex workflow and go directly to response generation
    console.log(`🚀 Skipping complex workflow for testing, going directly to response generation`);
    session.currentStep = 'response_generation';
    await this.triggerResponseGeneration(event);
  }

  private async triggerDataPreparation(event: Message): Promise<void> {
    const correlationId = event.correlationId;
    if (!correlationId) return;
    
    console.log(`📊 Triggering data preparation for session: ${correlationId}`);

    this.publish({
      type: EVENT_TYPES.OPTIMIZATION_REQUESTED,
      payload: {
        customerData: event.payload.customerData || {},
        intent: event.payload,
        originalQuery: event.payload.originalQuery
      },
      correlationId
    });
  }

  private async triggerKnowledgeRetrieval(event: Message): Promise<void> {
    const correlationId = event.correlationId;
    if (!correlationId) return;
    
    console.log(`🔍 Triggering knowledge retrieval for session: ${correlationId}`);

    this.publish({
      type: EVENT_TYPES.KNOWLEDGE_RETRIEVAL_REQUESTED,
      payload: {
        query: event.payload.originalQuery,
        intent: event.payload
      },
      correlationId
    });
  }

  private async handleKnowledgeRetrieved(event: Message, session: any): Promise<void> {
    console.log(`📚 Knowledge retrieved for session: ${session.correlationId}`);
    
    session.currentStep = 'knowledge_retrieval_complete';
    session.knowledge = event.payload;

    // Generate response with knowledge
    session.currentStep = 'response_generation';
    await this.triggerResponseGeneration(event);
  }

  private async handleDataPrepared(event: Message, session: any): Promise<void> {
    console.log(`📊 Data prepared for session: ${session.correlationId}`);
    
    session.currentStep = 'data_preparation_complete';
    session.enrichedData = event.payload.enrichedData;

    // Trigger model building
    session.currentStep = 'model_building';
    await this.triggerModelBuilding(event);
  }

  private async triggerModelBuilding(event: Message): Promise<void> {
    const correlationId = event.correlationId;
    if (!correlationId) return;
    
    console.log(`🏗️ Triggering model building for session: ${correlationId}`);

    // The ModelBuilderAgent will automatically pick up the DATA_PREPARED event
    // No need to publish additional event
  }

  private async handleModelBuilt(event: Message, session: any): Promise<void> {
    console.log(`🏗️ Model built for session: ${session.correlationId}`);
    
    session.currentStep = 'model_building_complete';
    session.modelConfig = event.payload;

    // Trigger solving
    session.currentStep = 'solving';
    await this.triggerSolving(event);
  }

  private async triggerSolving(event: Message): Promise<void> {
    const correlationId = event.correlationId;
    if (!correlationId) return;
    
    console.log(`🔧 Triggering solving for session: ${correlationId}`);

    // The SolverAgent will automatically pick up the MODEL_BUILT event
    // No need to publish additional event
  }

  private async handleSolutionFound(event: Message, session: any): Promise<void> {
    console.log(`✅ Solution found for session: ${session.correlationId}`);
    
    session.currentStep = 'solving_complete';
    session.solution = event.payload;

    // Generate response with solution
    session.currentStep = 'response_generation';
    await this.triggerResponseGeneration(event);
  }

  private async triggerResponseGeneration(event: Message): Promise<void> {
    const correlationId = event.correlationId;
    if (!correlationId) {
      console.error(`❌ No correlationId provided for response generation`);
      return;
    }
    
    console.log(`📝 Triggering response generation for session: ${correlationId}`);

    const session = this.workflowSessions.get(correlationId);
    if (!session) {
      console.error(`❌ No session found for response generation: ${correlationId}`);
      return;
    }

    const responseEvent = {
      type: EVENT_TYPES.RESPONSE_GENERATION_STARTED,
      payload: {
        session: session,
        originalQuery: event.payload.originalQuery || event.payload.query || session.userQuery
      },
      correlationId
    };

    console.log(`📤 Publishing RESPONSE_GENERATION_STARTED event:`, responseEvent);
    this.publish(responseEvent);
    console.log(`✅ RESPONSE_GENERATION_STARTED event published for session: ${correlationId}`);
  }

  private async handleResponseGenerated(event: Message, session: any): Promise<void> {
    console.log(`📝 Response generated for session: ${session.correlationId}`);
    
    session.currentStep = 'response_generation_complete';
    session.response = event.payload;

    // Complete the workflow
    await this.completeWorkflow(session);
  }

  private async handleOptimizationError(event: Message, session: any): Promise<void> {
    console.error(`❌ Optimization error for session: ${session.correlationId}:`, event.payload.error);
    
    session.currentStep = 'error';
    session.error = event.payload.error;

    if (event.payload.error.recoverable) {
      // Try to recover or generate error response
      await this.triggerResponseGeneration(event);
    } else {
      // Fail the workflow
      await this.failWorkflow(session, event.payload.error);
    }
  }

  private async handleProgressUpdate(event: Message, session: any): Promise<void> {
    // Update session progress
    session.progress = event.payload;
  }

  private async completeWorkflow(session: any): Promise<void> {
    console.log(`✅ Workflow completed for session: ${session.correlationId}`);
    
    session.status = 'completed';
    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;

    // Clear timeout
    const timeoutHandler = this.timeoutHandlers.get(session.correlationId);
    if (timeoutHandler) {
      clearTimeout(timeoutHandler);
      this.timeoutHandlers.delete(session.correlationId);
    }

    // Publish workflow completed event
    this.publish({
      type: EVENT_TYPES.WORKFLOW_COMPLETED,
      payload: {
        sessionId: session.sessionId,
        executionPath: session.currentStep,
        content: session.response,
        metadata: {
          agentsInvolved: session.agentsInvolved,
          duration: session.duration,
          confidence: session.response?.confidence || 0.8,
          eventCount: session.events.length
        },
        status: 'success',
        timestamps: {
          start: new Date(session.startTime).toISOString(),
          end: new Date(session.endTime).toISOString()
        }
      },
      correlationId: session.correlationId
    });

    // Clean up session
    this.workflowSessions.delete(session.correlationId);
  }

  private async failWorkflow(session: any, error: any): Promise<void> {
    console.error(`❌ Workflow failed for session: ${session.correlationId}`);
    
    session.status = 'failed';
    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;

    // Clear timeout
    const timeoutHandler = this.timeoutHandlers.get(session.correlationId);
    if (timeoutHandler) {
      clearTimeout(timeoutHandler);
      this.timeoutHandlers.delete(session.correlationId);
    }

    // Publish workflow failed event
    this.publish({
      type: EVENT_TYPES.WORKFLOW_FAILED,
      payload: {
        sessionId: session.sessionId,
        executionPath: session.currentStep,
        content: null,
        metadata: {
          agentsInvolved: session.agentsInvolved,
          duration: session.duration,
          confidence: 0,
          eventCount: session.events.length
        },
        status: 'error',
        error: {
          code: error.code || 'WORKFLOW_FAILED',
          message: error.message || 'Unknown error',
          context: { step: session.currentStep }
        },
        timestamps: {
          start: new Date(session.startTime).toISOString(),
          end: new Date(session.endTime).toISOString()
        }
      },
      correlationId: session.correlationId
    });

    // Clean up session
    this.workflowSessions.delete(session.correlationId);
  }

  private async handleWorkflowTimeout(event: Message): Promise<void> {
    const correlationId = event.correlationId;
    if (!correlationId) return;
    
    const session = this.workflowSessions.get(correlationId);
    if (!session) return;

    console.error(`⏰ Workflow timed out for session: ${correlationId}`);
    
    session.status = 'timeout';
    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;

    // Clear timeout handler
    const timeoutHandler = this.timeoutHandlers.get(correlationId);
    if (timeoutHandler) {
      clearTimeout(timeoutHandler);
      this.timeoutHandlers.delete(correlationId);
    }

    // Publish workflow timeout event
    this.publish({
      type: EVENT_TYPES.WORKFLOW_TIMEOUT,
      payload: {
        sessionId: session.sessionId,
        executionPath: session.currentStep,
        content: null,
        metadata: {
          agentsInvolved: session.agentsInvolved,
          duration: session.duration,
          confidence: 0,
          eventCount: session.events.length
        },
        status: 'error',
        error: {
          code: 'WORKFLOW_TIMEOUT',
          message: 'Workflow timed out after 5 minutes',
          context: { timeout: this.config.timeout }
        },
        timestamps: {
          start: new Date(session.startTime).toISOString(),
          end: new Date(session.endTime).toISOString()
        }
      },
      correlationId
    });

    // Clean up session
    this.workflowSessions.delete(correlationId);
  }

  private handleWorkflowStarted(event: Message): void {
    console.log(`🚀 Workflow started: ${event.correlationId}`);
  }

  private handleWorkflowCompleted(event: Message): void {
    console.log(`✅ Workflow completed: ${event.correlationId}`);
  }

  private handleWorkflowFailed(event: Message): void {
    console.error(`❌ Workflow failed: ${event.correlationId}`, event.payload.error);
  }

  public getSession(correlationId: string): any {
    return this.workflowSessions.get(correlationId);
  }

  public getActiveSessions(): string[] {
    return Array.from(this.workflowSessions.keys());
  }

  public canHandle(eventType: string): boolean {
    return eventType === EVENT_TYPES.USER_QUERY_RECEIVED ||
           eventType === EVENT_TYPES.WORKFLOW_STARTED ||
           eventType === EVENT_TYPES.WORKFLOW_COMPLETED ||
           eventType === EVENT_TYPES.WORKFLOW_FAILED ||
           eventType === EVENT_TYPES.WORKFLOW_TIMEOUT;
  }

  public publish(event: Message): void {
    // Add agent metadata
    event.from = this.config.name;
    event.timestamp = new Date().toISOString();
    
    // Add context if available
    if (this.context) {
      event.correlationId = event.correlationId || this.context.correlationId;
    }

    console.log(`📤 Orchestrator publishing event: ${event.type} for session: ${event.correlationId}`);
    messageBus.publish(event);
    console.log(`📤 ${this.config.name} published ${event.type} for session: ${event.correlationId}`);
  }
}

// Export singleton instance
export const choreographedOrchestrator = new ChoreographedOrchestrator(); 