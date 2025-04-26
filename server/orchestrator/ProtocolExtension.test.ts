import { ProtocolExtensionManager, StepHandler, StepMetadata } from './ProtocolExtension';
import { ProtocolStep, StepAction } from '../mcp/MCPTypes';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('ProtocolExtensionManager', () => {
  let manager: ProtocolExtensionManager;
  let mockHandler: StepHandler;
  let mockMetadata: StepMetadata;
  let mockStep: ProtocolStep;

  beforeEach(() => {
    manager = new ProtocolExtensionManager();
    
    const execute = async () => {};
    const validate = async () => true;
    const rollback = async () => {};

    mockHandler = {
      execute: jest.fn(execute),
      validate: jest.fn(validate),
      rollback: jest.fn(rollback)
    };

    mockMetadata = {
      name: 'Test Handler',
      description: 'A test handler',
      version: '1.0.0',
      author: 'Test Author'
    };

    mockStep = {
      action: 'custom' as StepAction,
      description: 'Test step',
      required: true
    };
  });

  describe('registerHandler', () => {
    it('should register a new handler successfully', () => {
      manager.registerHandler('custom' as StepAction, mockHandler, mockMetadata);
      expect(manager.hasHandler('custom' as StepAction)).toBe(true);
    });

    it('should throw error when registering duplicate handler', () => {
      manager.registerHandler('custom' as StepAction, mockHandler, mockMetadata);
      expect(() => 
        manager.registerHandler('custom' as StepAction, mockHandler, mockMetadata)
      ).toThrow('Handler for action custom already registered');
    });

    it('should validate handler interface', () => {
      const invalidHandler = {} as StepHandler;
      expect(() => 
        manager.registerHandler('custom' as StepAction, invalidHandler, mockMetadata)
      ).toThrow('Handler must implement execute method');
    });
  });

  describe('unregisterHandler', () => {
    it('should unregister an existing handler', () => {
      manager.registerHandler('custom' as StepAction, mockHandler, mockMetadata);
      manager.unregisterHandler('custom' as StepAction);
      expect(manager.hasHandler('custom' as StepAction)).toBe(false);
    });

    it('should throw error when unregistering non-existent handler', () => {
      expect(() => 
        manager.unregisterHandler('custom' as StepAction)
      ).toThrow('No handler registered for action custom');
    });
  });

  describe('executeStep', () => {
    it('should execute step successfully', async () => {
      manager.registerHandler('custom' as StepAction, mockHandler, mockMetadata);
      const context = { data: 'test' };
      
      await manager.executeStep(mockStep, context);
      expect(mockHandler.execute).toHaveBeenCalledWith(mockStep, context);
    });

    it('should validate step before execution if validator exists', async () => {
      manager.registerHandler('custom' as StepAction, mockHandler, mockMetadata);
      const context = { data: 'test' };
      
      await manager.executeStep(mockStep, context);
      expect(mockHandler.validate).toHaveBeenCalledWith(mockStep);
      expect(mockHandler.execute).toHaveBeenCalledWith(mockStep, context);
    });

    it('should attempt rollback on execution failure', async () => {
      const failingExecute = async () => { throw new Error('Execution failed'); };
      const failingHandler: StepHandler = {
        execute: jest.fn(failingExecute),
        rollback: jest.fn(async () => {})
      };

      manager.registerHandler('custom' as StepAction, failingHandler, mockMetadata);
      const context = { data: 'test' };
      
      await expect(manager.executeStep(mockStep, context)).rejects.toThrow();
      expect(failingHandler.rollback).toHaveBeenCalledWith(mockStep, context);
    });
  });

  describe('event emission', () => {
    it('should emit events on handler registration', (done) => {
      manager.on('handler:registered', (data) => {
        expect(data.action).toBe('custom');
        expect(data.metadata).toBe(mockMetadata);
        done();
      });

      manager.registerHandler('custom' as StepAction, mockHandler, mockMetadata);
    });

    it('should emit events on step completion', (done) => {
      const context = { data: 'test' };
      
      manager.on('step:completed', (data) => {
        expect(data.step).toBe(mockStep);
        expect(data.context).toBe(context);
        done();
      });

      manager.registerHandler('custom' as StepAction, mockHandler, mockMetadata);
      manager.executeStep(mockStep, context);
    });
  });

  describe('metadata management', () => {
    it('should store and retrieve handler metadata', () => {
      manager.registerHandler('custom' as StepAction, mockHandler, mockMetadata);
      const retrievedMetadata = manager.getMetadata('custom' as StepAction);
      expect(retrievedMetadata).toEqual(mockMetadata);
    });

    it('should list all registered handlers with metadata', () => {
      manager.registerHandler('custom' as StepAction, mockHandler, mockMetadata);
      const handlers = manager.listHandlers();
      expect(handlers).toHaveLength(1);
      expect(handlers[0]).toEqual({
        action: 'custom',
        metadata: mockMetadata
      });
    });
  });
}); 