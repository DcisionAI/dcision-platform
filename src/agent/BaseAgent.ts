import { messageBus } from './MessageBus';
import { eventStore } from './EventStore';
import { EVENT_TYPES, AGENT_TYPES, BaseEvent, ProgressEvent, ErrorEvent } from './EventTypes';

type Message = { type: string; payload: any; correlationId?: string; from?: string; to?: string; timestamp?: string };

export interface AgentConfig {
  name: string;
  type: string;
  capabilities: string[];
  maxRetries?: number;
  timeout?: number;
}

export interface AgentContext {
  sessionId: string;
  correlationId: string;
  userQuery: string;
  customerData?: any;
  metadata?: Record<string, any>;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected context: AgentContext | null = null;
  private subscriptions: Array<{ type: string; handler: (event: Message) => void }> = [];
  private isProcessing = false;

  constructor(config: AgentConfig) {
    this.config = config;
    this.initialize();
  }

  protected initialize() {
    // Subscribe to events this agent cares about
    this.subscribeToEvents();
    
    // Subscribe to error events for this agent
    messageBus.subscribe(EVENT_TYPES.AGENT_ERROR, (event: Message) => {
      if (event.payload?.agent === this.config.name) {
        this.handleError(event as ErrorEvent);
      }
    });

    console.log(`🤖 Agent ${this.config.name} initialized with capabilities: ${this.config.capabilities.join(', ')}`);
  }

  protected abstract subscribeToEvents(): void;

  public subscribe(eventType: string, handler: (event: Message) => void): void {
    messageBus.subscribe(eventType, handler);
    this.subscriptions.push({ type: eventType, handler });
  }

  public unsubscribe(eventType: string, handler: (event: Message) => void): void {
    messageBus.unsubscribe(eventType, handler);
    this.subscriptions = this.subscriptions.filter(sub => 
      !(sub.type === eventType && sub.handler === handler)
    );
  }

  public publish(event: Message): void {
    // Add agent metadata
    event.from = this.config.name;
    event.timestamp = new Date().toISOString();
    
    // Add context if available
    if (this.context) {
      event.correlationId = event.correlationId || this.context.correlationId;
    }

    messageBus.publish(event);
    console.log(`📤 ${this.config.name} published ${event.type} for session: ${event.correlationId}`);
  }

  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: AgentContext,
    maxRetries: number = this.config.maxRetries || 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.updateProgress(context.correlationId, 'started', `Attempt ${attempt}/${maxRetries}`);
        const result = await operation();
        this.updateProgress(context.correlationId, 'completed', 'Operation successful');
        return result;
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ ${this.config.name} attempt ${attempt} failed:`, error);
        
        this.updateProgress(context.correlationId, 'error', `Attempt ${attempt} failed: ${error}`);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Publish retry event
          this.publish({
            type: EVENT_TYPES.RETRY_REQUESTED,
            payload: {
              agent: this.config.name,
              attempt,
              maxRetries,
              error: error instanceof Error ? error.message : String(error)
            },
            correlationId: context.correlationId
          });
        }
      }
    }

    // All retries failed
    this.handleError({
      type: EVENT_TYPES.AGENT_ERROR,
      payload: {
        error: {
          code: 'MAX_RETRIES_EXCEEDED',
          message: lastError!.message,
          context: { agent: this.config.name, maxRetries }
        },
        step: this.config.type,
        agent: this.config.name,
        recoverable: false
      },
      correlationId: context.correlationId
    });

    throw lastError!;
  }

  protected updateProgress(correlationId: string, status: 'started' | 'completed' | 'error', message: string, data?: any) {
    const progressEvent: ProgressEvent = {
      type: EVENT_TYPES.PROGRESS_UPDATE,
      payload: {
        step: this.config.type,
        status,
        message,
        data
      },
      correlationId,
      from: this.config.name
    };

    this.publish(progressEvent);
  }

  protected handleError(errorEvent: ErrorEvent) {
    console.error(`❌ ${this.config.name} error:`, errorEvent.payload);
    
    // Publish error event
    this.publish(errorEvent);
    
    // If not recoverable, clean up
    if (!errorEvent.payload.recoverable) {
      this.cleanup();
    }
  }

  protected setContext(context: AgentContext) {
    this.context = context;
  }

  protected clearContext() {
    this.context = null;
  }

  protected async processEvent(event: Message): Promise<void> {
    if (this.isProcessing) {
      console.warn(`⚠️ ${this.config.name} already processing, skipping event: ${event.type}`);
      return;
    }

    this.isProcessing = true;
    
    try {
      await this.handleEvent(event);
    } catch (error) {
      console.error(`❌ ${this.config.name} failed to process event ${event.type}:`, error);
      
      this.publish({
        type: EVENT_TYPES.AGENT_ERROR,
        payload: {
          error: {
            code: 'EVENT_PROCESSING_FAILED',
            message: error instanceof Error ? error.message : String(error),
            context: { eventType: event.type, agent: this.config.name }
          },
          step: this.config.type,
          agent: this.config.name,
          recoverable: true
        },
        correlationId: event.correlationId
      });
    } finally {
      this.isProcessing = false;
    }
  }

  protected abstract handleEvent(event: Message): Promise<void>;

  protected cleanup() {
    // Unsubscribe from all events
    this.subscriptions.forEach(sub => {
      messageBus.unsubscribe(sub.type, sub.handler);
    });
    this.subscriptions = [];
    
    // Clear context
    this.clearContext();
    
    console.log(`🧹 ${this.config.name} cleaned up`);
  }

  public getCapabilities(): string[] {
    return this.config.capabilities;
  }

  public getName(): string {
    return this.config.name;
  }

  public getType(): string {
    return this.config.type;
  }

  public isBusy(): boolean {
    return this.isProcessing;
  }

  // Method to check if this agent can handle a specific event type
  public canHandle(eventType: string): boolean {
    return false; // Override in subclasses
  }

  // Method to get agent status
  public getStatus(): any {
    return {
      name: this.config.name,
      type: this.config.type,
      capabilities: this.config.capabilities,
      isProcessing: this.isProcessing,
      context: this.context ? {
        sessionId: this.context.sessionId,
        correlationId: this.context.correlationId,
        hasUserQuery: !!this.context.userQuery
      } : null
    };
  }
} 