import { Protocol } from '../mcp/types';

export enum SessionStatus {
  CREATED = 'created',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum ProblemType {
  VEHICLE_ROUTING = 'vehicle_routing',
  FLEET_SCHEDULING = 'fleet_scheduling',
  WORKFORCE_OPTIMIZATION = 'workforce_optimization',
  SUPPLY_CHAIN = 'supply_chain',
  CUSTOM = 'custom'
}

export interface Session {
  id: string;
  protocol: Protocol;
  status: SessionStatus;
  currentStep?: string;
  progress?: number;
  error?: string;
  failedStep?: string;
  outputs?: Record<string, any>;
  createdAt: string;
  lastUpdated: string;
} 