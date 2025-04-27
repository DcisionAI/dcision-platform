import { Constraint } from '../types';

export interface ConstraintBuilder {
  build(): Constraint;
}

export class CapacityConstraintBuilder implements ConstraintBuilder {
  private maxCapacity: number;
  private priority: 'must' | 'should' | 'nice_to_have' = 'must';
  private penalty?: number;

  constructor(maxCapacity: number) {
    this.maxCapacity = maxCapacity;
  }

  withPriority(priority: 'must' | 'should' | 'nice_to_have'): this {
    this.priority = priority;
    return this;
  }

  withPenalty(penalty: number): this {
    this.penalty = penalty;
    return this;
  }

  build(): Constraint {
    return {
      type: 'capacity',
      description: `Total load must not exceed ${this.maxCapacity}`,
      field: 'total_load',
      operator: 'lte',
      value: this.maxCapacity,
      priority: this.priority,
      penalty: this.penalty
    };
  }
}

export class TimeWindowConstraintBuilder implements ConstraintBuilder {
  private start: string;
  private end: string;
  private priority: 'must' | 'should' | 'nice_to_have' = 'must';
  private penalty?: number;

  constructor(start: string, end: string) {
    this.start = start;
    this.end = end;
  }

  withPriority(priority: 'must' | 'should' | 'nice_to_have'): this {
    this.priority = priority;
    return this;
  }

  withPenalty(penalty: number): this {
    this.penalty = penalty;
    return this;
  }

  build(): Constraint {
    return {
      type: 'time_window',
      description: `Service must be performed between ${this.start} and ${this.end}`,
      field: 'service_time',
      operator: 'between',
      value: [this.start, this.end],
      priority: this.priority,
      penalty: this.penalty
    };
  }
}

export class DistanceConstraintBuilder implements ConstraintBuilder {
  private maxDistance: number;
  private priority: 'must' | 'should' | 'nice_to_have' = 'must';
  private penalty?: number;

  constructor(maxDistance: number) {
    this.maxDistance = maxDistance;
  }

  withPriority(priority: 'must' | 'should' | 'nice_to_have'): this {
    this.priority = priority;
    return this;
  }

  withPenalty(penalty: number): this {
    this.penalty = penalty;
    return this;
  }

  build(): Constraint {
    return {
      type: 'distance',
      description: `Total route distance must not exceed ${this.maxDistance} km`,
      field: 'route_distance',
      operator: 'lte',
      value: this.maxDistance,
      priority: this.priority,
      penalty: this.penalty
    };
  }
}

export class SkillRequirementConstraintBuilder implements ConstraintBuilder {
  private requiredSkills: string[];
  private priority: 'must' | 'should' | 'nice_to_have' = 'must';
  private penalty?: number;

  constructor(requiredSkills: string[]) {
    this.requiredSkills = requiredSkills;
  }

  withPriority(priority: 'must' | 'should' | 'nice_to_have'): this {
    this.priority = priority;
    return this;
  }

  withPenalty(penalty: number): this {
    this.penalty = penalty;
    return this;
  }

  build(): Constraint {
    return {
      type: 'skill_requirement',
      description: `Driver must have skills: ${this.requiredSkills.join(', ')}`,
      field: 'driver_skills',
      operator: 'in',
      value: this.requiredSkills,
      priority: this.priority,
      penalty: this.penalty
    };
  }
}

export class VehicleCompatibilityConstraintBuilder implements ConstraintBuilder {
  private requiredFeatures: string[];
  private priority: 'must' | 'should' | 'nice_to_have' = 'must';
  private penalty?: number;

  constructor(requiredFeatures: string[]) {
    this.requiredFeatures = requiredFeatures;
  }

  withPriority(priority: 'must' | 'should' | 'nice_to_have'): this {
    this.priority = priority;
    return this;
  }

  withPenalty(penalty: number): this {
    this.penalty = penalty;
    return this;
  }

  build(): Constraint {
    return {
      type: 'vehicle_compatibility',
      description: `Vehicle must have features: ${this.requiredFeatures.join(', ')}`,
      field: 'vehicle_features',
      operator: 'in',
      value: this.requiredFeatures,
      priority: this.priority,
      penalty: this.penalty
    };
  }
}

export class ServiceDurationConstraintBuilder implements ConstraintBuilder {
  private maxDuration: number;
  private priority: 'must' | 'should' | 'nice_to_have' = 'must';
  private penalty?: number;

  constructor(maxDuration: number) {
    this.maxDuration = maxDuration;
  }

  withPriority(priority: 'must' | 'should' | 'nice_to_have'): this {
    this.priority = priority;
    return this;
  }

  withPenalty(penalty: number): this {
    this.penalty = penalty;
    return this;
  }

  build(): Constraint {
    return {
      type: 'service_duration',
      description: `Service duration must not exceed ${this.maxDuration} minutes`,
      field: 'service_duration',
      operator: 'lte',
      value: this.maxDuration,
      priority: this.priority,
      penalty: this.penalty
    };
  }
}

export class BreakTimeConstraintBuilder implements ConstraintBuilder {
  private breakDuration: number;
  private maxWorkingTime: number;
  private priority: 'must' | 'should' | 'nice_to_have' = 'must';
  private penalty?: number;

  constructor(breakDuration: number, maxWorkingTime: number) {
    this.breakDuration = breakDuration;
    this.maxWorkingTime = maxWorkingTime;
  }

  withPriority(priority: 'must' | 'should' | 'nice_to_have'): this {
    this.priority = priority;
    return this;
  }

  withPenalty(penalty: number): this {
    this.penalty = penalty;
    return this;
  }

  build(): Constraint {
    return {
      type: 'break_time',
      description: `${this.breakDuration} minute break required after ${this.maxWorkingTime} minutes of work`,
      field: 'continuous_working_time',
      operator: 'lte',
      value: this.maxWorkingTime,
      parameters: {
        breakDuration: this.breakDuration
      },
      priority: this.priority,
      penalty: this.penalty
    };
  }
}

export class FleetConstraintFactory {
  static capacity(maxCapacity: number): CapacityConstraintBuilder {
    return new CapacityConstraintBuilder(maxCapacity);
  }

  static timeWindow(start: string, end: string): TimeWindowConstraintBuilder {
    return new TimeWindowConstraintBuilder(start, end);
  }

  static distance(maxDistance: number): DistanceConstraintBuilder {
    return new DistanceConstraintBuilder(maxDistance);
  }

  static skillRequirement(skills: string[]): SkillRequirementConstraintBuilder {
    return new SkillRequirementConstraintBuilder(skills);
  }

  static vehicleCompatibility(features: string[]): VehicleCompatibilityConstraintBuilder {
    return new VehicleCompatibilityConstraintBuilder(features);
  }

  static serviceDuration(maxDuration: number): ServiceDurationConstraintBuilder {
    return new ServiceDurationConstraintBuilder(maxDuration);
  }

  static breakTime(breakDuration: number, maxWorkingTime: number): BreakTimeConstraintBuilder {
    return new BreakTimeConstraintBuilder(breakDuration, maxWorkingTime);
  }
} 