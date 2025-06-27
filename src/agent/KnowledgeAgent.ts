import { BaseAgent, AgentConfig, AgentContext } from './BaseAgent';
import { EVENT_TYPES, AGENT_TYPES } from './EventTypes';

type Message = { type: string; payload: any; correlationId?: string; from?: string; to?: string };

export class KnowledgeAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      name: 'KnowledgeAgent',
      type: AGENT_TYPES.KNOWLEDGE_AGENT,
      capabilities: ['knowledge_retrieval', 'rag_operations', 'context_enrichment'],
      maxRetries: 2,
      timeout: 15000
    };
    super(config);
  }

  protected subscribeToEvents(): void {
    // Subscribe to knowledge retrieval requests
    this.subscribe(EVENT_TYPES.KNOWLEDGE_RETRIEVAL_REQUESTED, (event: Message) => {
      this.processEvent(event);
    });
  }

  protected async handleEvent(event: Message): Promise<void> {
    const correlationId = event.correlationId;
    if (!correlationId) {
      console.warn('⚠️ KnowledgeAgent: No correlationId provided');
      return;
    }

    console.log(`🔍 KnowledgeAgent processing event: ${event.type} for session: ${correlationId}`);

    try {
      const { query, intent } = event.payload;

      // Set context for this processing session
      const agentContext: AgentContext = {
        sessionId: correlationId,
        correlationId,
        userQuery: query,
        customerData: { intent }
      };
      this.setContext(agentContext);

      // Update progress
      this.updateProgress(correlationId, 'started', 'Retrieving relevant knowledge');

      // Perform knowledge retrieval
      const knowledgeResult = await this.executeWithRetry(
        () => this.retrieveKnowledge(query, intent),
        agentContext
      );

      console.log(`✅ Knowledge retrieval completed for session: ${correlationId}`);

      // Publish knowledge retrieved event
      this.publish({
        type: EVENT_TYPES.KNOWLEDGE_RETRIEVED,
        payload: {
          query,
          intent,
          knowledge: knowledgeResult.knowledge,
          sources: knowledgeResult.sources,
          confidence: knowledgeResult.confidence,
          metadata: {
            retrievalTime: Date.now(),
            sourceCount: knowledgeResult.sources.length,
            relevanceScore: knowledgeResult.relevanceScore
          }
        },
        correlationId
      });

      // Update progress
      this.updateProgress(correlationId, 'completed', 'Knowledge retrieved and processed');

      // Clear context after processing
      this.clearContext();

    } catch (error) {
      console.error(`❌ KnowledgeAgent failed to process event:`, error);
      
      this.publish({
        type: EVENT_TYPES.KNOWLEDGE_RETRIEVAL_FAILED,
        payload: {
          error: {
            code: 'KNOWLEDGE_RETRIEVAL_FAILED',
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

  private async retrieveKnowledge(query: string, intent: any): Promise<any> {
    console.log(`🔍 Retrieving knowledge for query: "${query}"`);

    // Simulate knowledge retrieval process
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate mock knowledge based on query content
    const knowledge = this.generateMockKnowledge(query, intent);
    const sources = this.generateMockSources(query);
    const relevanceScore = this.calculateRelevanceScore(query, knowledge);

    return {
      knowledge,
      sources,
      confidence: 0.85,
      relevanceScore
    };
  }

  private generateMockKnowledge(query: string, intent: any): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('osha') || lowerQuery.includes('safety')) {
      return `OSHA (Occupational Safety and Health Administration) regulations require:
1. Fall protection for workers at heights of 6 feet or more
2. Proper use of personal protective equipment (PPE)
3. Regular safety training and certification
4. Hazard communication and labeling
5. Emergency response procedures

Key safety requirements for construction sites:
- Hard hats must be worn at all times
- Safety harnesses required for work above 6 feet
- Regular safety inspections and documentation
- Proper scaffolding and ladder safety protocols
- First aid kits and emergency contact information readily available`;
    }
    
    if (lowerQuery.includes('crew') || lowerQuery.includes('assignment')) {
      return `Crew assignment best practices:
1. Match worker skills to task requirements
2. Consider experience levels and certifications
3. Balance workload across team members
4. Account for safety requirements and training
5. Plan for backup personnel availability

Optimal crew composition typically includes:
- 1-2 skilled workers per 3-4 laborers
- Specialized equipment operators as needed
- Safety supervisor for larger crews
- Cross-trained personnel for flexibility`;
    }
    
    if (lowerQuery.includes('schedule') || lowerQuery.includes('timeline')) {
      return `Project scheduling considerations:
1. Critical path analysis for dependencies
2. Resource availability and constraints
3. Weather and seasonal factors
4. Permit and inspection requirements
5. Client milestone expectations

Timeline optimization strategies:
- Front-load critical activities
- Parallel processing where possible
- Buffer time for unexpected delays
- Regular progress monitoring and adjustments
- Communication with stakeholders`;
    }
    
    if (lowerQuery.includes('cost') || lowerQuery.includes('budget')) {
      return `Cost optimization strategies:
1. Efficient resource allocation
2. Bulk material purchasing
3. Equipment sharing between projects
4. Minimizing rework and waste
5. Negotiating favorable supplier terms

Budget management best practices:
- Regular cost tracking and reporting
- Variance analysis and corrective actions
- Contingency planning (typically 10-15%)
- Value engineering opportunities
- Cash flow management and timing`;
    }
    
    // Default knowledge for general queries
    return `Construction project management involves coordinating multiple aspects:
1. Planning and scheduling
2. Resource allocation and management
3. Safety compliance and risk management
4. Quality control and assurance
5. Cost control and budget management
6. Communication and stakeholder management

Key success factors include:
- Clear project objectives and scope
- Effective team communication
- Regular progress monitoring
- Proactive problem-solving
- Continuous improvement processes`;
  }

  private generateMockSources(query: string): any[] {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('osha') || lowerQuery.includes('safety')) {
      return [
        {
          title: 'OSHA Construction Safety Standards',
          url: 'https://www.osha.gov/construction',
          type: 'government_regulation',
          relevance: 0.95
        },
        {
          title: 'Construction Safety Best Practices Guide',
          url: 'https://www.nsc.org/workplace/safety-topics/construction',
          type: 'industry_guide',
          relevance: 0.88
        }
      ];
    }
    
    if (lowerQuery.includes('crew') || lowerQuery.includes('assignment')) {
      return [
        {
          title: 'Construction Crew Management Handbook',
          url: 'https://www.construction-institute.org/crew-management',
          type: 'industry_guide',
          relevance: 0.92
        },
        {
          title: 'Optimal Crew Assignment Strategies',
          url: 'https://www.projectmanagement.com/crew-optimization',
          type: 'research_paper',
          relevance: 0.85
        }
      ];
    }
    
    return [
      {
        title: 'Construction Project Management Fundamentals',
        url: 'https://www.pmi.org/construction-pm',
        type: 'industry_guide',
        relevance: 0.80
      },
      {
        title: 'Best Practices in Construction Management',
        url: 'https://www.construction.org/best-practices',
        type: 'industry_guide',
        relevance: 0.75
      }
    ];
  }

  private calculateRelevanceScore(query: string, knowledge: string): number {
    // Simple relevance calculation based on keyword matching
    const queryWords = query.toLowerCase().split(/\s+/);
    const knowledgeWords = knowledge.toLowerCase().split(/\s+/);
    
    const matchingWords = queryWords.filter(word => 
      knowledgeWords.some(kw => kw.includes(word) || word.includes(kw))
    );
    
    return Math.min(1.0, matchingWords.length / queryWords.length);
  }

  public canHandle(eventType: string): boolean {
    return eventType === EVENT_TYPES.KNOWLEDGE_RETRIEVAL_REQUESTED;
  }
}

// Export singleton instance
export const knowledgeAgent = new KnowledgeAgent(); 