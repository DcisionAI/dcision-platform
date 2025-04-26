import { ExampleSessionService } from '../ExampleSessionService';
import { MCPStatus } from '../../types/MCPTypes';

describe('ExampleSessionService', () => {
  let service: ExampleSessionService;

  beforeEach(() => {
    service = new ExampleSessionService();
  });

  describe('listSessions', () => {
    it('should return paginated sessions', async () => {
      const result = await service.listSessions(1, 10);
      expect(result.sessions).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should filter sessions by status', async () => {
      const filters = {
        status: ['completed' as MCPStatus]
      };
      const result = await service.listSessions(1, 10, filters);
      expect(result.sessions.every(s => s.status === 'completed')).toBe(true);
    });

    it('should filter sessions by problem type', async () => {
      const filters = {
        problemType: ['workforce_optimization']
      };
      const result = await service.listSessions(1, 10, filters);
      expect(result.sessions.every(s => s.problemType === 'workforce_optimization')).toBe(true);
    });
  });

  describe('getSession', () => {
    it('should return a specific session', async () => {
      const session = await service.getSession('workforce-scheduling-001');
      expect(session).toBeDefined();
      expect(session.sessionId).toBe('workforce-scheduling-001');
      expect(session.context.problemType).toBe('workforce_optimization');
    });

    it('should throw error for non-existent session', async () => {
      await expect(service.getSession('non-existent')).rejects.toThrow();
    });
  });
}); 