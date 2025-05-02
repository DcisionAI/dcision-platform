import { AgentRegistry } from './AgentRegistry';
import { IntentInterpreterAgent } from './IntentInterpreterAgent';
import { ModelRunnerAgent } from './ModelRunnerAgent';

// Initialize agent registry
const agentRegistry = AgentRegistry.getInstance();

// Register core agents
agentRegistry.register(new IntentInterpreterAgent());  // Classifies as 'vehicle_routing' or 'fleet_scheduling'
agentRegistry.register(new ModelRunnerAgent());       // Builds and solves model using OR-Tools

export {
  AgentRegistry,
  IntentInterpreterAgent,
  ModelRunnerAgent
}; 