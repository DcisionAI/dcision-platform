import { MCP, Variable, Constraint, Objective } from './core';

export interface Location {
  id: string;
  latitude: number;
  longitude: number;
  address?: string;
  demand?: number;
  timeWindows?: Array<{
    start: string;
    end: string;
  }>;
  metadata?: Record<string, any>;
}

export interface VehicleType {
  id: string;
  name: string;
  capacity: number;
  maxDistance?: number;
  maxDuration?: number;
  costPerKm: number;
  costPerHour: number;
  features?: string[];
  startLocation?: Location;
  endLocation?: Location;
  breaks?: Array<{
    start: string;
    duration: number;
  }>;
  metadata?: Record<string, any>;
}

export interface FleetProblem extends MCP {
  model: {
    variables: Variable[];
    constraints: Constraint[];
    objective: Objective | Objective[];
    fleet: {
      vehicles: VehicleType[];
      depots: Location[];
      customers: Location[];
      constraints?: {
        maxRouteDistance?: number;
        maxServiceTime?: number;
        requiredVehicleFeatures?: string[];
        zoneRestrictions?: Array<{
          zoneId: string;
          allowedDepots: string[];
          allowedVehicles: string[];
        }>;
      };
    };
  };
} 