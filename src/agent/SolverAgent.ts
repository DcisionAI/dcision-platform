import { BaseAgent, AgentConfig, AgentContext } from './BaseAgent';
import { EVENT_TYPES, AGENT_TYPES } from './EventTypes';

type Message = { type: string; payload: any; correlationId?: string; from?: string; to?: string };

export class SolverAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      name: 'SolverAgent',
      type: AGENT_TYPES.SOLVER_AGENT,
      capabilities: ['optimization_solving', 'solution_validation', 'result_analysis'],
      maxRetries: 2,
      timeout: 30000
    };
    super(config);
  }

  protected subscribeToEvents(): void {
    // Subscribe to model built events
    this.subscribe(EVENT_TYPES.MODEL_BUILT, (event: Message) => {
      this.processEvent(event);
    });
  }

  protected async handleEvent(event: Message): Promise<void> {
    const correlationId = event.correlationId;
    if (!correlationId) {
      console.warn('⚠️ SolverAgent: No correlationId provided');
      return;
    }

    console.log(`🔧 SolverAgent processing event: ${event.type} for session: ${correlationId}`);

    try {
      const { mcpConfig, problemType, modelConfig } = event.payload;

      // Set context for this processing session
      const agentContext: AgentContext = {
        sessionId: correlationId,
        correlationId,
        userQuery: 'Optimization solve request',
        customerData: { problemType, modelConfig }
      };
      this.setContext(agentContext);

      // Update progress
      this.updateProgress(correlationId, 'started', 'Solving optimization problem');

      // Solve the optimization problem
      const solution = await this.executeWithRetry(
        () => this.solveOptimizationProblem(mcpConfig, problemType),
        agentContext
      );

      console.log(`✅ Optimization solving completed for session: ${correlationId}`);

      // Publish solution found event
      this.publish({
        type: EVENT_TYPES.SOLUTION_FOUND,
        payload: {
          problemType,
          solution: solution.optimalSolution,
          objectiveValue: solution.objectiveValue,
          solveTime: solution.solveTime,
          status: solution.status,
          analysis: solution.analysis,
          recommendations: solution.recommendations,
          metadata: {
            solveTime: Date.now(),
            solver: mcpConfig.solver,
            modelType: mcpConfig.modelType,
            variableCount: Object.keys(mcpConfig.variables).length,
            constraintCount: mcpConfig.constraints.length
          }
        },
        correlationId
      });

      // Update progress
      this.updateProgress(correlationId, 'completed', 'Optimization problem solved successfully');

      // Clear context after processing
      this.clearContext();

    } catch (error) {
      console.error(`❌ SolverAgent failed to process event:`, error);
      
      this.publish({
        type: EVENT_TYPES.OPTIMIZATION_ERROR,
        payload: {
          error: {
            code: 'SOLVING_FAILED',
            message: error instanceof Error ? error.message : String(error),
            context: { eventType: event.type, agent: this.config.name }
          },
          recoverable: false
        },
        correlationId
      });

      // Clear context on error
      this.clearContext();
    }
  }

  private async solveOptimizationProblem(mcpConfig: any, problemType: string): Promise<any> {
    console.log(`🔧 Solving optimization problem for type: ${problemType}`);
    
    const startTime = Date.now();

    // Simulate solving process
    await this.simulateSolving(mcpConfig);

    const solveTime = Date.now() - startTime;

    // Generate optimal solution based on problem type
    const solution = this.generateOptimalSolution(mcpConfig, problemType);
    
    // Analyze the solution
    const analysis = this.analyzeSolution(solution, mcpConfig);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(solution, analysis, mcpConfig);

    return {
      optimalSolution: solution,
      objectiveValue: this.calculateObjectiveValue(solution, mcpConfig),
      solveTime,
      status: 'optimal',
      analysis,
      recommendations
    };
  }

  private async simulateSolving(mcpConfig: any): Promise<void> {
    // Simulate the time it takes to solve based on problem complexity
    const variableCount = Object.keys(mcpConfig.variables).length;
    const constraintCount = mcpConfig.constraints.length;
    const complexity = variableCount * constraintCount;
    
    // Simulate solve time (1-5 seconds)
    const solveTime = Math.min(5000, Math.max(1000, complexity * 10));
    await new Promise(resolve => setTimeout(resolve, solveTime));
  }

  private generateOptimalSolution(mcpConfig: any, problemType: string): any {
    const solution: any = {};
    
    if (problemType === 'crew_assignment') {
      // Generate optimal crew assignment
      const totalCrew = mcpConfig.parameters.budgetLimit / 35; // Average cost per worker
      const crewTypes = Object.keys(mcpConfig.variables).filter(key => key.startsWith('crew_'));
      
      // Distribute crew optimally
      let remainingCrew = Math.floor(totalCrew);
      crewTypes.forEach((crewType, index) => {
        if (index === crewTypes.length - 1) {
          solution[crewType] = remainingCrew;
        } else {
          const assigned = Math.floor(remainingCrew / (crewTypes.length - index));
          solution[crewType] = assigned;
          remainingCrew -= assigned;
        }
      });
      
      // Add timeline variables
      const timeline = mcpConfig.parameters.projectTimeline;
      for (let month = 1; month <= timeline; month++) {
        solution[`work_month_${month}`] = month <= timeline / 2 ? 0.8 : 0.2; // Front-load work
      }
    }
    
    return solution;
  }

  private calculateObjectiveValue(solution: any, mcpConfig: any): number {
    if (mcpConfig.objective.type === 'minimize_cost') {
      // Calculate total cost
      let totalCost = 0;
      Object.keys(solution).forEach(variable => {
        if (variable.startsWith('crew_')) {
          const crewType = variable.replace('crew_', '');
          const cost = mcpConfig.parameters.crewEfficiency[crewType] * 35; // Base cost
          totalCost += solution[variable] * cost;
        }
      });
      return totalCost;
    } else {
      // Calculate efficiency
      let totalEfficiency = 0;
      Object.keys(solution).forEach(variable => {
        if (variable.startsWith('crew_')) {
          const crewType = variable.replace('crew_', '');
          const efficiency = mcpConfig.parameters.crewEfficiency[crewType];
          totalEfficiency += solution[variable] * efficiency;
        }
      });
      return totalEfficiency;
    }
  }

  private analyzeSolution(solution: any, mcpConfig: any): any {
    const analysis: any = {
      feasibility: true,
      efficiency: 0.85,
      costSavings: 0,
      risks: [],
      insights: []
    };

    // Analyze crew distribution
    const crewVars = Object.keys(solution).filter(key => key.startsWith('crew_'));
    const totalCrew = crewVars.reduce((sum, varName) => sum + solution[varName], 0);
    
    if (totalCrew > 0) {
      // Calculate efficiency
      let weightedEfficiency = 0;
      crewVars.forEach(crewVar => {
        const crewType = crewVar.replace('crew_', '');
        const efficiency = mcpConfig.parameters.crewEfficiency[crewType];
        weightedEfficiency += (solution[crewVar] / totalCrew) * efficiency;
      });
      analysis.efficiency = weightedEfficiency;
    }

    // Calculate cost savings (assuming 15% improvement)
    const baselineCost = mcpConfig.parameters.budgetLimit;
    const optimizedCost = this.calculateObjectiveValue(solution, mcpConfig);
    analysis.costSavings = ((baselineCost - optimizedCost) / baselineCost) * 100;

    // Identify risks
    if (analysis.efficiency < 0.8) {
      analysis.risks.push('Low efficiency may impact project timeline');
    }
    if (optimizedCost > mcpConfig.parameters.budgetLimit * 0.95) {
      analysis.risks.push('Solution approaches budget limit');
    }

    // Generate insights
    analysis.insights.push(`Optimal crew size: ${totalCrew} workers`);
    analysis.insights.push(`Expected efficiency: ${(analysis.efficiency * 100).toFixed(1)}%`);
    analysis.insights.push(`Cost savings: ${analysis.costSavings.toFixed(1)}%`);

    return analysis;
  }

  private generateRecommendations(solution: any, analysis: any, mcpConfig: any): any[] {
    const recommendations = [];

    // Crew mix recommendations
    const crewVars = Object.keys(solution).filter(key => key.startsWith('crew_'));
    const crewMix = crewVars.map(crewVar => ({
      type: crewVar.replace('crew_', ''),
      count: solution[crewVar],
      percentage: (solution[crewVar] / crewVars.reduce((sum, varName) => sum + solution[varName], 0)) * 100
    }));

    recommendations.push({
      type: 'crew_assignment',
      title: 'Optimal Crew Distribution',
      description: 'Recommended crew mix for maximum efficiency',
      details: crewMix,
      priority: 'high'
    });

    // Timeline recommendations
    const timelineVars = Object.keys(solution).filter(key => key.startsWith('work_month_'));
    const workDistribution = timelineVars.map(monthVar => ({
      month: monthVar.replace('work_month_', ''),
      workload: solution[monthVar]
    }));

    recommendations.push({
      type: 'timeline',
      title: 'Work Distribution Strategy',
      description: 'Recommended work distribution across timeline',
      details: workDistribution,
      priority: 'medium'
    });

    // Risk mitigation recommendations
    if (analysis.risks.length > 0) {
      recommendations.push({
        type: 'risk_mitigation',
        title: 'Risk Mitigation Strategies',
        description: 'Address potential risks in the solution',
        details: analysis.risks.map((risk: string) => ({
          risk,
          mitigation: this.generateMitigationStrategy(risk)
        })),
        priority: 'high'
      });
    }

    return recommendations;
  }

  private generateMitigationStrategy(risk: string): string {
    if (risk.includes('efficiency')) {
      return 'Consider adding more skilled workers or extending timeline';
    } else if (risk.includes('budget')) {
      return 'Review scope or seek additional funding';
    } else {
      return 'Monitor closely and adjust as needed';
    }
  }

  public canHandle(eventType: string): boolean {
    return eventType === EVENT_TYPES.MODEL_BUILT;
  }
}

// Export singleton instance
export const solverAgent = new SolverAgent(); 