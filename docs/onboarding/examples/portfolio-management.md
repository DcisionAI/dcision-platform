# Adding Portfolio Management Support

This guide walks through the process of adding portfolio management support to the DcisionAI platform. We'll cover all aspects from MCP changes to UI implementation.

## Overview

Portfolio management involves optimizing the allocation of resources across multiple projects or investments. We'll implement this as a new problem type in the platform.

## Step 1: Define MCP Types

First, let's define the necessary types in the MCP:

```typescript
// server/mcp/types/PortfolioTypes.ts
export interface PortfolioVariable {
  name: string;
  type: 'investment' | 'project';
  description: string;
  minAllocation: number;
  maxAllocation: number;
  expectedReturn: number;
  risk: number;
}

export interface PortfolioConstraint {
  type: 'budget' | 'risk' | 'diversification';
  description: string;
  field: string;
  value: number;
}

export interface PortfolioObjective {
  type: 'maximize_return' | 'minimize_risk' | 'maximize_sharpe_ratio';
  description: string;
}

export interface PortfolioContext {
  problemType: 'portfolio_optimization';
  industry: 'finance' | 'project_management';
  environment: {
    timeHorizon: string;
    riskTolerance: 'low' | 'medium' | 'high';
  };
  dataset: {
    historicalReturns?: string[];
    riskMetrics?: string[];
  };
}
```

## Step 2: Create Portfolio Agent

Create a new agent for portfolio optimization:

```typescript
// server/mcp/agents/PortfolioAgent.ts
import { MCPAgent, AgentRunContext, AgentRunResult } from './AgentRegistry';
import { StepAction, ProtocolStep, MCP } from '../types';
import { PortfolioContext } from '../types/PortfolioTypes';

export class PortfolioAgent implements MCPAgent {
  name = 'Portfolio Optimization Agent';
  supportedActions: StepAction[] = ['build_model', 'solve_model'];

  async run(step: ProtocolStep, mcp: MCP, context?: AgentRunContext): Promise<AgentRunResult> {
    const thoughtProcess: string[] = [];
    
    if (step.action === 'build_model') {
      return this.buildPortfolioModel(mcp, thoughtProcess);
    } else if (step.action === 'solve_model') {
      return this.solvePortfolioModel(mcp, thoughtProcess);
    }

    throw new Error(`Unsupported action: ${step.action}`);
  }

  private async buildPortfolioModel(mcp: MCP, thoughtProcess: string[]): Promise<AgentRunResult> {
    thoughtProcess.push('Building portfolio optimization model...');
    
    // Implementation details...
    
    return {
      output: {
        success: true,
        model: 'Portfolio Optimization Model',
        readyToSolve: true
      },
      thoughtProcess: thoughtProcess.join('\n')
    };
  }

  private async solvePortfolioModel(mcp: MCP, thoughtProcess: string[]): Promise<AgentRunResult> {
    thoughtProcess.push('Solving portfolio optimization model...');
    
    // Implementation details...
    
    return {
      output: {
        success: true,
        solution: {
          allocations: [],
          expectedReturn: 0,
          risk: 0
        }
      },
      thoughtProcess: thoughtProcess.join('\n')
    };
  }
}
```

## Step 3: Register the Agent

Add the agent to the registry:

```typescript
// server/mcp/agents/index.ts
import { agentRegistry } from './AgentRegistry';
import { PortfolioAgent } from './PortfolioAgent';

// Register agents
agentRegistry.register(new PortfolioAgent());
```

## Step 4: Create UI Components

Create the necessary UI components:

```typescript
// src/components/portfolio/PortfolioForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';

interface PortfolioFormData {
  investments: Array<{
    name: string;
    expectedReturn: number;
    risk: number;
  }>;
  constraints: {
    budget: number;
    riskTolerance: 'low' | 'medium' | 'high';
  };
}

export function PortfolioForm() {
  const { register, handleSubmit } = useForm<PortfolioFormData>();

  const onSubmit = async (data: PortfolioFormData) => {
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

## Step 5: Create API Endpoints

Add API endpoints for portfolio management:

```typescript
// src/pages/api/portfolio/optimize.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { orchestrateMCP } from '@server/mcp/orchestrator';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const mcp = createPortfolioMCP(req.body);
    const results = await orchestrateMCP(mcp);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

## Step 6: Add Portfolio Page

Create a new page for portfolio management:

```typescript
// src/pages/portfolio/index.tsx
import { PortfolioForm } from '@/components/portfolio/PortfolioForm';
import { PortfolioResults } from '@/components/portfolio/PortfolioResults';

export default function PortfolioPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Portfolio Optimization</h1>
      <PortfolioForm />
      <PortfolioResults />
    </div>
  );
}
```

## Step 7: Update Navigation

Add portfolio management to the navigation:

```typescript
// src/components/layout/Navigation.tsx
const navigationItems = [
  // ... existing items
  {
    name: 'Portfolio',
    href: '/portfolio',
    icon: ChartBarIcon,
  },
];
```

## Step 8: Testing

Create tests for the new functionality:

```typescript
// tests/portfolio/PortfolioAgent.test.ts
import { PortfolioAgent } from '@server/mcp/agents/PortfolioAgent';

describe('PortfolioAgent', () => {
  it('should build portfolio model', async () => {
    const agent = new PortfolioAgent();
    const result = await agent.run(
      { action: 'build_model' },
      createTestMCP()
    );
    expect(result.output.success).toBe(true);
  });

  it('should solve portfolio model', async () => {
    const agent = new PortfolioAgent();
    const result = await agent.run(
      { action: 'solve_model' },
      createTestMCP()
    );
    expect(result.output.success).toBe(true);
  });
});
```

## Step 9: Documentation

Update documentation to include portfolio management:

1. Add to user manual
2. Create API documentation
3. Add example use cases
4. Document constraints and limitations

## Step 10: Deployment

1. Update deployment configuration
2. Add environment variables
3. Update monitoring
4. Set up alerts

## Best Practices

1. **Error Handling**
   - Validate inputs
   - Handle edge cases
   - Provide meaningful error messages

2. **Performance**
   - Optimize model solving
   - Cache results
   - Use efficient algorithms

3. **Security**
   - Validate user input
   - Implement access control
   - Protect sensitive data

4. **Testing**
   - Unit tests
   - Integration tests
   - Performance tests
   - Security tests

## Related Documents

- [MCP Protocol Specification](../architecture/mcp/protocol.md)
- [Agent System Architecture](../architecture/mcp/agents.md)
- [API Documentation](../api/README.md)
- [Deployment Guide](../deployment/README.md) 