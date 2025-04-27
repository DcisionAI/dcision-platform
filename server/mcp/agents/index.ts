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

// Initialize connectors
const dbConnector = new MockDatabaseConnector();

// Initialize agents
const intentInterpreterAgent = new IntentInterpreterAgent();
const dataMappingAgent = new DataMappingAgent();
const dataIntegrationAgent = new DataIntegrationAgent(dbConnector);
const dataEnrichmentAgent = new DataEnrichmentAgent();
const modelRunnerAgent = new ModelRunnerAgent();
const solutionExplanationAgent = new SolutionExplanationAgent();
const humanInTheLoopAgent = new HumanInTheLoopAgent();
const processAutomationAgent = new ProcessAutomationAgent();

// Register all agents
agentRegistry.register(intentInterpreterAgent);
agentRegistry.register(dataMappingAgent);
agentRegistry.register(dataIntegrationAgent);
agentRegistry.register(dataEnrichmentAgent);
agentRegistry.register(modelRunnerAgent);
agentRegistry.register(solutionExplanationAgent);
agentRegistry.register(humanInTheLoopAgent);
agentRegistry.register(processAutomationAgent);

export {
  IntentInterpreterAgent,
  DataMappingAgent,
  DataIntegrationAgent,
  DataEnrichmentAgent,
  ModelRunnerAgent,
  SolutionExplanationAgent,
  HumanInTheLoopAgent,
  ProcessAutomationAgent,
  agentRegistry
}; 