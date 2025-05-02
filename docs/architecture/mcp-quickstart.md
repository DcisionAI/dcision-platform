# MCP Quick Start Guide

## Prerequisites

1. Node.js and Yarn installed
2. GCP account with access to Cloud Run
3. OpenAI API key for LLM integration

## Setup

1. Clone the repository:
```bash
git clone https://github.com/your-org/dcisionai-platform.git
cd dcisionai-platform
```

2. Install dependencies:
```bash
yarn install
```

3. Set up environment variables:
```bash
# .env.local
OPENAI_API_KEY=your-api-key
ORTools_SERVICE_URL=https://solver-service-219323644585.us-central1.run.app
```

## Creating an MCP

1. Define your model:
```typescript
const model = {
  variables: [
    {
      name: 'vehicle_assignments',
      type: 'array',
      description: 'Vehicle assignments to tasks',
      min: 0,
      max: 1000
    }
  ],
  constraints: [
    {
      type: 'non_negativity',
      description: 'Vehicle assignments must be non-negative',
      field: 'vehicle_assignments',
      operator: 'gte',
      value: 0,
      priority: 'must'
    }
  ],
  objective: {
    type: 'minimize',
    field: 'total_distance',
    description: 'Minimize total distance traveled',
    weight: 1.0
  }
};
```

2. Define your context:
```typescript
const context = {
  environment: {
    region: 'us-central1',
    timezone: 'America/Chicago'
  },
  dataset: {
    internalSources: ['vehicles', 'locations', 'demands']
  },
  problemType: 'vehicle_routing',
  industry: 'logistics'
};
```

3. Define your protocol:
```typescript
const protocol = {
  steps: [
    {
      id: 'interpret',
      action: 'interpret_intent',
      description: 'Interpret the problem intent',
      required: true
    },
    {
      id: 'collect',
      action: 'collect_data',
      description: 'Collect data from internal sources',
      required: true,
      parameters: {
        tables: ['vehicles', 'locations', 'demands']
      }
    }
  ],
  allowPartialSolutions: true,
  explainabilityEnabled: true
};
```

4. Create the MCP:
```typescript
const mcp: MCP = {
  sessionId: 'test-session',
  version: '1.0',
  status: 'pending',
  created: new Date().toISOString(),
  lastModified: new Date().toISOString(),
  model,
  context,
  protocol
};
```

## Running the MCP

1. Initialize the agents:
```typescript
const intentInterpreter = new IntentInterpreterAgent();
const dataCollector = new DataCollectorAgent();
const dataEnricher = new DataEnricherAgent();
const modelBuilder = new ModelBuilderAgent();
const modelRunner = new ModelRunnerAgent();
const solutionExplainer = new SolutionExplainerAgent();
```

2. Run the MCP:
```typescript
async function runMCP(mcp: MCP) {
  // Step 1: Interpret intent
  const intentStep = mcp.protocol.steps.find(step => step.action === 'interpret_intent');
  const intentResult = await intentInterpreter.run(intentStep, mcp, {
    llmConfig: {
      model: 'gpt-4',
      temperature: 0.2,
      maxTokens: 500
    }
  });

  // Step 2: Collect data
  const collectStep = mcp.protocol.steps.find(step => step.action === 'collect_data');
  const collectResult = await dataCollector.run(collectStep, mcp);

  // Step 3: Enrich data
  const enrichStep = mcp.protocol.steps.find(step => step.action === 'enrich_data');
  const enrichResult = await dataEnricher.run(enrichStep, mcp, {
    previousResults: collectResult.output
  });

  // Step 4: Build model
  const buildStep = mcp.protocol.steps.find(step => step.action === 'build_model');
  const buildResult = await modelBuilder.run(buildStep, mcp, {
    previousResults: enrichResult.output
  });

  // Step 5: Solve model
  const solveStep = mcp.protocol.steps.find(step => step.action === 'solve_model');
  const solveResult = await modelRunner.run(solveStep, mcp, {
    previousResults: buildResult.output
  });

  // Step 6: Explain solution
  const explainStep = mcp.protocol.steps.find(step => step.action === 'explain_solution');
  const explainResult = await solutionExplainer.run(explainStep, mcp, {
    previousResults: {
      solution: solveResult.output,
      data: collectResult.output.data
    }
  });

  return {
    intent: intentResult,
    dataCollection: collectResult,
    dataEnrichment: enrichResult,
    modelBuilding: buildResult,
    solution: solveResult,
    explanation: explainResult
  };
}
```

## Testing

1. Run the end-to-end test:
```bash
yarn test server/mcp/tests/end_to_end_with_llm.test.ts
```

2. Run specific agent tests:
```bash
yarn test server/mcp/agents/__tests__/
```

## Best Practices

1. **Model Design**
   - Use descriptive variable names
   - Include comprehensive constraints
   - Define clear objectives

2. **Context Management**
   - Provide complete environment information
   - Specify all required data sources
   - Include domain-specific context

3. **Protocol Implementation**
   - Define clear step sequences
   - Include error handling
   - Enable human review when needed

## Troubleshooting

1. **Solver Service Issues**
   - Check GCP Cloud Run logs
   - Verify environment variables
   - Check network connectivity

2. **LLM Integration Issues**
   - Verify API key
   - Check rate limits
   - Review prompt engineering

3. **Data Collection Issues**
   - Verify data source availability
   - Check data format
   - Review validation rules

## Next Steps

1. Review the full [MCP Architecture Documentation](./mcp-architecture.md)
2. Explore the [Architecture Diagram](./mcp-architecture-diagram.md)
3. Check out the [API Documentation](../api/README.md) 