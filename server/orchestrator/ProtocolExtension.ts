import { ProtocolStep, StepAction } from '../mcp/MCPTypes';
import { EventEmitter } from 'events';

export interface StepHandler {
  execute: (step: ProtocolStep, context: Record<string, unknown>) => Promise<void>;
  validate?: (step: ProtocolStep) => Promise<boolean>;
  rollback?: (step: ProtocolStep, context: Record<string, unknown>) => Promise<void>;
}

export interface StepMetadata {
  name: string;
  description: string;
  version: string;
  author: string;
  dependencies?: string[];
  parameters?: Record<string, {
    type: string;
    required: boolean;
    description: string;
  }>;
}

export class ProtocolExtensionManager {
  private handlers: Map<StepAction, StepHandler>;
  private metadata: Map<StepAction, StepMetadata>;
  private eventEmitter: EventEmitter;

  constructor() {
    this.handlers = new Map();
    this.metadata = new Map();
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Register a new custom step handler
   */
  public registerHandler(
    action: StepAction,
    handler: StepHandler,
    metadata: StepMetadata
  ): void {
    if (this.handlers.has(action)) {
      throw new Error(`Handler for action ${action} already registered`);
    }

    this.validateHandler(handler);
    this.handlers.set(action, handler);
    this.metadata.set(action, metadata);
    this.eventEmitter.emit('handler:registered', { action, metadata });
  }

  /**
   * Unregister a step handler
   */
  public unregisterHandler(action: StepAction): void {
    if (!this.handlers.has(action)) {
      throw new Error(`No handler registered for action ${action}`);
    }

    this.handlers.delete(action);
    this.metadata.delete(action);
    this.eventEmitter.emit('handler:unregistered', { action });
  }

  /**
   * Get a registered handler
   */
  public getHandler(action: StepAction): StepHandler | undefined {
    return this.handlers.get(action);
  }

  /**
   * Get metadata for a registered handler
   */
  public getMetadata(action: StepAction): StepMetadata | undefined {
    return this.metadata.get(action);
  }

  /**
   * List all registered handlers
   */
  public listHandlers(): Array<{ action: StepAction; metadata: StepMetadata }> {
    return Array.from(this.handlers.keys()).map(action => ({
      action,
      metadata: this.metadata.get(action)!
    }));
  }

  /**
   * Check if a handler is registered
   */
  public hasHandler(action: StepAction): boolean {
    return this.handlers.has(action);
  }

  /**
   * Subscribe to handler events
   */
  public on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Execute a protocol step
   */
  public async executeStep(
    step: ProtocolStep,
    context: Record<string, unknown>
  ): Promise<void> {
    const handler = this.getHandler(step.action);
    if (!handler) {
      throw new Error(`No handler registered for action ${step.action}`);
    }

    try {
      // Validate step if validator exists
      if (handler.validate) {
        const isValid = await handler.validate(step);
        if (!isValid) {
          throw new Error(`Step validation failed for action ${step.action}`);
        }
      }

      // Execute step
      await handler.execute(step, context);
      this.eventEmitter.emit('step:completed', { step, context });
    } catch (error) {
      // Attempt rollback if available
      if (handler.rollback) {
        try {
          await handler.rollback(step, context);
        } catch (rollbackError) {
          throw new Error(
            `Step execution failed and rollback failed: ${error}. Rollback error: ${rollbackError}`
          );
        }
      }
      throw error;
    }
  }

  private validateHandler(handler: StepHandler): void {
    if (typeof handler.execute !== 'function') {
      throw new Error('Handler must implement execute method');
    }

    if (handler.validate && typeof handler.validate !== 'function') {
      throw new Error('Handler validate method must be a function');
    }

    if (handler.rollback && typeof handler.rollback !== 'function') {
      throw new Error('Handler rollback method must be a function');
    }
  }
} 