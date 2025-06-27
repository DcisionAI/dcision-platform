import { BaseAgent, AgentConfig, AgentContext } from './BaseAgent';
import { EVENT_TYPES, AGENT_TYPES } from './EventTypes';

type Message = { type: string; payload: any; correlationId?: string; from?: string; to?: string };

export class DataAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      name: 'DataAgent',
      type: AGENT_TYPES.DATA_AGENT,
      capabilities: ['data_enrichment', 'data_validation', 'constraint_extraction'],
      maxRetries: 2,
      timeout: 20000
    };
    super(config);
  }

  protected subscribeToEvents(): void {
    // Subscribe to optimization requests
    this.subscribe(EVENT_TYPES.OPTIMIZATION_REQUESTED, (event: Message) => {
      this.processEvent(event);
    });

    // Subscribe to intent identified events where optimization is needed
    this.subscribe(EVENT_TYPES.INTENT_IDENTIFIED, (event: Message) => {
      if (event.payload?.requiresOptimization) {
        this.processEvent(event);
      }
    });
  }

  protected async handleEvent(event: Message): Promise<void> {
    const correlationId = event.correlationId;
    if (!correlationId) {
      console.warn('⚠️ DataAgent: No correlationId provided');
      return;
    }

    console.log(`📊 DataAgent processing event: ${event.type} for session: ${correlationId}`);

    try {
      let customerData: any = {};
      let intent: any = {};

      // Handle different event types
      if (event.type === EVENT_TYPES.OPTIMIZATION_REQUESTED) {
        customerData = event.payload.customerData || {};
        intent = event.payload.intent || {};
      } else if (event.type === EVENT_TYPES.INTENT_IDENTIFIED) {
        customerData = event.payload.customerData || {};
        intent = event.payload;
      } else {
        throw new Error(`Unsupported event type: ${event.type}`);
      }

      // Set context for this processing session
      const agentContext: AgentContext = {
        sessionId: correlationId,
        correlationId,
        userQuery: intent.originalQuery || 'Unknown query',
        customerData
      };
      this.setContext(agentContext);

      // Update progress
      this.updateProgress(correlationId, 'started', 'Enriching customer data');

      // Enrich the data
      const enrichedData = await this.executeWithRetry(
        () => this.enrichCustomerData(customerData, intent),
        agentContext
      );

      console.log(`✅ Data enrichment completed for session: ${correlationId}`);

      // Publish data prepared event
      this.publish({
        type: EVENT_TYPES.DATA_PREPARED,
        payload: {
          customerData,
          enrichedData,
          validationResults: {
            isValid: true,
            warnings: [],
            errors: []
          },
          metadata: {
            enrichmentTime: Date.now(),
            dataQuality: 0.9,
            extractedConstraints: enrichedData.constraints
          }
        },
        correlationId
      });

      // Update progress
      this.updateProgress(correlationId, 'completed', 'Data enriched and validated');

      // Clear context after processing
      this.clearContext();

    } catch (error) {
      console.error(`❌ DataAgent failed to process event:`, error);
      
      this.publish({
        type: EVENT_TYPES.OPTIMIZATION_ERROR,
        payload: {
          error: {
            code: 'DATA_ENRICHMENT_FAILED',
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

  private async enrichCustomerData(customerData: any, intent: any): Promise<any> {
    // Simulate data enrichment process
    console.log(`📊 Enriching data for optimization type: ${intent.optimizationType}`);

    // Extract parameters from the query
    const query = intent.originalQuery || '';
    const extractedParams = this.extractParametersFromQuery(query);

    // Enrich with default values and industry standards
    const enrichedData = {
      ...customerData,
      projectType: extractedParams.projectType || 'office_building',
      timeline: extractedParams.timeline || 6, // months
      budget: extractedParams.budget || 2000000, // $2M default
      crewSize: extractedParams.crewSize || 20,
      constraints: this.generateConstraints(intent.optimizationType, extractedParams),
      resources: this.generateResourceData(intent.optimizationType),
      objectives: this.generateObjectives(intent.optimizationType)
    };

    return enrichedData;
  }

  private extractParametersFromQuery(query: string): any {
    const params: any = {};
    
    // Extract project type
    if (query.includes('office building')) params.projectType = 'office_building';
    if (query.includes('residential')) params.projectType = 'residential';
    if (query.includes('commercial')) params.projectType = 'commercial';
    
    // Extract timeline
    const timelineMatch = query.match(/(\d+)\s*(month|year)/i);
    if (timelineMatch) {
      const value = parseInt(timelineMatch[1]);
      const unit = timelineMatch[2].toLowerCase();
      params.timeline = unit === 'year' ? value * 12 : value;
    }
    
    // Extract crew size
    const crewMatch = query.match(/(\d+)\s*worker/i);
    if (crewMatch) {
      params.crewSize = parseInt(crewMatch[1]);
    }
    
    // Extract budget
    const budgetMatch = query.match(/\$(\d+[kKmM])/i);
    if (budgetMatch) {
      const budgetStr = budgetMatch[1].toLowerCase();
      if (budgetStr.includes('k')) {
        params.budget = parseInt(budgetStr.replace('k', '')) * 1000;
      } else if (budgetStr.includes('m')) {
        params.budget = parseInt(budgetStr.replace('m', '')) * 1000000;
      }
    }
    
    return params;
  }

  private generateConstraints(optimizationType: string, params: any): any[] {
    const constraints = [];
    
    if (optimizationType === 'crew_assignment') {
      constraints.push({
        type: 'resource_limit',
        name: 'crew_size_limit',
        value: params.crewSize || 20,
        description: 'Maximum number of workers available'
      });
      
      constraints.push({
        type: 'timeline',
        name: 'project_deadline',
        value: params.timeline || 6,
        description: 'Project completion deadline in months'
      });
    }
    
    if (params.budget) {
      constraints.push({
        type: 'budget',
        name: 'budget_limit',
        value: params.budget,
        description: 'Maximum project budget'
      });
    }
    
    return constraints;
  }

  private generateResourceData(optimizationType: string): any {
    if (optimizationType === 'crew_assignment') {
      return {
        crewTypes: [
          { id: 'skilled', name: 'Skilled Workers', cost: 45, efficiency: 1.2 },
          { id: 'semi_skilled', name: 'Semi-Skilled Workers', cost: 35, efficiency: 1.0 },
          { id: 'laborer', name: 'Laborers', cost: 25, efficiency: 0.8 }
        ],
        equipment: [
          { id: 'crane', name: 'Crane', cost: 500, availability: 0.8 },
          { id: 'excavator', name: 'Excavator', cost: 300, availability: 0.9 },
          { id: 'truck', name: 'Truck', cost: 150, availability: 0.95 }
        ]
      };
    }
    
    return {};
  }

  private generateObjectives(optimizationType: string): any {
    if (optimizationType === 'crew_assignment') {
      return {
        primary: 'minimize_cost',
        secondary: 'maximize_efficiency',
        constraints: ['meet_deadline', 'within_budget']
      };
    }
    
    return {
      primary: 'optimize_performance',
      secondary: 'minimize_cost'
    };
  }

  public canHandle(eventType: string): boolean {
    return eventType === EVENT_TYPES.OPTIMIZATION_REQUESTED || 
           eventType === EVENT_TYPES.INTENT_IDENTIFIED;
  }
}

// Export singleton instance
export const dataAgent = new DataAgent(); 