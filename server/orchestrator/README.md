# DcisionAI Orchestrator

The orchestrator is responsible for executing MCP protocols and managing the interaction between different agents.

## Components

### ProtocolRunner
- Main class responsible for executing protocols
- Manages the overall flow of execution
- Handles protocol-level error recovery

### OrchestrationContext
- Maintains state during protocol execution
- Provides access to session information
- Manages shared data between steps

### StepExecutor
- Executes individual protocol steps
- Handles step-level retries and timeouts
- Manages agent interactions

## Usage

```typescript
import { ProtocolRunner } from './ProtocolRunner';

const runner = new ProtocolRunner(session);
await runner.executeProtocol();
```

## Development

- Add new step types in `StepExecutor`
- Extend context capabilities in `OrchestrationContext`
- Add protocol-level features in `ProtocolRunner`
- Always include proper error handling and logging 