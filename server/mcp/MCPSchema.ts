import { JSONSchema7 } from 'json-schema';

interface ExtendedJSONSchema extends JSONSchema7 {
  errorMessage?: {
    properties?: Record<string, string>;
  };
  if?: ExtendedJSONSchema;
  then?: ExtendedJSONSchema;
}

// Base schemas for common types
const variableSchema: ExtendedJSONSchema = {
  type: 'object',
  required: ['name', 'type', 'description'],
  properties: {
    name: { type: 'string' },
    type: { 
      type: 'string',
      enum: ['integer', 'float', 'boolean', 'string', 'array', 'object']
    },
    description: { type: 'string' }
  }
};

const constraintSchema: ExtendedJSONSchema = {
  type: 'object',
  required: ['type', 'description'],
  properties: {
    type: { 
      type: 'string',
      pattern: '^(route|distance|capacity|time|custom)_.*$'
    },
    description: { type: 'string' }
  },
  errorMessage: {
    properties: {
      type: 'Invalid constraint type: must start with route_, distance_, capacity_, time_, or custom_'
    }
  }
};

const objectiveSchema: ExtendedJSONSchema = {
  type: 'object',
  required: ['type', 'field', 'description'],
  properties: {
    type: { 
      type: 'string',
      enum: ['minimize', 'maximize']
    },
    field: { type: 'string' },
    description: { type: 'string' }
  }
};

const timeWindowSchema: ExtendedJSONSchema = {
  type: 'object',
  required: ['start', 'end'],
  properties: {
    start: { type: 'string', format: 'date-time' },
    end: { type: 'string', format: 'date-time' }
  },
  errorMessage: {
    properties: {
      end: 'Invalid time window: end time must be after start time'
    }
  }
};

const locationSchema: ExtendedJSONSchema = {
  type: 'object',
  required: ['id', 'latitude', 'longitude'],
  properties: {
    id: { type: 'string' },
    latitude: { 
      type: 'number',
      minimum: -90,
      maximum: 90
    },
    longitude: { 
      type: 'number',
      minimum: -180,
      maximum: 180
    },
    timeWindows: {
      type: 'array',
      items: timeWindowSchema
    }
  }
};

const vehicleSchema: ExtendedJSONSchema = {
  type: 'object',
  required: ['id', 'capacity', 'costPerKm'],
  properties: {
    id: { type: 'string' },
    capacity: { 
      type: 'number',
      exclusiveMinimum: 0
    },
    costPerKm: { 
      type: 'number',
      minimum: 0
    },
    maxDistance: { 
      type: 'number',
      exclusiveMinimum: 0
    }
  }
};

const fleetSchema: ExtendedJSONSchema = {
  type: 'object',
  required: ['vehicles', 'depots', 'customers'],
  properties: {
    vehicles: {
      type: 'array',
      items: vehicleSchema,
      minItems: 1
    },
    depots: {
      type: 'array',
      items: locationSchema,
      minItems: 1
    },
    customers: {
      type: 'array',
      items: locationSchema,
      minItems: 1
    }
  }
};

const protocolStepSchema: ExtendedJSONSchema = {
  type: 'object',
  required: ['action', 'required'],
  properties: {
    action: {
      type: 'string',
      enum: [
        'collect_data',
        'enrich_data',
        'build_model',
        'solve_model',
        'explain_solution',
        'human_approval',
        'custom'
      ]
    },
    required: { type: 'boolean' }
  }
};

// Main MCP Schema
export const mcpSchema: ExtendedJSONSchema = {
  type: 'object',
  required: ['sessionId', 'version', 'created', 'lastModified', 'status', 'model', 'context', 'protocol'],
  properties: {
    sessionId: { type: 'string' },
    version: { type: 'string' },
    created: { type: 'string', format: 'date-time' },
    lastModified: { type: 'string', format: 'date-time' },
    status: {
      type: 'string',
      enum: ['draft', 'pending', 'processing', 'completed', 'error']
    },
    model: {
      type: 'object',
      required: ['variables', 'constraints', 'objective'],
      properties: {
        variables: {
          type: 'array',
          items: variableSchema,
          minItems: 1
        },
        constraints: {
          type: 'array',
          items: constraintSchema,
          minItems: 1
        },
        objective: {
          oneOf: [
            objectiveSchema,
            {
              type: 'array',
              items: objectiveSchema,
              minItems: 1
            }
          ]
        },
        fleet: fleetSchema
      }
    },
    context: {
      type: 'object',
      required: ['problemType', 'dataset', 'environment'],
      properties: {
        problemType: {
          type: 'string',
          enum: ['vehicle_routing', 'fleet_scheduling', 'custom']
        },
        industry: {
          type: 'string',
          enum: ['logistics', 'delivery', 'field_service', 'custom']
        },
        dataset: {
          type: 'object',
          required: ['internalSources'],
          properties: {
            internalSources: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1
            }
          }
        },
        environment: {
          type: 'object',
          required: ['region', 'timezone'],
          properties: {
            region: { type: 'string' },
            timezone: { type: 'string' }
          }
        }
      }
    },
    protocol: {
      type: 'object',
      required: ['steps', 'humanInTheLoop', 'allowPartialSolutions', 'explainabilityEnabled'],
      properties: {
        steps: {
          type: 'array',
          items: protocolStepSchema,
          minItems: 1
        },
        humanInTheLoop: {
          type: 'object',
          properties: {
            required: { type: 'boolean' },
            approvalSteps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  step: { type: 'string' },
                  description: { type: 'string' }
                },
                required: ['step', 'description']
              },
              minItems: 1
            }
          },
          if: {
            properties: { required: { const: true } }
          },
          then: {
            required: ['approvalSteps']
          }
        },
        allowPartialSolutions: { type: 'boolean' },
        explainabilityEnabled: { type: 'boolean' }
      }
    }
  }
}; 