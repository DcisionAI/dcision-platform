import { createFleetSchedulingTemplate, ShiftPattern, Driver } from './FleetSchedulingTemplate';
import { VehicleType, Location } from '../MCPTypes';

describe('FleetSchedulingTemplate', () => {
  const mockVehicles: VehicleType[] = [
    {
      id: '1',
      capacity: 1000,
      costPerKm: 2.5,
      maxDistance: 500,
      features: ['delivery', 'heavy_vehicle'],
      metadata: {
        costPerHour: 50,
        maxDuration: 12
      }
    }
  ];

  const mockDepots: Location[] = [
    {
      id: '1',
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Main St',
      timeWindows: [{
        start: '08:00',
        end: '18:00'
      }],
      metadata: {
        name: 'Main Depot'
      }
    }
  ];

  const mockCustomers: Location[] = [
    {
      id: '1',
      latitude: 37.7899,
      longitude: -122.4000,
      address: '456 Market St',
      timeWindows: [{
        start: '09:00',
        end: '17:00'
      }],
      serviceTime: 30,
      metadata: {
        name: 'Customer A'
      }
    }
  ];

  const mockDrivers: Driver[] = [
    {
      id: '1',
      name: 'John Doe',
      skills: ['delivery', 'heavy_vehicle'],
      preferredShifts: ['morning'],
      maxHoursPerWeek: 40,
      maxHoursPerDay: 8,
      costPerHour: 25,
      homeLocation: {
        id: 'home1',
        latitude: 37.7700,
        longitude: -122.4300,
        address: '789 Oak St',
        metadata: {
          name: 'John\'s Home'
        }
      }
    }
  ];

  const mockShifts: ShiftPattern[] = [
    {
      id: 'morning',
      name: 'Morning Shift',
      startTime: '08:00',
      endTime: '16:00',
      breakTimes: [{
        start: '12:00',
        end: '13:00'
      }],
      daysOfWeek: [1, 2, 3, 4, 5]
    }
  ];

  it('should create a valid fleet scheduling template', () => {
    const template = createFleetSchedulingTemplate(
      'test-session-123',
      mockVehicles,
      mockDepots,
      mockCustomers,
      mockDrivers,
      mockShifts
    );

    // Check basic structure
    expect(template.sessionId).toBe('test-session-123');
    expect(template.version).toBe('1.0.0');
    expect(template.status).toBe('draft');
    expect(template.created).toBeDefined();
    expect(template.lastModified).toBeDefined();

    // Check model
    expect(template.model.variables).toHaveLength(3);
    expect(template.model.constraints).toHaveLength(6);
    expect(template.model.objective.type).toBe('minimize');
    expect(template.model.fleet.vehicles).toEqual(mockVehicles);
    expect(template.model.fleet.scheduling.drivers).toEqual(mockDrivers);
    expect(template.model.fleet.scheduling.shifts).toEqual(mockShifts);

    // Check context
    expect(template.context.problemType).toBe('fleet_scheduling');
    expect(template.context.industry).toBe('logistics');
    expect(template.context.environment.workingDays).toEqual([1, 2, 3, 4, 5]);

    // Check protocol
    expect(template.protocol.steps).toHaveLength(5);
    expect(template.protocol.allowPartialSolutions).toBe(false);
    expect(template.protocol.explainabilityEnabled).toBe(true);
    expect(template.protocol.humanInTheLoop.required).toBe(true);
  });

  it('should validate driver assignments', () => {
    const template = createFleetSchedulingTemplate(
      'test-session-123',
      mockVehicles,
      mockDepots,
      mockCustomers,
      mockDrivers,
      mockShifts
    );

    const driverAssignmentVar = template.model.variables.find(v => v.name === 'driver_assignment');
    expect(driverAssignmentVar).toBeDefined();
    expect(driverAssignmentVar?.domain).toEqual([1]); // Based on mockDrivers IDs
  });

  it('should validate shift assignments', () => {
    const template = createFleetSchedulingTemplate(
      'test-session-123',
      mockVehicles,
      mockDepots,
      mockCustomers,
      mockDrivers,
      mockShifts
    );

    const shiftAssignmentVar = template.model.variables.find(v => v.name === 'shift_assignment');
    expect(shiftAssignmentVar).toBeDefined();
    expect(shiftAssignmentVar?.type).toBe('integer');
  });

  it('should include all required constraints', () => {
    const template = createFleetSchedulingTemplate(
      'test-session-123',
      mockVehicles,
      mockDepots,
      mockCustomers,
      mockDrivers,
      mockShifts
    );

    const constraintTypes = template.model.constraints.map(c => c.type);
    expect(constraintTypes).toContain('driver_availability');
    expect(constraintTypes).toContain('driver_hours');
    expect(constraintTypes).toContain('driver_skills');
    expect(constraintTypes).toContain('shift_coverage');
    expect(constraintTypes).toContain('rest_period');
    expect(constraintTypes).toContain('preferred_shifts');
  });
}); 