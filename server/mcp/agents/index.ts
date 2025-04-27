import { agentRegistry } from './AgentRegistry';
import { IntentInterpreterAgent } from './IntentInterpreterAgent';
import { DataMappingAgent } from './DataMappingAgent';
import { DataIntegrationAgent } from './DataIntegrationAgent';
import { DataEnrichmentAgent } from './DataEnrichmentAgent';
import { ModelRunnerAgent } from './ModelRunnerAgent';
import { SolutionExplanationAgent } from './SolutionExplanationAgent';
import { HumanInTheLoopAgent } from './HumanInTheLoopAgent';
import { ProcessAutomationAgent } from './ProcessAutomationAgent';
import { MockDatabaseConnector } from '../connectors/DatabaseConnector';

// Initialize database connector
const dbConnector = new MockDatabaseConnector();

// Register all agents
agentRegistry.register(new IntentInterpreterAgent());  // Classifies as 'vehicle_routing' or 'fleet_scheduling'
agentRegistry.register(new DataMappingAgent());       // Handles field mapping
agentRegistry.register(new DataIntegrationAgent(dbConnector));   // Handles data collection
agentRegistry.register(new DataEnrichmentAgent());    // Adds weather/traffic data
agentRegistry.register(new ModelRunnerAgent());       // Builds and solves model using OR-Tools
agentRegistry.register(new SolutionExplanationAgent()); // Explains results
agentRegistry.register(new HumanInTheLoopAgent());    // Handles approvals
agentRegistry.register(new ProcessAutomationAgent()); // Handles deployment

export {
  IntentInterpreterAgent,
  DataMappingAgent,
  DataIntegrationAgent,
  DataEnrichmentAgent,
  ModelRunnerAgent,
  SolutionExplanationAgent,
  HumanInTheLoopAgent,
  ProcessAutomationAgent
}; 