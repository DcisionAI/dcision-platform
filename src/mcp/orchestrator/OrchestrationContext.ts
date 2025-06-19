import { MCP, Variable, StepResult } from '../../pages/api/_lib/mcp/MCPTypes';

export interface SessionState {
  variables: Record<string, any>;
  stepResults: Record<string, StepResult>;
  currentStepIndex: number;
  errors: string[];
  warnings: string[];
}

export class OrchestrationContext {
  private state: SessionState;
  private readonly mcp: MCP;

  constructor(mcp: MCP) {
    this.mcp = mcp;
    this.state = {
      variables: this.initializeVariables(mcp.model.variables),
      stepResults: {},
      currentStepIndex: 0,
      errors: [],
      warnings: []
    };
  }

  private initializeVariables(variables: Variable[]): Record<string, any> {
    return variables.reduce((acc, variable) => {
      acc[variable.name] = variable.default;
      return acc;
    }, {} as Record<string, any>);
  }

  // State management
  public getState(): SessionState {
    return { ...this.state };
  }

  public getCurrentStep() {
    return this.mcp.protocol.steps[this.state.currentStepIndex];
  }

  public advanceStep() {
    this.state.currentStepIndex++;
  }

  // Variable management
  public getVariable(name: string): any {
    return this.state.variables[name];
  }

  public setVariable(name: string, value: any) {
    this.state.variables[name] = value;
  }

  // Results management
  public setStepResult(stepId: string, result: StepResult) {
    this.state.stepResults[stepId] = result;
  }

  public getStepResult(stepId: string): StepResult | undefined {
    return this.state.stepResults[stepId];
  }

  // Error and warning management
  public addError(error: string) {
    this.state.errors.push(error);
  }

  public addWarning(warning: string) {
    this.state.warnings.push(warning);
  }

  public hasErrors(): boolean {
    return this.state.errors.length > 0;
  }

  // MCP access
  public getMCP(): MCP {
    return this.mcp;
  }

  // Session completion check
  public isComplete(): boolean {
    return this.state.currentStepIndex >= this.mcp.protocol.steps.length;
  }
} 