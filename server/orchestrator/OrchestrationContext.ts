import { Session } from '../sessions/types';
import { Step } from '../mcp/types';

export class OrchestrationContext {
  private session: Session;
  private currentStep?: string;
  private stepOutputs: Record<string, any> = {};

  constructor(session: Session) {
    this.session = session;
  }

  public getSession(): Session {
    return this.session;
  }

  public setCurrentStep(stepId: string): void {
    this.currentStep = stepId;
  }

  public getCurrentStep(): string | undefined {
    return this.currentStep;
  }

  public addStepOutputs(stepId: string, outputs: Record<string, any>): void {
    this.stepOutputs[stepId] = outputs;
  }

  public getStepOutputs(stepId: string): Record<string, any> | undefined {
    return this.stepOutputs[stepId];
  }

  public getAllOutputs(): Record<string, any> {
    return { ...this.stepOutputs };
  }

  public async updateSession(updatedSession: Session): Promise<void> {
    // In a real implementation, this would update the session in the database
    this.session = updatedSession;
  }

  public getVariable(name: string): any {
    return this.session.protocol.variables?.[name];
  }

  public setVariable(name: string, value: any): void {
    if (!this.session.protocol.variables) {
      this.session.protocol.variables = {};
    }
    this.session.protocol.variables[name] = value;
  }
}
