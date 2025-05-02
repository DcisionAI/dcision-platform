import { MCP, ProblemType } from '../types';
import { ModelSolution } from '../agents/ModelRunnerAgent';
import { SolverBackend } from './ORToolsSolver';
import axios from 'axios';

export class ORToolsBackend implements SolverBackend {
  private serviceUrl: string;
  private isMock: boolean;

  constructor(serviceUrl: string = 'http://localhost:8080', isMock: boolean = false) {
    this.serviceUrl = serviceUrl;
    this.isMock = isMock;
  }

  async buildModel(data: any): Promise<any> {
    try {
      if (this.isMock) {
        return {
          success: true,
          model: {
            variables: [],
            constraints: [],
            objective: { type: 'minimize', expression: 'total_distance' }
          }
        };
      }

      const response = await axios.post(`${this.serviceUrl}/build`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to build model:', error);
      throw error;
    }
  }

  async solve(data: any): Promise<any> {
    try {
      if (this.isMock) {
        return {
          success: true,
          solution: {
            assignments: [
              { vehicle_id: 1, task_ids: [1, 2] },
              { vehicle_id: 2, task_ids: [3, 4] }
            ],
            total_distance: 10.5,
            total_time: 120
          }
        };
      }

      console.log('Sending request to:', `${this.serviceUrl}/solve/vehicle-assignment`);
      console.log('Request data:', JSON.stringify(data, null, 2));
      
      const response = await axios.post(`${this.serviceUrl}/solve/vehicle-assignment`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to solve model:', error);
      throw error;
    }
  }

  private getSolverEndpoint(problemType: ProblemType): string {
    const endpointMap: Record<ProblemType, string> = {
      'vehicle_routing': '/solve/vehicle-assignment',
      'fleet_scheduling': '/solve/fleet-mix',
      'multi_depot_routing': '/solve/vehicle-assignment',
      'pickup_delivery': '/solve/vehicle-assignment',
      'resource_scheduling': '/solve/employee-schedule',
      'nurse_scheduling': '/solve/employee-schedule',
      'job_shop': '/solve/task-assignment',
      'flow_shop': '/solve/task-assignment',
      'project_scheduling': '/solve/task-assignment',
      'bin_packing': '/solve/task-assignment',
      'inventory_optimization': '/solve/workforce-capacity',
      'production_planning': '/solve/task-assignment',
      'traveling_salesman': '/solve/vehicle-assignment',
      'assignment': '/solve/task-assignment',
      'custom': '/solve/task-assignment'
    };
    return endpointMap[problemType] || '/solve/task-assignment';
  }

  private formatRequestData(model: any, mcp: MCP): any {
    if (mcp.context.problemType === 'vehicle_routing') {
      // Format for VehicleAssignmentRequest
      const fleet = model.fleet || {};
      const allLocations = [...fleet.depots, ...fleet.customers];
      
      // Create a map of location IDs
      const locationIdMap = new Map(allLocations.map((loc: any, index: number) => [loc.id, index]));

      // Format the distance matrix as a 2D array
      const distances = model.data?.distances || [];
      const numLocations = allLocations.length;
      const distanceMatrix: number[][] = Array(numLocations).fill(0).map(() => Array(numLocations).fill(0));
      
      distances.forEach((fromLoc: any) => {
        const fromIndex = locationIdMap.get(fromLoc.from_id);
        if (fromIndex !== undefined) {
          fromLoc.distances.forEach((toDist: any) => {
            const toIndex = locationIdMap.get(toDist.to_id);
            if (toIndex !== undefined) {
              distanceMatrix[fromIndex][toIndex] = toDist.distance;
            }
          });
        }
      });

      return {
        type: 'vap',  // Vehicle Assignment Problem
        vehicles: fleet.vehicles.map((v: any, index: number) => ({
          id: index + 1,
          type: 'standard',
          capacity: v.capacity,
          operating_cost: v.costPerKm || 1.0,
          maintenance_interval: 1000,
          fuel_efficiency: 1.0,
          name: `Vehicle ${index + 1}`,
          skills: [],
          max_hours: 8.0,
          hourly_rate: 50.0,
          availability: [{
            start_time: new Date(fleet.depots[0].timeWindows?.[0]?.start || '2024-03-20T08:00:00Z').getTime() / 1000,
            end_time: new Date(fleet.depots[0].timeWindows?.[0]?.end || '2024-03-20T18:00:00Z').getTime() / 1000
          }]
        })),
        tasks: fleet.customers.map((c: any, index: number) => ({
          id: index + 1,
          location: {
            id: locationIdMap.get(c.id),
            latitude: c.latitude,
            longitude: c.longitude,
            name: c.id
          },
          duration: 30, // Default service time in minutes
          required_skills: [],
          priority: 1,
          time_window: c.timeWindows?.[0] ? [
            new Date(c.timeWindows[0].start).getTime() / 1000,
            new Date(c.timeWindows[0].end).getTime() / 1000
          ] : []
        })),
        locations: allLocations.map((loc: any, index: number) => ({
          id: index,
          latitude: loc.latitude,
          longitude: loc.longitude,
          name: loc.id
        })),
        distance_matrix: distanceMatrix,
        constraints: {
          max_distance: Math.max(...fleet.vehicles.map((v: any) => v.maxDistance || 1000)),
          max_working_hours: 8 * 60, // 8 hours in minutes
          vehicle_availability: fleet.vehicles.map(() => ({
            start_time: new Date(fleet.depots[0].timeWindows?.[0]?.start || '2024-03-20T08:00:00Z').getTime() / 1000,
            end_time: new Date(fleet.depots[0].timeWindows?.[0]?.end || '2024-03-20T18:00:00Z').getTime() / 1000
          }))
        }
      };
    }
    
    // Default format for other problem types
    return {
      model,
      mcp,
      modelType: this.getModelType(mcp.context.problemType)
    };
  }

  private getModelType(problemType: ProblemType): 'CP-SAT' | 'VRP' | 'MIP' {
    const modelMap: Record<ProblemType, 'CP-SAT' | 'VRP' | 'MIP'> = {
      'job_shop': 'CP-SAT',
      'flow_shop': 'CP-SAT',
      'nurse_scheduling': 'CP-SAT',
      'resource_scheduling': 'CP-SAT',
      'project_scheduling': 'CP-SAT',
      'vehicle_routing': 'VRP',
      'fleet_scheduling': 'VRP',
      'multi_depot_routing': 'VRP',
      'pickup_delivery': 'VRP',
      'traveling_salesman': 'VRP',
      'bin_packing': 'MIP',
      'inventory_optimization': 'MIP',
      'production_planning': 'MIP',
      'assignment': 'MIP',
      'custom': 'CP-SAT'
    };
    return modelMap[problemType] || 'CP-SAT';
  }
} 