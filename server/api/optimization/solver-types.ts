import { z } from 'zod';

// Base solver configuration
export const SolverConfigSchema = z.object({
  timeLimit: z.number().optional(),
  threads: z.number().optional(),
  logLevel: z.enum(['OFF', 'ERROR', 'WARNING', 'INFO', 'DEBUG']).optional(),
  randomSeed: z.number().optional()
});

// Supported problem types
export const ProblemTypeSchema = z.enum([
  'LINEAR_PROGRAMMING',
  'MIXED_INTEGER_PROGRAMMING',
  'CONSTRAINT_PROGRAMMING',
  'VEHICLE_ROUTING',
  'JOB_SHOP_SCHEDULING',
  'BIN_PACKING'
]);

// Variable definition
export const VariableSchema = z.object({
  name: z.string(),
  type: z.enum(['CONTINUOUS', 'INTEGER', 'BINARY']),
  min: z.number().optional(),
  max: z.number().optional(),
  description: z.string().optional()
});

// Constraint definition
export const ConstraintSchema = z.object({
  name: z.string(),
  expression: z.string(),
  type: z.enum(['EQUALS', 'LESS_THAN', 'GREATER_THAN']),
  description: z.string().optional()
});

// Objective definition
export const ObjectiveSchema = z.object({
  type: z.enum(['MINIMIZE', 'MAXIMIZE']),
  expression: z.string(),
  description: z.string().optional()
});

// Model definition
export const ModelSchema = z.object({
  name: z.string(),
  type: ProblemTypeSchema,
  variables: z.array(VariableSchema),
  constraints: z.array(ConstraintSchema),
  objective: ObjectiveSchema,
  config: SolverConfigSchema.optional()
});

// Solution status
export const SolutionStatusSchema = z.enum([
  'OPTIMAL',
  'FEASIBLE',
  'INFEASIBLE',
  'UNBOUNDED',
  'ERROR'
]);

// Solution definition
export const SolutionSchema = z.object({
  status: SolutionStatusSchema,
  objectiveValue: z.number().optional(),
  variables: z.record(z.string(), z.number()).optional(),
  error: z.string().optional()
});

// Type exports
export type SolverConfig = z.infer<typeof SolverConfigSchema>;
export type ProblemType = z.infer<typeof ProblemTypeSchema>;
export type Variable = z.infer<typeof VariableSchema>;
export type Constraint = z.infer<typeof ConstraintSchema>;
export type Objective = z.infer<typeof ObjectiveSchema>;
export type Model = z.infer<typeof ModelSchema>;
export type Solution = z.infer<typeof SolutionSchema>;
export type SolutionStatus = z.infer<typeof SolutionStatusSchema>; 