# DcisionAI Platform Architecture

## Overview

DcisionAI is a **horizontal agentic AI platform for enterprise decision support**, built as a single, cohesive Next.js application with sophisticated multi-agent AI capabilities. The platform uses construction optimization as a strategic wedge to expand into multiple industries.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                DcisionAI Platform (Next.js)             │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────────────────────┐ │
│  │   Frontend UI   │  │        API Routes               │ │
│  │                 │  │                                 │ │
│  │ • React Pages   │  │ • /api/solver                   │ │
│  │ • Components    │  │ • /api/agno                     │ │
│  │ • Workflows     │  │ • /api/docs                     │ │
│  │ • Chat Interface│  │ • /api/metrics                  │ │
│  │ • Agent Tabs    │  │ • /api/dcisionai/agentic/chat   │ │
│  └─────────────────┘  └─────────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Agentic AI Layer                       │ │
│  │                                                     │ │
│  │ • Message Bus (Event-Driven Communication)          │ │
│  │ • Intent Agent                                      │ │
│  │ • Data Agent                                        │ │
│  │ • Model Builder Agent                               │ │
│  │ • Solver Agent                                      │ │
│  │ • Explain Agent                                     │ │
│  │ • Critique Agent                                    │ │
│  │ • Debate Agent                                      │ │
│  │ • Coordinator Agent                                 │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Optimization Engine                    │ │
│  │                                                     │ │
│  │ • HiGHS Solver (Binary)                             │ │
│  │ • MCP Protocol Implementation                       │ │
│  │ • Multi-Solver Management                           │ │
│  │ • Construction-Specific Templates                   │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Message Bus System

The platform uses an **event-driven message bus** for agent communication, enabling true agentic interactions:

```typescript
interface MessageBus {
  // Event-driven communication
  publish(event: AgentEvent): void;
  subscribe(eventType: string, handler: EventHandler): void;
  
  // Agent coordination
  routeMessage(message: AgentMessage): Promise<void>;
  broadcastUpdate(update: SystemUpdate): void;
}
```

**Key Features:**
- **Event-Driven Architecture**: Agents publish and subscribe to events
- **Dynamic Routing**: LLM-powered message routing between agents
- **Real-time Updates**: Live progress updates and agent status
- **Debate & Critique**: Multi-agent debate and output review

### 2. Agentic AI Layer

#### Agent Types

**Core Decision Agents:**
- **Intent Agent**: Analyzes user intent and problem classification
- **Data Agent**: Handles data preparation and validation
- **Model Builder Agent**: Creates optimization models and constraints
- **Solver Agent**: Executes mathematical optimization
- **Explain Agent**: Generates explanations and insights

**Advanced Agentic Agents:**
- **Critique Agent**: Reviews and critiques other agents' outputs
- **Debate Agent**: Engages in one-on-one debates with other agents
- **Coordinator Agent**: Uses LLM to dynamically route messages and coordinate workflows

#### Agentic Capabilities

**Current Level: 2.5/5 (Agentic-Ready)**

```typescript
interface AgenticCapabilities {
  // ✅ Implemented
  multiAgentArchitecture: true;
  eventDrivenCommunication: true;
  llmPoweredCoordination: true;
  agentDebate: true;
  agentCritique: true;
  
  // ⚠️ Partial
  dynamicWorkflow: true; // But limited autonomy
  agentMemory: false; // No persistent memory
  
  // ❌ Missing
  agentLearning: false;
  agentAutonomy: false;
  selfImprovement: false;
  emergentBehavior: false;
}
```

### 3. MCP (Model Context Protocol) Implementation

The platform implements a comprehensive MCP protocol for optimization problems:

```typescript
interface MCPProtocol {
  // Core MCP types
  variables: Variable[];
  constraints: Constraint[];
  objectives: Objective[];
  
  // Protocol configuration
  steps: Step[];
  allowPartialSolutions: boolean;
  explainabilityEnabled: boolean;
  
  // Context management
  environment: Environment;
  dataset: Dataset;
  problem: ProblemMetadata;
}
```

**Features:**
- **Standardized Optimization**: Universal protocol across industries
- **Solver Integration**: HiGHS solver with MCP compatibility
- **Context Management**: Rich problem context and metadata
- **Extensible Design**: Easy to add new solvers and domains

### 4. Optimization Engine

**HiGHS Solver Integration:**
- **Binary Distribution**: Self-contained solver binary
- **Multiple Formats**: LP, MIP, QP problem support
- **Performance**: High-performance mathematical optimization
- **Reliability**: Production-ready solver engine

**Template System:**
- **Construction Templates**: Pre-built optimization models
- **Domain-Specific**: Industry-tailored constraints and objectives
- **Extensible**: Easy to add new industry templates

## Agent Communication Flow

### Traditional Orchestrated Flow
```
User → Orchestrator → Intent Agent → Data Agent → Model Builder → Solver → Explain Agent → User
```

### New Agentic Flow (Message Bus)
```
User → Message Bus → [Agents Subscribe/Publish Events] → Dynamic Routing → LLM Coordination → User
```

**Key Differences:**
- **Event-Driven**: Agents publish events, others subscribe
- **Dynamic Routing**: LLM decides which agent should handle each message
- **Agent Autonomy**: Agents can initiate conversations, debates, and critiques
- **Real-time Updates**: Live progress and status updates

## Agent Debate & Collaboration System

### One-on-One Debates
```typescript
interface DebateAgent {
  async debate(opponent: Agent, topic: string): Promise<DebateResult> {
    // Structured debate with rounds
    // Challenge and counter-arguments
    // LLM-powered evaluation
    // Winner determination
  }
}
```

### Multi-Agent Debates
```typescript
interface MultiAgentDebate {
  async groupDebate(agents: Agent[], topic: string): Promise<GroupDebateResult> {
    // Multiple agents participate
    // Structured debate rounds
    // Collective decision making
    // Consensus building
  }
}
```

## UI/UX & API Integration

- **Agentic Chat API**: `/api/dcisionai/agentic/chat` (returns agentic response format)
- **UI Tabs**: Agent Response, Agent Collaboration, Solution Details, Explanation
- **Real-Time Progress**: Live workflow and agent status updates

## Horizontal Platform Strategy

### Construction as Wedge
- **Market Size**: $1.6T globally
- **High Pain**: Complex optimization problems
- **Willingness to Pay**: Visible cost savings
- **Perfect Use Case**: Multi-agent coordination

### Expansion Pathways
```typescript
interface HorizontalExpansion {
  manufacturing: "Supply chain optimization, production planning";
  logistics: "Route optimization, fleet management";
  energy: "Grid optimization, renewable energy planning";
  healthcare: "Resource allocation, patient scheduling";
  finance: "Portfolio optimization, risk management";
  retail: "Inventory optimization, demand forecasting";
}
```

## Technical Stack

### Frontend
- **Next.js**: React framework with API routes
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **React Components**: Modular UI architecture

### Backend
- **Node.js**: Server-side JavaScript
- **API Routes**: Next.js API endpoints
- **Message Bus**: In-memory event system
- **Agent Orchestration**: LLM-powered coordination

### AI/ML
- **OpenAI GPT-4o-mini**: LLM for agent coordination
- **Agentic AI**: Multi-agent decision support
- **Mathematical Optimization**: HiGHS solver
- **MCP Protocol**: Standardized optimization interface

### Infrastructure
- **Vercel**: Frontend deployment
- **Supabase**: Database and authentication
- **Pinecone**: Vector database for embeddings
- **Docker**: Containerization for solver

## Roadmap

### Short-term (3-6 months)
- **Agent Memory**: Persistent agent experience storage
- **Self-Assessment**: Agent performance evaluation
- **Dynamic MCP**: Adaptive protocol optimization

### Medium-term (6-12 months)
- **Agent Learning**: Experience-based improvement
- **Advanced DSS**: Scenario and sensitivity analysis
- **Multi-Industry**: 3+ industry templates

### Long-term (12+ months)
- **Level 4 Agentic**: True agent autonomy
- **Emergent Behavior**: Self-organizing systems
- **Platform APIs**: Developer-friendly horizontal APIs

## Conclusion

DcisionAI is now a **Level 2.5+ agentic platform** with a robust message bus, agent debate, critique, and a modern UI/UX. The foundation is set for Level 4 autonomy and horizontal expansion.