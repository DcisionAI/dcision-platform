import { DomainType, DomainAgent, IntentAgentFactory as IIntentAgentFactory } from './types';

class MockDomainAgentBridge {
  create_agent(domain: DomainType): DomainAgent {
    return {
      identify_problem: async (input: string) => {
        switch (domain) {
          case 'fleetops':
            return {
              problem_type: 'vehicle_assignment',
              context: { has_time_windows: true, has_capacity: false },
              constraints: { time_windows: true, capacity: false },
              objectives: { minimize_fuel_costs: true }
            };
          case 'workforce':
            return {
              problem_type: 'scheduling',
              context: { has_preferences: true, has_breaks: true },
              constraints: { preferences: true, breaks: true },
              objectives: { maximize_coverage: true, minimize_overtime: true }
            };
          default:
            throw new Error(`Unknown domain: ${domain}`);
        }
      }
    };
  }
}

export class IntentAgentFactory implements IIntentAgentFactory {
  private agents: Map<DomainType, DomainAgent>;
  private bridge: MockDomainAgentBridge;

  constructor() {
    this.agents = new Map();
    this.bridge = new MockDomainAgentBridge();
  }

  get_agent(domain: DomainType): DomainAgent {
    if (!this.agents.has(domain)) {
      const agent = this.bridge.create_agent(domain);
      this.agents.set(domain, agent);
    }
    return this.agents.get(domain)!;
  }
} 