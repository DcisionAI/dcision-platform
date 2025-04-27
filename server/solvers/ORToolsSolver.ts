import { Model, Solution, SolverConfig } from './types';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import pino from 'pino';

const logger = pino({ name: 'ORToolsSolver' });

export class ORToolsSolver {
  private readonly pythonPath: string;
  private readonly scriptPath: string;
  private readonly config: SolverConfig;

  constructor(config: SolverConfig = {}) {
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.scriptPath = path.join(__dirname, 'ortools_wrapper.py');
    this.config = config;
  }

  async solve(model: Model): Promise<Solution> {
    try {
      // Validate model before proceeding
      await this.validateModel(model);

      // Create temporary file for model data
      const modelFile = await this.writeModelToFile(model);

      // Spawn Python process with OR-Tools wrapper
      const solution = await this.runSolver(modelFile);

      // Clean up temporary file
      await fs.unlink(modelFile);

      return solution;
    } catch (error: unknown) {
      logger.error({ error: error instanceof Error ? error.message : String(error), model: model.name }, 'Error solving model');
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  private async validateModel(model: Model): Promise<void> {
    // Add specific validation logic based on problem type
    switch (model.type) {
      case 'LINEAR_PROGRAMMING':
      case 'MIXED_INTEGER_PROGRAMMING':
        this.validateLinearModel(model);
        break;
      case 'CONSTRAINT_PROGRAMMING':
        this.validateCPModel(model);
        break;
      case 'VEHICLE_ROUTING':
        this.validateVRPModel(model);
        break;
      // Add other problem types as needed
    }
  }

  private validateLinearModel(model: Model): void {
    // Validate linear expressions in constraints and objective
    for (const constraint of model.constraints) {
      if (!this.isValidLinearExpression(constraint.expression)) {
        throw new Error(`Invalid linear expression in constraint ${constraint.name}`);
      }
    }
    if (!this.isValidLinearExpression(model.objective.expression)) {
      throw new Error('Invalid linear expression in objective function');
    }
  }

  private validateCPModel(model: Model): void {
    // Add CP-specific validation
    // TODO: Implement CP validation logic
  }

  private validateVRPModel(model: Model): void {
    // Add VRP-specific validation
    // TODO: Implement VRP validation logic
  }

  private isValidLinearExpression(expression: string): boolean {
    // Basic validation for linear expressions
    // TODO: Implement more sophisticated validation
    return /^[\d\s\+\-\*x\d\s\(\)]+$/.test(expression);
  }

  private async writeModelToFile(model: Model): Promise<string> {
    const tempFile = path.join(
      process.env.TEMP_DIR || '/tmp',
      `model_${Date.now()}.json`
    );
    await fs.writeFile(tempFile, JSON.stringify(model, null, 2));
    return tempFile;
  }

  private async runSolver(modelFile: string): Promise<Solution> {
    return new Promise((resolve, reject) => {
      const process = spawn(this.pythonPath, [
        this.scriptPath,
        modelFile,
        JSON.stringify(this.config)
      ]);

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          logger.error({ code, stderr }, 'Solver process failed');
          reject(new Error(`Solver failed with code ${code}: ${stderr}`));
          return;
        }

        try {
          const solution = JSON.parse(stdout);
          resolve(solution);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          reject(new Error(`Failed to parse solver output: ${errorMessage}`));
        }
      });
    });
  }
} 