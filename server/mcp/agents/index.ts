import { AgentRegistry } from './AgentRegistry';
import { IntentInterpreterAgent } from './IntentInterpreterAgent';
import { ModelRunnerAgent } from './ModelRunnerAgent';
import { DataIntegrationAgent } from './DataIntegrationAgent';
import { DataMappingAgent } from './DataMappingAgent';
import { SolutionExplainerAgent } from './SolutionExplainerAgent';
import { ModelDefinitionAgent } from './ModelDefinitionAgent';

// Initialize agent registry
const agentRegistry = AgentRegistry.getInstance();

// Register core agents
agentRegistry.register(new IntentInterpreterAgent());  // Classifies as 'vehicle_routing' or 'fleet_scheduling'
agentRegistry.register(new ModelRunnerAgent());       // Builds and solves model using OR-Tools
agentRegistry.register(new DataIntegrationAgent());   // Handles data integration tasks
agentRegistry.register(new DataMappingAgent());       // Handles data mapping tasks
agentRegistry.register(new SolutionExplainerAgent()); // Explains model solutions
agentRegistry.register(new ModelDefinitionAgent()); // Defines model using RAG and LLM

export {
  AgentRegistry,
  IntentInterpreterAgent,
  ModelRunnerAgent,
  DataIntegrationAgent,
  DataMappingAgent,
  SolutionExplainerAgent
}; 