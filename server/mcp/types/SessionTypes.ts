import { MCPStatus } from './MCPTypes';

export interface Session {
  sessionId: string;
  problemType: string;
  created: string;
  status: MCPStatus;
  lastModified: string;
  description?: string;
}

export interface SessionsResponse {
  sessions: Session[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SessionFilters {
  status?: MCPStatus[];
  problemType?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
} 