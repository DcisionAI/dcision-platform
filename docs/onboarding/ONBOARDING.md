# DcisionAI Platform - New Team Member Onboarding

## 🎯 Welcome to DcisionAI!

Welcome to the DcisionAI team! This comprehensive onboarding guide will help you understand our platform, architecture, and development workflows.

## 📋 Table of Contents

1. [Platform Overview](#platform-overview)
2. [Architecture Deep Dive](#architecture-deep-dive)
3. [Code Walkthrough](#code-walkthrough)
4. [Development Setup](#development-setup)
5. [How-To Guides](#how-to-guides)
6. [Best Practices](#best-practices)
7. [Resources & Support](#resources--support)

---

## 🏗️ Platform Overview

### What is DcisionAI?

DcisionAI is a modern, cloud-native platform for construction optimization and decision-making using mathematical optimization techniques.

### Core Capabilities

- **🏗️ Construction Optimization**: Project scheduling, resource allocation, cost optimization
- **🛒 Retail Optimization**: Inventory management, pricing optimization, demand forecasting  
- **💰 Finance Optimization**: Portfolio optimization, risk management, investment planning
- **🤖 AI-Powered Chat**: Natural language problem solving with GPT-4
- **📊 Real-time Analytics**: Live monitoring and insights
- **🔧 Multi-Solver Support**: HiGHS, OR-Tools, Gurobi, CPLEX

### Key Technologies

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express (via Next.js API routes)
- **Optimization**: Mathematical programming solvers
- **AI**: OpenAI GPT-4, Pinecone vector database
- **Infrastructure**: Google Cloud Run, Docker, Cloud Build

---

## 🏛️ Architecture Deep Dive

### System Architecture

DcisionAI uses a **single-service architecture** with the Next.js application handling both frontend and solver functionality. The platform is built around the **Model Context Protocol (MCP)** framework for structured optimization.

### Key Design Principles

1. **Single-Service Architecture**: Everything runs in one Next.js application
2. **MCP-First Design**: All optimization problems follow the Model Context Protocol
3. **API-First Design**: All functionality exposed via REST APIs
4. **Modular Components**: Reusable components and workflows
5. **Type Safety**: Full TypeScript coverage
6. **Cloud-Native**: Designed for Google Cloud Run deployment

### MCP (Model Context Protocol) Framework

The MCP is the heart of DcisionAI's structured optimization approach:

- **Structured Problems**: All optimization problems follow a standardized format
- **Auditable Decisions**: Complete execution history and explainability
- **Extensible Framework**: Easy integration of new solvers and domains
- **Step-by-Step Assembly**: Interactive MCP builder with 6-step workflow

**MCP Components**:
- **Model**: Variables, constraints, and objectives
- **Context**: Runtime and domain-specific information
- **Protocol**: Execution steps and configuration

---

## 📁 Code Walkthrough

### Project Structure

```
dcisionai-platform/
├── 📁 src/                          # Main source code
│   ├── 📁 components/               # React components
│   │   ├── 📁 layout/               # Layout components
│   │   ├── 📁 navbar/               # Navbar components
│   │   ├── 📁 sidebar/              # Sidebar components
│   │   ├── 📁 ui/                   # Reusable UI components
│   │   └── 📁 utils/                # Utility functions
│   ├── 📁 pages/                    # Next.js pages and API routes
│   │   ├── 📁 api/                  # API endpoints
│   │   │   ├── 📁 _lib/             # Shared library code
│   │   │   │   ├── 📁 solvers/      # Solver implementations
│   │   │   │   └── 📁 dcisionai-agents/ # AI agent implementations
│   │   │   ├── 📁 solver/           # Solver API routes
│   │   │   ├── 📁 construction/     # Construction workflow APIs
│   │   │   ├── 📁 retail/           # Retail workflow APIs
│   │   │   └── 📁 finance/          # Finance workflow APIs
│   │   ├── 📁 construction.tsx      # Construction workflow page
│   │   ├── 📁 retail.tsx            # Retail workflow page
│   │   └── 📁 finance.tsx           # Finance workflow page
│   ├── 📁 workflows/                # Domain-specific workflows
│   ├── 📁 lib/                      # Utility libraries
│   ├── 📁 styles/                   # Global styles
│   ├── 📁 types/                    # TypeScript type definitions
│   └── 📁 utils/                    # Utility functions
├── 📁 docs/                         # Documentation
├── 📁 scripts/                      # Build and deployment scripts
├── 📁 supabase/                     # Database migrations
├── 📁 terraform/                    # Infrastructure as code
├── 📄 Dockerfile                    # Production Docker image
├── 📄 cloudbuild.yaml               # Google Cloud Build config
└── 📄 package.json                  # Dependencies and scripts
```

### Key Directories Explained

#### `src/components/`
**Purpose**: Reusable React components
**Key Files**:
- `Layout.tsx` - Main application layout
- `Navbar.tsx` - Navigation component
- `Sidebar.tsx` - Sidebar navigation
- `ui/` - Reusable UI components

#### `src/pages/api/`
**Purpose**: Next.js API routes (backend endpoints)
**Key Directories**:
- `_lib/` - Shared backend code
- `solver/` - Optimization solver endpoints
- `construction/`, `retail/`, `finance/` - Domain-specific APIs

#### `src/workflows/`
**Purpose**: Domain-specific optimization workflows
**Structure**:
- Each domain has its own directory
- Contains components and logic specific to that domain
- Follows consistent patterns across domains

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js 20+**
- **npm or yarn**
- **Git**
- **Docker** (for deployment)
- **Google Cloud SDK** (for deployment)

### Local Development Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd dcisionai-platform

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp config.example.env .env.local
# Edit .env.local with your API keys

# 4. Start development server
npm run dev

# 5. Open http://localhost:3000
```

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your-openai-api-key
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-pinecone-environment

# Optional
NODE_ENV=development
NEXT_PUBLIC_SOLVER_URL=http://localhost:3000
```

### Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
npm run test         # Run tests
```

---

## 📚 How-To Guides

### 1. Adding New Decision Workflows

#### Overview
Decision workflows are domain-specific optimization interfaces (like Construction, Retail, Finance).

#### Step-by-Step Guide

**Step 1: Create Workflow Directory**
```bash
mkdir src/workflows/new-domain
mkdir src/workflows/new-domain/components
```

**Step 2: Create Workflow Components**
```typescript
// src/workflows/new-domain/components/NewDomainTabs.tsx
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

export function NewDomainTabs() {
  return (
    <Tabs defaultValue="optimization" className="w-full">
      <TabsList>
        <TabsTrigger value="optimization">Optimization</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="chat">AI Chat</TabsTrigger>
      </TabsList>
      
      <TabsContent value="optimization">
        {/* Optimization interface */}
      </TabsContent>
      
      <TabsContent value="analytics">
        {/* Analytics dashboard */}
      </TabsContent>
      
      <TabsContent value="chat">
        {/* Chat interface */}
      </TabsContent>
    </Tabs>
  );
}
```

**Step 3: Create API Routes**
```typescript
// src/pages/api/new-domain/chat.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle new domain chat requests
}
```

**Step 4: Create Page**
```typescript
// src/pages/new-domain.tsx
import { Layout } from '@/components/Layout';
import { NewDomainTabs } from '@/workflows/new-domain/components/NewDomainTabs';

export default function NewDomainPage() {
  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">New Domain Optimization</h1>
        <NewDomainTabs />
      </div>
    </Layout>
  );
}
```

**Step 5: Add Navigation**
```typescript
// src/components/Navbar.tsx
// Add new domain to navigation menu
```

**Step 6: Update Documentation**
- Add to architecture documentation
- Create domain-specific guides
- Update API documentation

#### Best Practices
- Follow existing workflow patterns
- Use consistent component naming
- Implement proper error handling
- Add comprehensive tests
- Document API endpoints

---

### 2. Adding New Solvers

#### Overview
Solvers are mathematical optimization engines (HiGHS, OR-Tools, Gurobi, CPLEX).

#### Step-by-Step Guide

**Step 1: Add Dependencies**
```bash
# For Node.js solvers
npm install <solver-package-name>

# For Python solvers (if using Python bridge)
pip install <solver-package-name>
```

**Step 2: Create Solver Implementation**
```typescript
// src/pages/api/_lib/solvers/new-solver.ts
import { SolverProblem, SolverSolution } from './types';

export interface NewSolverConfig {
  timeout?: number;
  maxIterations?: number;
}

export class NewSolver {
  private config: NewSolverConfig;

  constructor(config: NewSolverConfig = {}) {
    this.config = {
      timeout: 300000, // 5 minutes
      maxIterations: 1000,
      ...config
    };
  }

  async solveProblem(problem: SolverProblem): Promise<SolverSolution> {
    try {
      // 1. Parse problem into solver format
      const solverProblem = this.parseProblem(problem);
      
      // 2. Call the solver
      const result = await this.callSolver(solverProblem);
      
      // 3. Parse result back to standard format
      const solution = this.parseSolution(result);
      
      return solution;
    } catch (error) {
      throw new Error(`NewSolver error: ${error.message}`);
    }
  }

  private parseProblem(problem: SolverProblem): any {
    // Convert DcisionAI problem format to solver-specific format
  }

  private async callSolver(solverProblem: any): Promise<any> {
    // Make actual solver call
  }

  private parseSolution(result: any): SolverSolution {
    // Convert solver result to DcisionAI format
  }
}
```

**Step 3: Update Solver Client**
```typescript
// src/pages/api/_lib/MCPSolverClient.ts
export function createSolverClient(solverName: string): MCPSolverClient {
  const configs: Record<string, SolverConfig> = {
    // ... existing solvers ...
    
    'new-solver': {
      name: 'New Solver',
      endpoint: {
        type: 'http',
        url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
        apiKey: process.env.SOLVER_API_KEY
      },
      timeout: 300000,
      retries: 3
    }
  };
  // ... rest of function
}
```

**Step 4: Update API Endpoint**
```typescript
// src/pages/api/solver/solve.ts
switch (solver.toLowerCase()) {
  // ... existing cases ...
  
  case 'new-solver':
    const newSolver = new NewSolver();
    solution = await newSolver.solveProblem(problem);
    break;
}
```

**Step 5: Add Tests**
```typescript
// src/tests/solvers/new-solver.test.ts
import { NewSolver } from '../../pages/api/_lib/solvers/new-solver';

describe('NewSolver', () => {
  let solver: NewSolver;

  beforeEach(() => {
    solver = new NewSolver();
  });

  it('should solve a simple problem', async () => {
    const problem = {
      // Test problem definition
    };

    const solution = await solver.solveProblem(problem);
    
    expect(solution.status).toBe('optimal');
    expect(solution.objectiveValue).toBeDefined();
  });
});
```

**Step 6: Update Documentation**
- Add to solver status document
- Update implementation guide
- Add performance benchmarks

#### Best Practices
- Follow existing solver patterns
- Implement proper error handling
- Add comprehensive logging
- Test with various problem types
- Document solver-specific features

---

### 3. Adding New LLM Providers

#### Overview
LLM providers are AI services that power our chat and analysis features (currently OpenAI).

#### Step-by-Step Guide

**Step 1: Create Provider Interface**
```typescript
// src/lib/llm/types.ts
export interface LLMProvider {
  name: string;
  generateText(prompt: string, options?: any): Promise<string>;
  generateEmbeddings(text: string): Promise<number[]>;
  getModelInfo(): any;
}
```

**Step 2: Implement New Provider**
```typescript
// src/lib/llm/new-provider.ts
import { LLMProvider } from './types';

export class NewLLMProvider implements LLMProvider {
  name = 'New Provider';
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://api.newprovider.com';
  }

  async generateText(prompt: string, options?: any): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options?.model || 'default-model',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options?.maxTokens || 1000,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async generateEmbeddings(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/v1/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'embedding-model',
      }),
    });

    const data = await response.json();
    return data.data[0].embedding;
  }

  getModelInfo(): any {
    return {
      name: 'New Provider Model',
      maxTokens: 4000,
      supportsEmbeddings: true,
    };
  }
}
```

**Step 3: Create Provider Factory**
```typescript
// src/lib/llm/factory.ts
import { LLMProvider } from './types';
import { OpenAIProvider } from './openai';
import { NewLLMProvider } from './new-provider';

export function createLLMProvider(providerName: string, config: any): LLMProvider {
  switch (providerName.toLowerCase()) {
    case 'openai':
      return new OpenAIProvider(config.apiKey);
    case 'new-provider':
      return new NewLLMProvider(config.apiKey, config.baseUrl);
    default:
      throw new Error(`Unknown LLM provider: ${providerName}`);
  }
}
```

**Step 4: Update Configuration**
```typescript
// src/lib/llm/config.ts
export const LLM_CONFIG = {
  defaultProvider: process.env.DEFAULT_LLM_PROVIDER || 'openai',
  providers: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
    'new-provider': {
      apiKey: process.env.NEW_PROVIDER_API_KEY,
      baseUrl: process.env.NEW_PROVIDER_BASE_URL,
    },
  },
};
```

**Step 5: Update Usage**
```typescript
// src/pages/api/construction/chat.ts
import { createLLMProvider } from '@/lib/llm/factory';
import { LLM_CONFIG } from '@/lib/llm/config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const provider = createLLMProvider(LLM_CONFIG.defaultProvider, LLM_CONFIG.providers[LLM_CONFIG.defaultProvider]);
  
  const response = await provider.generateText(req.body.message);
  
  res.status(200).json({ response });
}
```

**Step 6: Add Environment Variables**
```bash
# .env.local
DEFAULT_LLM_PROVIDER=new-provider
NEW_PROVIDER_API_KEY=your-api-key
NEW_PROVIDER_BASE_URL=https://api.newprovider.com
```

**Step 7: Add Tests**
```typescript
// src/tests/llm/new-provider.test.ts
import { NewLLMProvider } from '../../lib/llm/new-provider';

describe('NewLLMProvider', () => {
  let provider: NewLLMProvider;

  beforeEach(() => {
    provider = new NewLLMProvider('test-api-key');
  });

  it('should generate text', async () => {
    const response = await provider.generateText('Hello, world!');
    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
  });

  it('should generate embeddings', async () => {
    const embeddings = await provider.generateEmbeddings('Hello, world!');
    expect(Array.isArray(embeddings)).toBe(true);
    expect(embeddings.length).toBeGreaterThan(0);
  });
});
```

#### Best Practices
- Implement consistent interface
- Add proper error handling
- Support rate limiting
- Add retry logic
- Document provider-specific features
- Test with various input types

---

## 🎯 Best Practices

### Code Quality

1. **TypeScript**: Use strict typing everywhere
2. **ESLint**: Follow linting rules
3. **Prettier**: Consistent code formatting
4. **Tests**: Write tests for new features
5. **Documentation**: Document all public APIs

### Git Workflow

1. **Branch Naming**: `feature/description` or `fix/description`
2. **Commit Messages**: Clear, descriptive messages
3. **Pull Requests**: Include tests and documentation
4. **Code Review**: All changes require review

### Performance

1. **API Optimization**: Minimize response times
2. **Caching**: Cache expensive operations
3. **Database Queries**: Optimize database access
4. **Bundle Size**: Keep frontend bundle small

### Security

1. **API Keys**: Never commit API keys
2. **Input Validation**: Validate all inputs
3. **Rate Limiting**: Implement rate limiting
4. **CORS**: Configure CORS properly

---

## 📖 Resources & Support

### Documentation

- **[Architecture Overview](architecture/architecture.md)**
- **[API Reference](api/README.md)**
- **[Solver Status](architecture/solver-status.md)**
- **[Adding New Solvers](architecture/adding-new-solvers.md)**

### Tools & Services

- **GitHub**: Code repository and issues
- **Google Cloud Console**: Deployment and monitoring
- **OpenAI Platform**: AI model access
- **Pinecone Console**: Vector database management

### Getting Help

1. **Documentation**: Check the docs first
2. **GitHub Issues**: Search existing issues
3. **Team Chat**: Ask in team communication channels
4. **Code Review**: Get feedback from team members

### Learning Resources

- **Next.js**: [Official Documentation](https://nextjs.org/docs)
- **TypeScript**: [Handbook](https://www.typescriptlang.org/docs/)
- **Mathematical Optimization**: [OR-Tools Guide](https://developers.google.com/optimization)
- **Google Cloud**: [Cloud Run Documentation](https://cloud.google.com/run/docs)

---

## 🚀 Next Steps

1. **Complete Setup**: Ensure your development environment is working
2. **Explore Codebase**: Familiarize yourself with the project structure
3. **Run Tests**: Make sure all tests pass
4. **Deploy Locally**: Test the full application
5. **Pick a Task**: Start with a small feature or bug fix
6. **Ask Questions**: Don't hesitate to ask for help

Welcome to the team! We're excited to have you on board. 🎉 