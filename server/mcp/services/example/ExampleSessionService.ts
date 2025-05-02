import { promises as fs } from 'fs';
import path from 'path';
import { Session, SessionsResponse, SessionFilters } from '../../types/SessionTypes';
import { MCP } from '../../types';

export class ExampleSessionService {
  private readonly examplesPath: string;

  constructor() {
    this.examplesPath = path.join(process.cwd(), 'server', 'mcp', 'examples');
  }

  async listSessions(page: number = 1, pageSize: number = 10, filters?: SessionFilters): Promise<SessionsResponse> {
    try {
      const files = await fs.readdir(this.examplesPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      let sessions: Session[] = [];
      for (const file of jsonFiles) {
        const content = await fs.readFile(path.join(this.examplesPath, file), 'utf-8');
        const mcp: MCP = JSON.parse(content);
        
        const session: Session = {
          sessionId: mcp.sessionId,
          problemType: mcp.context.problemType,
          created: mcp.created,
          status: mcp.status,
          lastModified: mcp.lastModified,
          description: `${mcp.context.industry} - ${mcp.context.environment.region}`
        };
        
        // Apply filters if any
        if (this.matchesFilters(session, filters)) {
          sessions.push(session);
        }
      }

      // Sort by created date descending
      sessions.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

      const start = (page - 1) * pageSize;
      const paginatedSessions = sessions.slice(start, start + pageSize);

      return {
        sessions: paginatedSessions,
        total: sessions.length,
        page,
        pageSize
      };
    } catch (error) {
      console.error('Error listing example sessions:', error);
      throw new Error('Failed to list example sessions');
    }
  }

  async getSession(sessionId: string): Promise<MCP> {
    try {
      const files = await fs.readdir(this.examplesPath);
      const sessionFile = files.find(file => file.includes(sessionId));
      
      if (!sessionFile) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const content = await fs.readFile(path.join(this.examplesPath, sessionFile), 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Error getting example session ${sessionId}:`, error);
      throw new Error(`Failed to get example session ${sessionId}`);
    }
  }

  private matchesFilters(session: Session, filters?: SessionFilters): boolean {
    if (!filters) return true;

    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(session.status)) return false;
    }

    if (filters.problemType && filters.problemType.length > 0) {
      if (!filters.problemType.includes(session.problemType)) return false;
    }

    if (filters.dateRange) {
      const sessionDate = new Date(session.created).getTime();
      const startDate = new Date(filters.dateRange.start).getTime();
      const endDate = new Date(filters.dateRange.end).getTime();
      
      if (sessionDate < startDate || sessionDate > endDate) return false;
    }

    return true;
  }
} 