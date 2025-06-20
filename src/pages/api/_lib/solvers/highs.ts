import { spawn } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

interface HiGHSVariable {
  name: string;
  type: 'cont' | 'int' | 'bin';
  lb?: number;
  ub?: number;
}

interface HiGHSConstraint {
  coefficients: number[];
  sense: '<=' | '>=' | '=';
  rhs: number;
}

interface HiGHSProblem {
  objective: {
    sense: 'minimize' | 'maximize';
    coefficients: number[];
  };
  variables: HiGHSVariable[];
  constraints: HiGHSConstraint[];
}

interface HiGHSResult {
  status: 'optimal' | 'infeasible' | 'unbounded' | 'time_limit' | 'iteration_limit';
  objective_value: number;
  solution: Array<{
    name: string;
    value: number;
    reduced_cost: number;
  }>;
  solve_time_ms: number;
  iterations: number;
}

export class HiGHSMCPSolver {
  private process: any;
  private initialized: boolean = false;
  private requestId: number = 0;

  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Start HiGHS process
      console.log('Starting HiGHS solver...');
      this.process = spawn('highs', []);
      console.log('Connecting to HiGHS via stdio...');

      // Set up error handling
      this.process.on('error', (error: Error) => {
        console.error('HiGHS process error:', error);
      });

      this.process.stderr.on('data', (data: Buffer) => {
        console.error('HiGHS stderr:', data.toString());
      });

      // Wait for HiGHS to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.initialized = true;
      console.log('HiGHS solver running - ready to solve optimization problems');
    } catch (error) {
      console.error('Failed to initialize HiGHS:', error);
      throw error;
    }
  }

  private formatProblemToMPS(problem: any): string {
    const { objective, variables, constraints } = problem;
    
    let mpsContent = '';
    
    // Header
    mpsContent += `NAME          ${problem.problem_type || 'PROBLEM'}\n`;
    mpsContent += 'ROWS\n';
    
    // Objective row
    const sense = objective.sense || 'minimize';
    if (sense === 'minimize') {
      mpsContent += ' N  OBJ\n';
    } else {
      mpsContent += ' N  OBJ\n';
    }
    
    // Constraint rows
    constraints.dense.forEach((row: number[], i: number) => {
      const constraintSense = constraints.sense[i] || '<=';
      if (constraintSense === '<=') {
        mpsContent += ` L  C${i + 1}\n`;
      } else if (constraintSense === '>=') {
        mpsContent += ` G  C${i + 1}\n`;
      } else {
        mpsContent += ` E  C${i + 1}\n`;
      }
    });
    
    // Columns section
    mpsContent += 'COLUMNS\n';
    variables.forEach((variable: any, varIndex: number) => {
      const varName = variable.name || `X${varIndex + 1}`;
      
      // Objective coefficient
      const objCoeff = objective.linear[varIndex] || 0;
      if (objCoeff !== 0) {
        mpsContent += `    ${varName.padEnd(10)} OBJ        ${objCoeff.toFixed(1)}\n`;
      }
      
      // Constraint coefficients
      constraints.dense.forEach((row: number[], i: number) => {
        const coeff = row[varIndex] || 0;
        if (coeff !== 0) {
          mpsContent += `    ${varName.padEnd(10)} C${i + 1}        ${coeff.toFixed(1)}\n`;
        }
      });
    });
    
    // RHS section
    mpsContent += 'RHS\n';
    constraints.dense.forEach((row: number[], i: number) => {
      const rhs = constraints.rhs[i] || 0;
      mpsContent += `    RHS1      C${i + 1}        ${rhs.toFixed(1)}\n`;
    });
    
    // Bounds section
    mpsContent += 'BOUNDS\n';
    variables.forEach((variable: any, varIndex: number) => {
      const varName = variable.name || `X${varIndex + 1}`;
      const lb = variable.lb !== undefined ? variable.lb : 0;
      const ub = variable.ub !== undefined ? variable.ub : Infinity;
      
      if (variable.type === 'bin') {
        mpsContent += ` BV BND1      ${varName}\n`;
      } else if (variable.type === 'int') {
        mpsContent += ` LI BND1      ${varName}\n`;
        if (lb > -Infinity) mpsContent += ` LO BND1      ${varName}        ${lb.toFixed(1)}\n`;
        if (ub < Infinity) mpsContent += ` UP BND1      ${varName}        ${ub.toFixed(1)}\n`;
      } else {
        if (lb > -Infinity) mpsContent += ` LO BND1      ${varName}        ${lb.toFixed(1)}\n`;
        if (ub < Infinity) mpsContent += ` UP BND1      ${varName}        ${ub.toFixed(1)}\n`;
      }
    });
    
    mpsContent += 'ENDATA\n';
    
    return mpsContent;
  }

  private parseHiGHSOutput(output: string, solutionFile?: string): HiGHSResult {
    const lines = output.split('\n');
    let status = 'optimal';
    let objectiveValue = 0;
    let solution: Array<{ name: string; value: number; reduced_cost: number }> = [];
    let solveTime = 0;
    let iterations = 0;
    
    // Parse console output
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Parse status
      if (trimmedLine.includes('Model status')) {
        if (trimmedLine.includes('Optimal')) {
          status = 'optimal';
        } else if (trimmedLine.includes('Infeasible')) {
          status = 'infeasible';
        } else if (trimmedLine.includes('Unbounded')) {
          status = 'unbounded';
        } else if (trimmedLine.includes('Time limit')) {
          status = 'time_limit';
        }
      }
      
      // Parse objective value
      if (trimmedLine.includes('Objective value')) {
        const match = trimmedLine.match(/Objective value\s*:\s*([\d.-]+)/);
        if (match) {
          objectiveValue = parseFloat(match[1]);
        }
      }
      
      // Parse solve time
      if (trimmedLine.includes('HiGHS run time')) {
        const match = trimmedLine.match(/HiGHS run time\s*:\s*([\d.]+)/);
        if (match) {
          solveTime = parseFloat(match[1]) * 1000; // Convert to milliseconds
        }
      }
      
      // Parse iterations
      if (trimmedLine.includes('Simplex') && trimmedLine.includes('iterations')) {
        const match = trimmedLine.match(/iterations:\s*(\d+)/);
        if (match) {
          iterations = parseInt(match[1]);
        }
      }
    }
    
    // Parse solution file if available
    if (solutionFile) {
      try {
        const solutionContent = readFileSync(solutionFile, 'utf8');
        const solutionLines = solutionContent.split('\n');
        let inColumnsSection = false;
        
        for (const line of solutionLines) {
          const trimmedLine = line.trim();
          
          if (trimmedLine === '# Columns') {
            inColumnsSection = true;
            continue;
          }
          
          if (inColumnsSection && trimmedLine && !trimmedLine.startsWith('#')) {
            const parts = trimmedLine.split(/\s+/);
            if (parts.length >= 2) {
              const varName = parts[0];
              const value = parseFloat(parts[1]);
              
              if (!isNaN(value)) {
                solution.push({
                  name: varName,
                  value: value,
                  reduced_cost: 0 // HiGHS solution file doesn't include reduced costs
                });
              }
            }
          }
          
          if (inColumnsSection && trimmedLine === '# Rows') {
            inColumnsSection = false;
          }
        }
      } catch (error) {
        console.error('Error reading solution file:', error);
      }
    }
    
    return {
      status: status as any,
      objective_value: objectiveValue,
      solution: solution,
      solve_time_ms: solveTime,
      iterations: iterations
    };
  }

  async solve(problem: any): Promise<HiGHSResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log('🔧 HiGHS solving problem:', JSON.stringify(problem, null, 2));

      // Format problem for HiGHS
      const formattedProblem = {
        objective: {
          sense: problem.sense || 'minimize',
          linear: problem.objective?.linear || [1, 1, 1]
        },
        variables: (problem.variables || []).map((v: any) => ({
          name: v.name || 'var',
          type: v.type || 'cont',
          lb: typeof v.lb === 'number' ? v.lb : 0,
          ub: typeof v.ub === 'number' ? v.ub : 10
        })),
        constraints: {
          dense: problem.constraints?.dense || [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
          sense: problem.constraints?.sense || ['<=', '<=', '<='],
          rhs: problem.constraints?.rhs || [10, 10, 10]
        }
      };

      // Convert to MPS format
      const mpsContent = this.formatProblemToMPS(formattedProblem);
      console.log('📝 MPS format:', mpsContent);

      // Create temporary files
      const tempDir = tmpdir();
      const mpsFile = join(tempDir, `highs_${Date.now()}.mps`);
      const solFile = join(tempDir, `highs_${Date.now()}.sol`);
      
      // Write MPS file
      writeFileSync(mpsFile, mpsContent);

      // Run HiGHS with MPS file
      return new Promise((resolve, reject) => {
        const highsProcess = spawn('highs', [
          '--presolve', 'off',
          '--solution_file', solFile,
          mpsFile
        ]);
        
        let stdoutData = '';
        let stderrData = '';
        
        // Set up data handlers
        highsProcess.stdout.on('data', (data: Buffer) => {
          stdoutData += data.toString();
        });
        
        highsProcess.stderr.on('data', (data: Buffer) => {
          stderrData += data.toString();
        });
        
        // Handle process completion
        highsProcess.on('close', (code: number) => {
          try {
            // Clean up temporary files
            try {
              unlinkSync(mpsFile);
            } catch (e) {
              // Ignore cleanup errors
            }
            
            if (code === 0) {
              const result = this.parseHiGHSOutput(stdoutData, solFile);
              console.log('✅ HiGHS solution:', result);
              
              // Clean up solution file
              try {
                unlinkSync(solFile);
              } catch (e) {
                // Ignore cleanup errors
              }
              
              resolve(result);
            } else {
              console.error('HiGHS process exited with code:', code);
              console.error('Stderr:', stderrData);
              reject(new Error(`HiGHS process failed with code ${code}`));
            }
          } catch (error) {
            console.error('Error parsing HiGHS output:', error);
            reject(error);
          }
        });
      });

    } catch (error) {
      console.error('Error solving with HiGHS:', error);
      throw error;
    }
  }

  async shutdown() {
    if (this.process) {
      this.process.kill();
    }
    this.initialized = false;
  }
} 