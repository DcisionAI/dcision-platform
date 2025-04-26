import { MCPStorage } from './MCPStorage';
import { MCP } from '../mcp/MCPTypes';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { supabase } from '../utils/supabase';

// Define types for mocking
type SupabaseResponse<T> = {
  data: T | null;
  error: Error | null;
  count?: number;
};

type MockFunction = jest.Mock;

// Mock Supabase client
jest.mock('../utils/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

describe('MCPStorage', () => {
  let storage: MCPStorage;
  let mockMCP: MCP;

  beforeEach(() => {
    storage = new MCPStorage();
    mockMCP = {
      sessionId: 'test-session',
      version: '1.0.0',
      created: '2024-03-20T10:00:00Z',
      lastModified: '2024-03-20T10:00:00Z',
      status: 'draft',
      model: {
        variables: [],
        constraints: [],
        objective: {
          type: 'minimize',
          field: 'cost',
          description: 'Minimize total cost'
        }
      },
      context: {
        problemType: 'custom',
        dataset: {
          internalSources: []
        },
        environment: {
          region: 'test',
          timezone: 'UTC'
        }
      },
      protocol: {
        steps: [],
        humanInTheLoop: {
          required: false
        },
        allowPartialSolutions: false,
        explainabilityEnabled: true
      }
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an MCP successfully', async () => {
      const mockId = 'test-id';
      const mockResponse: SupabaseResponse<{ id: string }> = {
        data: { id: mockId },
        error: null
      };

      const mockSingle = jest.fn().mockResolvedValue(mockResponse);
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });

      (supabase.from as MockFunction).mockImplementation(mockFrom);

      const result = await storage.create(mockMCP);
      expect(result).toBe(mockId);
      expect(mockFrom).toHaveBeenCalledWith('mcps');
    });

    it('should throw error when creation fails', async () => {
      const mockResponse: SupabaseResponse<{ id: string }> = {
        data: null,
        error: new Error('Database error')
      };

      const mockSingle = jest.fn().mockResolvedValue(mockResponse);
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });

      (supabase.from as MockFunction).mockImplementation(mockFrom);

      await expect(storage.create(mockMCP)).rejects.toThrow('Failed to create MCP');
    });
  });

  describe('getBySessionId', () => {
    it('should retrieve an MCP by session ID', async () => {
      const mockResponse: SupabaseResponse<any> = {
        data: {
          session_id: mockMCP.sessionId,
          version: mockMCP.version,
          created: mockMCP.created,
          last_modified: mockMCP.lastModified,
          status: mockMCP.status,
          model: mockMCP.model,
          context: mockMCP.context,
          protocol: mockMCP.protocol
        },
        error: null
      };

      const mockSingle = jest.fn().mockResolvedValue(mockResponse);
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

      (supabase.from as MockFunction).mockImplementation(mockFrom);

      const result = await storage.getBySessionId(mockMCP.sessionId);
      expect(result).toEqual(mockMCP);
    });

    it('should return null when MCP is not found', async () => {
      const mockResponse: SupabaseResponse<any> = {
        data: null,
        error: null
      };

      const mockSingle = jest.fn().mockResolvedValue(mockResponse);
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

      (supabase.from as MockFunction).mockImplementation(mockFrom);

      const result = await storage.getBySessionId('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an MCP successfully', async () => {
      const mockResponse: SupabaseResponse<any> = {
        data: null,
        error: null
      };

      const mockEq = jest.fn().mockResolvedValue(mockResponse);
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = jest.fn().mockReturnValue({ update: mockUpdate });

      (supabase.from as MockFunction).mockImplementation(mockFrom);

      await expect(storage.update(mockMCP)).resolves.not.toThrow();
    });

    it('should throw error when update fails', async () => {
      const mockResponse: SupabaseResponse<any> = {
        data: null,
        error: new Error('Update failed')
      };

      const mockEq = jest.fn().mockResolvedValue(mockResponse);
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = jest.fn().mockReturnValue({ update: mockUpdate });

      (supabase.from as MockFunction).mockImplementation(mockFrom);

      await expect(storage.update(mockMCP)).rejects.toThrow('Failed to update MCP');
    });
  });

  describe('list', () => {
    it('should list MCPs with pagination', async () => {
      const mockMCPs = [mockMCP];
      const mockResponse: SupabaseResponse<any> = {
        data: mockMCPs.map(mcp => ({
          session_id: mcp.sessionId,
          version: mcp.version,
          created: mcp.created,
          last_modified: mcp.lastModified,
          status: mcp.status,
          model: mcp.model,
          context: mcp.context,
          protocol: mcp.protocol
        })),
        error: null,
        count: 1
      };

      const mockRange = jest.fn().mockResolvedValue(mockResponse);
      const mockEq = jest.fn().mockReturnValue({ range: mockRange });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

      (supabase.from as MockFunction).mockImplementation(mockFrom);

      const result = await storage.list({ limit: 10, offset: 0 });
      expect(result.mcps).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
}); 