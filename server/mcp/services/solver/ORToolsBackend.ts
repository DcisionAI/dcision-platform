import { MCP, ProblemType } from '../../types';
import { ModelSolution } from '../../agents/ModelRunnerAgent';
import { SolverBackend, SolverConfig } from './interfaces';
import axios from 'axios';

export class ORToolsBackend implements SolverBackend {
  private serviceUrl: string;
  private isMock: boolean;
  private config?: SolverConfig;
  
  /**
   * Returns the full solve endpoint URL.
   * If ORTools_SOLVE_URL is set in env, use that; otherwise default to /solve/vehicle-assignment on serviceUrl.
   */
  private getSolveUrl(): string {
    if (process.env.ORTools_SOLVE_URL) {
      return process.env.ORTools_SOLVE_URL;
    }
    return `${this.serviceUrl}/solve/vehicle-assignment`;
  }

  constructor(serviceUrl: string = 'http://localhost:8080', isMock: boolean = false) {
    this.serviceUrl = serviceUrl;
    this.isMock = isMock;
  }

  async initialize(config: SolverConfig): Promise<void> {
    this.config = config;
  }

  async validateModel(model: any): Promise<boolean> {
    // Basic validation - can be enhanced
    return model && model.variables && model.constraints;
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

      // Determine the full solver URL (override ORTools_SOLVE_URL or use default)
      const solveUrl = this.getSolveUrl();
      console.log(`[ORToolsBackend] POST → ${solveUrl}`);
      console.log(`[ORToolsBackend] Payload: ${JSON.stringify(data)}`);
      const response = await axios.post(solveUrl, data);
      return response.data;
    } catch (error: any) {
      // If this is an HTTP error from the solver service, log and include response details
      if (axios.isAxiosError(error) && error.response) {
        console.error('[ORToolsBackend] Solver validation error:', error.response.status, error.response.data);
        throw new Error(`Solver responded with status ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      }
      console.error('[ORToolsBackend] Failed to solve model:', error);
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

  // Public: format raw model components and MCP into solver-specific request payload
  public formatRequestData(model: any, mcp: MCP): any {
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

      // Build solver request payload for Vehicle Assignment Problem (VAP)
      return {
        type: 'vap',
        vehicles: fleet.vehicles.map((v: any, index: number) => ({
          id: typeof v.id === 'number' ? v.id : index + 1,
          type: 'standard',
          capacity: v.capacity,
          operating_cost: v.costPerKm ?? v.operating_cost ?? 1.0,
          maintenance_interval: v.maintenance_interval ?? 1000,
          fuel_efficiency: v.fuel_efficiency ?? 1.0,
          name: v.name || `Vehicle ${index + 1}`,
          skills: v.required_skills ?? [],
          max_hours: v.max_route_time_hours ?? v.max_hours ?? 8.0,
          hourly_rate: v.hourly_rate ?? 0,
          availability: [{
            start_time: Math.floor((fleet.depots[0]?.timeWindows?.[0]?.start ?? 0)),
            end_time: Math.floor((fleet.depots[0]?.timeWindows?.[0]?.end ?? 86400))
          }]
        })),
        // Map each customer to a task, using its location index as the task ID
        tasks: fleet.customers.map((c: any) => {
          const locIdx = locationIdMap.get(c.id) ?? 0;
          return {
            id: locIdx,
            location: {
              id: locIdx,
              latitude: c.latitude,
              longitude: c.longitude,
              name: c.name ?? String(c.id)
            },
            demand: c.demand ?? 0,
            duration: c.duration ?? 30,
            required_skills: c.required_skills ?? [],
            priority: c.priority ?? 1,
            time_window: c.timeWindows?.[0]
              ? [
                  Math.floor(new Date(c.timeWindows[0].start).getTime() / 1000),
                  Math.floor(new Date(c.timeWindows[0].end).getTime() / 1000)
                ]
              : []
          };
        }),
        locations: allLocations.map((loc: any, index: number) => {
          const latitude = loc.latitude ?? loc.lat;
          const longitude = loc.longitude ?? loc.lon;
          const name = typeof loc.name === 'string'
            ? loc.name
            : String(loc.id ?? index);
          return {
            id: index,
            latitude,
            longitude,
            name
          };
        }),
        distance_matrix: distanceMatrix,
        constraints: {
          max_distance: Math.max(...fleet.vehicles.map((v: any) => v.maxDistance ?? 1000)),
          max_working_hours: 8 * 3600,
          vehicle_availability: fleet.vehicles.map(() => ({
            start_time: Math.floor((fleet.depots[0]?.timeWindows?.[0]?.start ?? 0)),
            end_time: Math.floor((fleet.depots[0]?.timeWindows?.[0]?.end ?? 86400))
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

  getCapabilities(): string[] {
    return [
      'vehicle_routing',
      'bin_packing',
      'job_shop',
      'resource_scheduling'
    ];
  }

  async cleanup(): Promise<void> {
    this.config = undefined;
  }
} 