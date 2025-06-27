import { BaseAgent, AgentConfig, AgentContext } from './BaseAgent';
import { EVENT_TYPES, AGENT_TYPES } from './EventTypes';

type Message = { type: string; payload: any; correlationId?: string; from?: string; to?: string };

export class ModelBuilderAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      name: 'ModelBuilderAgent',
      type: AGENT_TYPES.MODEL_BUILDER_AGENT,
      capabilities: ['model_building', 'constraint_modeling', 'objective_formulation'],
      maxRetries: 2,
      timeout: 25000
    };
    super(config);
  }

  protected subscribeToEvents(): void {
    // Subscribe to data prepared events
    this.subscribe(EVENT_TYPES.DATA_PREPARED, (event: Message) => {
      this.processEvent(event);
    });
  }

  protected async handleEvent(event: Message): Promise<void> {
    const correlationId = event.correlationId;
    if (!correlationId) {
      console.warn('⚠️ ModelBuilderAgent: No correlationId provided');
      return;
    }

    console.log(`🏗️ ModelBuilderAgent processing event: ${event.type} for session: ${correlationId}`);

    try {
      const { enrichedData, customerData } = event.payload;

      // Set context for this processing session
      const agentContext: AgentContext = {
        sessionId: correlationId,
        correlationId,
        userQuery: 'Model building request',
        customerData: enrichedData
      };
      this.setContext(agentContext);

      // Update progress
      this.updateProgress(correlationId, 'started', 'Building optimization model');

      // Build the model
      const modelResult = await this.executeWithRetry(
        () => this.buildOptimizationModel(enrichedData),
        agentContext
      );

      console.log(`✅ Model building completed for session: ${correlationId}`);

      // Publish model built event
      this.publish({
        type: EVENT_TYPES.MODEL_BUILT,
        payload: {
          problemType: enrichedData.projectType || 'crew_assignment',
          modelConfig: modelResult.modelConfig,
          mcpConfig: modelResult.mcpConfig,
          validationResults: {
            isValid: true,
            complexity: modelResult.complexity,
            estimatedSolveTime: modelResult.estimatedSolveTime
          },
          metadata: {
            buildTime: Date.now(),
            modelType: modelResult.modelType,
            variableCount: modelResult.variableCount,
            constraintCount: modelResult.constraintCount
          }
        },
        correlationId
      });

      // Update progress
      this.updateProgress(correlationId, 'completed', 'Optimization model built and validated');

      // Clear context after processing
      this.clearContext();

    } catch (error) {
      console.error(`❌ ModelBuilderAgent failed to process event:`, error);
      
      this.publish({
        type: EVENT_TYPES.OPTIMIZATION_ERROR,
        payload: {
          error: {
            code: 'MODEL_BUILDING_FAILED',
            message: error instanceof Error ? error.message : String(error),
            context: { eventType: event.type, agent: this.config.name }
          },
          recoverable: true
        },
        correlationId
      });

      // Clear context on error
      this.clearContext();
    }
  }

  private async buildOptimizationModel(enrichedData: any): Promise<any> {
    console.log(`🏗️ Building model for project type: ${enrichedData.projectType}`);

    // Determine model type based on problem complexity
    const modelType = this.determineModelType(enrichedData);
    const complexity = this.assessComplexity(enrichedData);

    // Build model configuration
    const modelConfig = {
      type: modelType,
      objective: enrichedData.objectives?.primary || 'minimize_cost',
      variables: this.generateVariables(enrichedData),
      constraints: this.generateModelConstraints(enrichedData),
      parameters: this.generateParameters(enrichedData)
    };

    // Build MCP configuration
    const mcpConfig = {
      problemType: enrichedData.projectType,
      solver: 'highs', // Using HiGHS solver
      modelType: modelType,
      objective: {
        type: enrichedData.objectives?.primary || 'minimize_cost',
        function: this.generateObjectiveFunction(enrichedData)
      },
      constraints: modelConfig.constraints,
      variables: modelConfig.variables,
      parameters: modelConfig.parameters
    };

    return {
      modelConfig,
      mcpConfig,
      modelType,
      complexity,
      variableCount: Object.keys(modelConfig.variables).length,
      constraintCount: modelConfig.constraints.length,
      estimatedSolveTime: this.estimateSolveTime(complexity, modelType)
    };
  }

  private determineModelType(enrichedData: any): string {
    const crewSize = enrichedData.crewSize || 20;
    const timeline = enrichedData.timeline || 6;
    
    if (crewSize > 50 || timeline > 12) {
      return 'MIP'; // Mixed Integer Programming for complex problems
    } else if (crewSize > 20 || timeline > 6) {
      return 'LP'; // Linear Programming for medium problems
    } else {
      return 'LP'; // Linear Programming for simple problems
    }
  }

  private assessComplexity(enrichedData: any): string {
    const crewSize = enrichedData.crewSize || 20;
    const timeline = enrichedData.timeline || 6;
    const constraintCount = enrichedData.constraints?.length || 0;
    
    if (crewSize > 50 || timeline > 12 || constraintCount > 10) {
      return 'advanced';
    } else if (crewSize > 20 || timeline > 6 || constraintCount > 5) {
      return 'intermediate';
    } else {
      return 'basic';
    }
  }

  private generateVariables(enrichedData: any): any {
    const variables: any = {};
    
    if (enrichedData.projectType === 'crew_assignment') {
      // Crew assignment variables
      (enrichedData.resources?.crewTypes || []).forEach((crewType: any) => {
        variables[`crew_${crewType.id}`] = {
          type: 'integer',
          bounds: [0, enrichedData.crewSize],
          description: `Number of ${crewType.name} assigned`
        };
      });
      
      // Timeline variables
      for (let month = 1; month <= enrichedData.timeline; month++) {
        variables[`work_month_${month}`] = {
          type: 'continuous',
          bounds: [0, 1],
          description: `Work progress in month ${month}`
        };
      }
    }
    
    return variables;
  }

  private generateModelConstraints(enrichedData: any): any[] {
    const constraints = [];
    
    if (enrichedData.projectType === 'crew_assignment') {
      // Total crew size constraint
      const crewVars = (enrichedData.resources?.crewTypes || []).map((crew: any) => `crew_${crew.id}`);
      if (crewVars.length > 0) {
        constraints.push({
          name: 'total_crew_limit',
          expression: `${crewVars.join(' + ')} <= ${enrichedData.crewSize}`,
          description: 'Total crew size cannot exceed available workers'
        });
        
        // Budget constraint
        const costExpression = (enrichedData.resources?.crewTypes || [])
          .map((crew: any) => `${crew.cost} * crew_${crew.id}`)
          .join(' + ');
        constraints.push({
          name: 'budget_limit',
          expression: `${costExpression} <= ${enrichedData.budget}`,
          description: 'Total cost cannot exceed budget'
        });
      }
      
      // Timeline constraint
      const timelineVars = [];
      for (let month = 1; month <= enrichedData.timeline; month++) {
        timelineVars.push(`work_month_${month}`);
      }
      constraints.push({
        name: 'timeline_completion',
        expression: `${timelineVars.join(' + ')} >= 1`,
        description: 'Project must be completed within timeline'
      });
    }
    
    return constraints;
  }

  private generateParameters(enrichedData: any): any {
    return {
      crewEfficiency: (enrichedData.resources?.crewTypes || []).reduce((acc: any, crew: any) => {
        acc[crew.id] = crew.efficiency;
        return acc;
      }, {}),
      equipmentCost: (enrichedData.resources?.equipment || []).reduce((acc: any, equip: any) => {
        acc[equip.id] = equip.cost;
        return acc;
      }, {}),
      projectTimeline: enrichedData.timeline,
      budgetLimit: enrichedData.budget
    };
  }

  private generateObjectiveFunction(enrichedData: any): string {
    if (enrichedData.objectives?.primary === 'minimize_cost') {
      const costTerms = (enrichedData.resources?.crewTypes || [])
        .map((crew: any) => `${crew.cost} * crew_${crew.id}`)
        .join(' + ');
      return `minimize: ${costTerms}`;
    } else {
      const efficiencyTerms = (enrichedData.resources?.crewTypes || [])
        .map((crew: any) => `${crew.efficiency} * crew_${crew.id}`)
        .join(' + ');
      return `maximize: ${efficiencyTerms}`;
    }
  }

  private estimateSolveTime(complexity: string, modelType: string): number {
    const baseTime = modelType === 'MIP' ? 5000 : 1000; // milliseconds
    const complexityMultiplier = complexity === 'advanced' ? 3 : complexity === 'intermediate' ? 2 : 1;
    return baseTime * complexityMultiplier;
  }

  public canHandle(eventType: string): boolean {
    return eventType === EVENT_TYPES.DATA_PREPARED;
  }
}

// Export singleton instance
export const modelBuilderAgent = new ModelBuilderAgent(); 