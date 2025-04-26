import { FleetConstraintFactory } from './FleetConstraints';

describe('FleetConstraints', () => {
  describe('CapacityConstraint', () => {
    it('should create a capacity constraint with default priority', () => {
      const constraint = FleetConstraintFactory.capacity(1000).build();
      expect(constraint).toEqual({
        type: 'capacity',
        description: 'Total load must not exceed 1000',
        field: 'total_load',
        operator: 'lte',
        value: 1000,
        priority: 'must'
      });
    });

    it('should create a capacity constraint with custom priority and penalty', () => {
      const constraint = FleetConstraintFactory.capacity(1000)
        .withPriority('should')
        .withPenalty(100)
        .build();
      expect(constraint).toEqual({
        type: 'capacity',
        description: 'Total load must not exceed 1000',
        field: 'total_load',
        operator: 'lte',
        value: 1000,
        priority: 'should',
        penalty: 100
      });
    });
  });

  describe('TimeWindowConstraint', () => {
    it('should create a time window constraint with default priority', () => {
      const constraint = FleetConstraintFactory.timeWindow('09:00', '17:00').build();
      expect(constraint).toEqual({
        type: 'time_window',
        description: 'Service must be performed between 09:00 and 17:00',
        field: 'service_time',
        operator: 'between',
        value: ['09:00', '17:00'],
        priority: 'must'
      });
    });

    it('should create a time window constraint with custom priority and penalty', () => {
      const constraint = FleetConstraintFactory.timeWindow('09:00', '17:00')
        .withPriority('nice_to_have')
        .withPenalty(50)
        .build();
      expect(constraint).toEqual({
        type: 'time_window',
        description: 'Service must be performed between 09:00 and 17:00',
        field: 'service_time',
        operator: 'between',
        value: ['09:00', '17:00'],
        priority: 'nice_to_have',
        penalty: 50
      });
    });
  });

  describe('DistanceConstraint', () => {
    it('should create a distance constraint with default priority', () => {
      const constraint = FleetConstraintFactory.distance(500).build();
      expect(constraint).toEqual({
        type: 'distance',
        description: 'Total route distance must not exceed 500 km',
        field: 'route_distance',
        operator: 'lte',
        value: 500,
        priority: 'must'
      });
    });
  });

  describe('SkillRequirementConstraint', () => {
    it('should create a skill requirement constraint with default priority', () => {
      const skills = ['forklift', 'hazmat'];
      const constraint = FleetConstraintFactory.skillRequirement(skills).build();
      expect(constraint).toEqual({
        type: 'skill_requirement',
        description: 'Driver must have skills: forklift, hazmat',
        field: 'driver_skills',
        operator: 'in',
        value: skills,
        priority: 'must'
      });
    });
  });

  describe('VehicleCompatibilityConstraint', () => {
    it('should create a vehicle compatibility constraint with default priority', () => {
      const features = ['refrigerated', 'lift_gate'];
      const constraint = FleetConstraintFactory.vehicleCompatibility(features).build();
      expect(constraint).toEqual({
        type: 'vehicle_compatibility',
        description: 'Vehicle must have features: refrigerated, lift_gate',
        field: 'vehicle_features',
        operator: 'in',
        value: features,
        priority: 'must'
      });
    });
  });

  describe('ServiceDurationConstraint', () => {
    it('should create a service duration constraint with default priority', () => {
      const constraint = FleetConstraintFactory.serviceDuration(120).build();
      expect(constraint).toEqual({
        type: 'service_duration',
        description: 'Service duration must not exceed 120 minutes',
        field: 'service_duration',
        operator: 'lte',
        value: 120,
        priority: 'must'
      });
    });
  });

  describe('BreakTimeConstraint', () => {
    it('should create a break time constraint with default priority', () => {
      const constraint = FleetConstraintFactory.breakTime(30, 240).build();
      expect(constraint).toEqual({
        type: 'break_time',
        description: '30 minute break required after 240 minutes of work',
        field: 'continuous_working_time',
        operator: 'lte',
        value: 240,
        parameters: {
          breakDuration: 30
        },
        priority: 'must'
      });
    });

    it('should create a break time constraint with custom priority and penalty', () => {
      const constraint = FleetConstraintFactory.breakTime(30, 240)
        .withPriority('should')
        .withPenalty(200)
        .build();
      expect(constraint).toEqual({
        type: 'break_time',
        description: '30 minute break required after 240 minutes of work',
        field: 'continuous_working_time',
        operator: 'lte',
        value: 240,
        parameters: {
          breakDuration: 30
        },
        priority: 'should',
        penalty: 200
      });
    });
  });
}); 