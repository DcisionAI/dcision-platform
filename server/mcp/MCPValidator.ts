import { 
  MCP, 
  FleetProblem, 
  Variable, 
  Constraint, 
  Objective,
  ProtocolStep,
  ProblemType,
  IndustryVertical,
  VehicleType,
  Location,
  StepAction
} from './MCPTypes';
import { 
  SchedulingProblem,
  InventoryProblem,
  ProductionProblem,
  Resource,
  Task,
  Product,
  Warehouse,
  Machine,
  Material,
  ProductionOrder
} from './OptimizationTypes';
import { mcpSchema } from './MCPSchema';
import Ajv, { ErrorObject } from 'ajv/dist/2020';
import ajvFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';
import { ValidationError } from '../errors/ValidationError';

export class MCPValidator {
  private readonly ajv: Ajv;
  private readonly VALID_PROBLEM_TYPES: ProblemType[] = ['vehicle_routing', 'fleet_scheduling', 'custom'];
  private readonly VALID_INDUSTRY_VERTICALS: IndustryVertical[] = ['logistics', 'delivery', 'field_service', 'custom'];
  private readonly REQUIRED_FLEET_FIELDS = ['vehicles', 'depots', 'customers'] as const;
  private readonly VALID_STEP_ACTIONS: StepAction[] = [
    'collect_data',
    'enrich_data',
    'build_model',
    'solve_model',
    'explain_solution',
    'human_approval',
    'custom'
  ];

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    ajvFormats(this.ajv);
    ajvErrors(this.ajv);
    this.ajv.compile(mcpSchema);
  }

  /**
   * Validates a complete MCP object
   */
  public validate(mcp: MCP): ValidationError[] {
    const errors: ValidationError[] = [];

    try {
      // First validate against JSON Schema
      const validate = this.ajv.compile(mcpSchema);
      if (!validate(mcp)) {
        const schemaErrors = validate.errors || [];
        errors.push(...schemaErrors.map((err: ErrorObject) => 
          new ValidationError(`JSON Schema validation error: ${err.message} at ${err.instancePath}`)
        ));
        return errors;
      }

      // Then perform additional business logic validation
      this.validateBusinessLogic(mcp, errors);

      // If it's a fleet problem, validate fleet-specific business logic
      if (mcp.context.problemType === 'vehicle_routing' || mcp.context.problemType === 'fleet_scheduling') {
        const fleetProblem = mcp as unknown as FleetProblem;
        if (this.isFleetProblem(fleetProblem)) {
          this.validateFleetBusinessLogic(fleetProblem, errors);
        } else {
          errors.push(new ValidationError('Invalid fleet problem structure'));
        }
      }

      // Problem-specific validation
      if (this.isSchedulingProblem(mcp)) {
        const schedulingErrors = this.validateSchedulingProblem(mcp);
        errors.push(...schedulingErrors.map(msg => new ValidationError(msg)));
      } else if (this.isInventoryProblem(mcp)) {
        const inventoryErrors = this.validateInventoryProblem(mcp);
        errors.push(...inventoryErrors.map(msg => new ValidationError(msg)));
      } else if (this.isProductionProblem(mcp)) {
        const productionErrors = this.validateProductionProblem(mcp);
        errors.push(...productionErrors.map(msg => new ValidationError(msg)));
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push(error);
      } else {
        errors.push(new ValidationError('Unexpected validation error'));
      }
    }

    return errors;
  }

  /**
   * Validates business logic that can't be expressed in JSON Schema
   */
  private validateBusinessLogic(mcp: MCP, errors: ValidationError[]): void {
    // Validate timestamps
    const created = new Date(mcp.created);
    const lastModified = new Date(mcp.lastModified);

    if (lastModified < created) {
      errors.push(new ValidationError('lastModified cannot be before created'));
    }

    // Validate that protocol steps are in logical order
    this.validateProtocolStepOrder(mcp.protocol.steps, errors);
  }

  /**
   * Validates fleet-specific business logic
   */
  private validateFleetBusinessLogic(fleetProblem: FleetProblem, errors: ValidationError[]): void {
    const fleet = (fleetProblem.model as FleetProblem['model']).fleet;
    
    // Validate that each customer has at least one vehicle that can service it
    fleet.customers.forEach(customer => {
      const canBeServiced = fleet.vehicles.some(vehicle => {
        if (!vehicle.maxDistance) return true;
        
        // Find nearest depot
        const nearestDepot = fleet.depots.reduce((nearest, depot) => {
          const distance = this.calculateDistance(depot, customer);
          return distance < nearest ? distance : nearest;
        }, Infinity);

        // Check if vehicle can make round trip
        return nearestDepot * 2 <= vehicle.maxDistance;
      });

      if (!canBeServiced) {
        errors.push(new ValidationError(
          `Customer ${customer.id} cannot be serviced by any vehicle due to distance constraints`
        ));
      }
    });

    // Validate total fleet capacity vs total customer demand (if demand is specified)
    const totalCapacity = fleet.vehicles.reduce((sum, v) => sum + v.capacity, 0);
    const totalDemand = fleet.customers.reduce((sum, c) => sum + (c.demand || 0), 0);
    
    if (totalDemand > totalCapacity) {
      errors.push(new ValidationError(
        `Total fleet capacity (${totalCapacity}) is insufficient for total customer demand (${totalDemand})`
      ));
    }
  }

  /**
   * Validates that protocol steps are in a logical order
   */
  private validateProtocolStepOrder(steps: ProtocolStep[], errors: ValidationError[]): void {
    const stepOrder = {
      'collect_data': 0,
      'enrich_data': 1,
      'validate_constraints': 2,
      'validate_network': 3,
      'build_model': 4,
      'solve_model': 5,
      'explain_solution': 6,
      'human_review': 7,
      'human_approval': 8,
      'custom': -1
    } as const;

    let lastStepOrder = -1;
    steps.forEach(step => {
      if (step.action !== 'custom') {
        const currentOrder = stepOrder[step.action as keyof typeof stepOrder];
        if (currentOrder < lastStepOrder) {
          errors.push(new ValidationError(
            `Invalid step order: ${step.action} cannot come after previous steps`
          ));
        }
        lastStepOrder = currentOrder;
      }
    });
  }

  /**
   * Calculates the distance between two locations using the Haversine formula
   */
  private calculateDistance(loc1: Location, loc2: Location): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(loc2.latitude - loc1.latitude);
    const dLon = this.toRad(loc2.longitude - loc1.longitude);
    const lat1 = this.toRad(loc1.latitude);
    const lat2 = this.toRad(loc2.latitude);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * Math.PI / 180;
  }

  /**
   * Type guard to check if an MCP object is a valid FleetProblem
   */
  private isFleetProblem(mcp: unknown): mcp is FleetProblem {
    if (!mcp || typeof mcp !== 'object') return false;
    
    const model = (mcp as FleetProblem).model;
    if (!model || typeof model !== 'object') return false;
    
    const fleet = model.fleet;
    if (!fleet || typeof fleet !== 'object') return false;
    
    return Array.isArray(fleet.vehicles) && 
           Array.isArray(fleet.depots) && 
           Array.isArray(fleet.customers);
  }

  private isSchedulingProblem(mcp: MCP): mcp is SchedulingProblem {
    return (
      mcp.context.problemType === 'resource_scheduling' &&
      'scheduling' in (mcp.model as any) &&
      (mcp.model as any).scheduling?.resources !== undefined &&
      (mcp.model as any).scheduling?.tasks !== undefined
    );
  }

  private isInventoryProblem(mcp: MCP): mcp is InventoryProblem {
    return (
      mcp.context.problemType === 'inventory_optimization' &&
      'inventory' in (mcp.model as any) &&
      (mcp.model as any).inventory?.products !== undefined &&
      (mcp.model as any).inventory?.warehouses !== undefined
    );
  }

  private isProductionProblem(mcp: MCP): mcp is ProductionProblem {
    return (
      mcp.context.problemType === 'production_planning' &&
      'production' in (mcp.model as any) &&
      (mcp.model as any).production?.machines !== undefined &&
      (mcp.model as any).production?.materials !== undefined &&
      (mcp.model as any).production?.orders !== undefined
    );
  }

  private validateSchedulingProblem(mcp: SchedulingProblem): string[] {
    const errors: string[] = [];
    
    // Validate resources
    if (!mcp.model.scheduling?.resources?.length) {
      errors.push('Scheduling problem must have at least one resource');
    } else {
      mcp.model.scheduling.resources.forEach((resource: Resource, index: number) => {
        if (!resource.id) errors.push(`Resource at index ${index} must have an id`);
        if (!resource.skills?.length) errors.push(`Resource ${resource.id} must have at least one skill`);
        if (!resource.availability?.length) errors.push(`Resource ${resource.id} must have availability defined`);
      });
    }

    // Validate tasks
    if (!mcp.model.scheduling?.tasks?.length) {
      errors.push('Scheduling problem must have at least one task');
    } else {
      mcp.model.scheduling.tasks.forEach((task: Task, index: number) => {
        if (!task.id) errors.push(`Task at index ${index} must have an id`);
        if (!task.requiredSkills?.length) errors.push(`Task ${task.id} must have required skills`);
        if (task.duration <= 0) errors.push(`Task ${task.id} must have positive duration`);
      });
    }

    return errors;
  }

  private validateInventoryProblem(mcp: InventoryProblem): string[] {
    const errors: string[] = [];
    
    // Validate products
    if (!mcp.model.inventory?.products?.length) {
      errors.push('Inventory problem must have at least one product');
    } else {
      mcp.model.inventory.products.forEach((product: Product, index: number) => {
        if (!product.id) errors.push(`Product at index ${index} must have an id`);
        if (product.unitCost < 0) errors.push(`Product ${product.id} must have non-negative unit cost`);
        if (product.holdingCost < 0) errors.push(`Product ${product.id} must have non-negative holding cost`);
      });
    }

    // Validate warehouses
    if (!mcp.model.inventory?.warehouses?.length) {
      errors.push('Inventory problem must have at least one warehouse');
    } else {
      mcp.model.inventory.warehouses.forEach((warehouse: Warehouse, index: number) => {
        if (!warehouse.id) errors.push(`Warehouse at index ${index} must have an id`);
        if (warehouse.capacity <= 0) errors.push(`Warehouse ${warehouse.id} must have positive capacity`);
      });
    }

    // Validate demand forecasts
    if (!mcp.model.inventory?.demandForecasts?.length) {
      errors.push('Inventory problem must have at least one demand forecast');
    }

    return errors;
  }

  private validateProductionProblem(mcp: ProductionProblem): string[] {
    const errors: string[] = [];
    
    // Validate machines
    if (!mcp.model.production?.machines?.length) {
      errors.push('Production problem must have at least one machine');
    } else {
      mcp.model.production.machines.forEach((machine: Machine, index: number) => {
        if (!machine.id) errors.push(`Machine at index ${index} must have an id`);
        if (machine.processingRate <= 0) errors.push(`Machine ${machine.id} must have positive processing rate`);
        if (!machine.capabilities?.length) errors.push(`Machine ${machine.id} must have at least one capability`);
      });
    }

    // Validate materials
    if (!mcp.model.production?.materials?.length) {
      errors.push('Production problem must have at least one material');
    } else {
      mcp.model.production.materials.forEach((material: Material, index: number) => {
        if (!material.id) errors.push(`Material at index ${index} must have an id`);
        if (material.cost < 0) errors.push(`Material ${material.id} must have non-negative cost`);
      });
    }

    // Validate production orders
    if (!mcp.model.production?.orders?.length) {
      errors.push('Production problem must have at least one order');
    } else {
      mcp.model.production.orders.forEach((order: ProductionOrder, index: number) => {
        if (!order.id) errors.push(`Order at index ${index} must have an id`);
        if (!order.productId) errors.push(`Order ${order.id} must have a product id`);
        if (order.quantity <= 0) errors.push(`Order ${order.id} must have positive quantity`);
        if (!order.routingSteps?.length) errors.push(`Order ${order.id} must have at least one routing step`);
      });
    }

    return errors;
  }
}
