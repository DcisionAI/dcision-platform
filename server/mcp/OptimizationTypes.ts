import { MCP, Variable, Constraint, Objective } from './MCPTypes';

// Resource Scheduling Types
export interface Resource {
  id: string;
  name: string;
  skills: string[];
  availability: Array<{
    start: string;  // ISO time
    end: string;    // ISO time
  }>;
  cost: number;
  efficiency?: number;
  maxWorkload?: number;
  metadata?: Record<string, unknown>;
}

export interface Task {
  id: string;
  name: string;
  duration: number;  // minutes
  requiredSkills: string[];
  priority: number;
  dependencies?: string[];  // IDs of tasks that must be completed before
  earliestStart?: string;  // ISO time
  latestEnd?: string;      // ISO time
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, unknown>;
}

export interface SchedulingProblem extends MCP {
  model: {
    variables: Variable[];
    constraints: Constraint[];
    objective: Objective | Objective[];
    scheduling: {
      resources: Resource[];
      tasks: Task[];
      shiftPatterns?: Array<{
        name: string;
        start: string;  // ISO time
        end: string;    // ISO time
        breakTimes?: Array<{
          start: string;
          end: string;
        }>;
      }>;
    };
  };
}

// Inventory Optimization Types
export interface Product {
  id: string;
  name: string;
  unitCost: number;
  holdingCost: number;
  setupCost: number;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  leadTime: number;  // days
  shelfLife?: number;  // days
  metadata?: Record<string, unknown>;
}

export interface Warehouse {
  id: string;
  name: string;
  capacity: number;
  fixedCost: number;
  handlingCost: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, unknown>;
}

export interface DemandForecast {
  productId: string;
  period: string;  // ISO time
  quantity: number;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface InventoryProblem extends MCP {
  model: {
    variables: Variable[];
    constraints: Constraint[];
    objective: Objective | Objective[];
    inventory: {
      products: Product[];
      warehouses: Warehouse[];
      demandForecasts: DemandForecast[];
      safetyStockPolicy?: {
        type: 'fixed' | 'dynamic';
        parameters: Record<string, number>;
      };
    };
  };
}

// Production Planning Types
export interface Machine {
  id: string;
  name: string;
  setupTime: number;  // minutes
  processingRate: number;  // units per hour
  maintenanceSchedule?: Array<{
    start: string;  // ISO time
    end: string;    // ISO time
  }>;
  capabilities: string[];
  costPerHour: number;
  metadata?: Record<string, unknown>;
}

export interface Material {
  id: string;
  name: string;
  cost: number;
  leadTime: number;  // days
  minOrderQuantity?: number;
  supplier?: string;
  metadata?: Record<string, unknown>;
}

export interface ProductionOrder {
  id: string;
  productId: string;
  quantity: number;
  dueDate: string;  // ISO time
  priority: number;
  routingSteps: Array<{
    machineType: string;
    duration: number;
    materials: Array<{
      materialId: string;
      quantity: number;
    }>;
  }>;
  metadata?: Record<string, unknown>;
}

export interface ProductionProblem extends MCP {
  model: {
    variables: Variable[];
    constraints: Constraint[];
    objective: Objective | Objective[];
    production: {
      machines: Machine[];
      materials: Material[];
      orders: ProductionOrder[];
      capacityConstraints?: Record<string, number>;
      qualityRequirements?: Record<string, unknown>;
    };
  };
}

// Update ProblemType in MCPTypes.ts to include new types
export type ExtendedProblemType = 
  | 'vehicle_routing'
  | 'fleet_scheduling'
  | 'resource_scheduling'
  | 'inventory_optimization'
  | 'production_planning'
  | 'custom'; 