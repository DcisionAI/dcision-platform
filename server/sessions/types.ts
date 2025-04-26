export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  IDLE = 'IDLE',
  TERMINATED = 'TERMINATED',
  ERROR = 'ERROR'
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
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
  agentId: string;
} 