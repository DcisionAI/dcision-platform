# MCP Orchestrator

The MCP Orchestrator is responsible for executing Model Context Protocol (MCP) steps using registered agents. It coordinates the execution of protocol steps, handles errors, and manages agent interactions.

## Core Components

### orchestrateMCP Function
- Main function responsible for executing MCP protocols
- Executes steps sequentially using appropriate agents
- Provides LLM capabilities to agents via OpenAI integration
- Handles error cases and maintains execution results

### OrchestrationResult Interface
- Tracks the result of each step execution
- Includes:
  - Step information
  - Agent used
  - Execution result
  - Thought process (for LLM-based agents)
  - Error information (if any)

## Usage

```typescript
import { orchestrateMCP } from './orchestrator';

const results = await orchestrateMCP(mcpInstance);
```

## Agent Integration
- Uses the agent registry to find appropriate agents for each step
- Provides LLM context to agents for AI-powered decision making
- Captures agent thought processes and execution results

## Error Handling
- Gracefully handles missing agents
- Captures and formats agent execution errors
- Continues execution even if individual steps fail 