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
│  │ • Agent Progress│  │ • /api/test-choreographed-workflow │
│  └─────────────────┘  └─────────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Choreographed Agentic AI Layer         │ │
│  │                                                     │ │
│  │ • ChoreographedOrchestrator (Workflow Coordinator)  │ │
│  │ • Event-Driven Message Bus System                   │ │
│  │ • Intent Agent (Intent Analysis & Routing)          │ │
│  │ • Data Agent (Data Preparation & Validation)        │ │
│  │ • Model Builder Agent (Optimization Model Creation) │ │
│  │ • Solver Agent (Mathematical Optimization)          │ │
│  │ • Response Agent (Final Response Assembly)          │ │
│  │ • Knowledge Agent (RAG & Document Retrieval)        │ │
│  │ • Explain Agent (Solution Explanation)              │ │
│  │ • Critique Agent (Output Review & Validation)       │ │
│  │ • Debate Agent (Multi-Agent Reasoning)              │ │
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

### 1. ChoreographedOrchestrator

The **ChoreographedOrchestrator** is the central workflow coordinator that manages the entire multi-agent decision process:

```typescript
interface ChoreographedOrchestrator {
  // Workflow Management
  startWorkflow(event: UserQueryEvent): Promise<void>;
  handleAgentEvent(event: AgentEvent): void;
  completeWorkflow(session: WorkflowSession): Promise<void>;
  
  // Session Management
  workflowSessions: Map<string, WorkflowSession>;
  timeoutHandlers: Map<string, NodeJS.Timeout>;
  
  // Event Routing
  triggerIntentAnalysis(event: Message): Promise<void>;
  triggerDataPreparation(event: Message): Promise<void>;
  triggerModelBuilding(event: Message): Promise<void>;
  triggerResponseGeneration(event: Message): Promise<void>;
}
```

**Key Features:**
- **Session Management**: Tracks workflow sessions with correlation IDs
- **Event Routing**: Routes events between agents based on workflow state
- **Timeout Handling**: 5-minute timeout with graceful cleanup
- **Progress Tracking**: Real-time workflow progress and status updates
- **Error Recovery**: Comprehensive error handling and fallback mechanisms

### 2. Event-Driven Message Bus System

The platform uses a sophisticated **event-driven message bus** for agent communication:

```typescript
interface MessageBus {
  // Event Publishing & Subscription
  publish(event: AgentEvent): void;
  subscribe(eventType: string, handler: EventHandler): void;
  subscribe('*', handler: EventHandler): void; // Wildcard subscription
  
  // Event Routing
  routeMessage(message: AgentMessage): Promise<void>;
  broadcastUpdate(update: SystemUpdate): void;
}
```

**Event Types:**
```typescript
const EVENT_TYPES = {
  // User Input Events
  USER_QUERY_RECEIVED: 'user_query_received',
  INTENT_IDENTIFIED: 'intent_identified',
  
  // Workflow Events
  WORKFLOW_STARTED: 'workflow_started',
  WORKFLOW_COMPLETED: 'workflow_completed',
  WORKFLOW_FAILED: 'workflow_failed',
  WORKFLOW_TIMEOUT: 'workflow_timeout',
  
  // Optimization Events
  OPTIMIZATION_REQUESTED: 'optimization_requested',
  DATA_PREPARED: 'data_prepared',
  MODEL_BUILT: 'model_built',
  SOLUTION_FOUND: 'solution_found',
  
  // Response Events
  RESPONSE_GENERATION_STARTED: 'response_generation_started',
  RESPONSE_GENERATED: 'response_generated',
  
  // Progress Events
  PROGRESS_UPDATE: 'progress_update',
  AGENT_STATUS_UPDATE: 'agent_status_update'
};
```

### 3. Agentic AI Layer

#### Core Decision Agents

**Intent Agent** (`src/agent/IntentAgent.ts`):
- Analyzes user queries using keyword heuristics and AI
- Identifies optimization vs knowledge retrieval requests
- Provides confidence scores and decision types
- Publishes `INTENT_IDENTIFIED` events

**Data Agent** (`src/agent/DataAgent.ts`):
- Handles data preparation and validation
- Extracts parameters from user queries
- Generates resource data and constraints
- Publishes `DATA_PREPARED` events

**Model Builder Agent** (`src/agent/ModelBuilderAgent.ts`):
- Creates optimization models and constraints
- Generates MCP protocol configurations
- Validates model configurations
- Publishes `MODEL_BUILT` events

**Solver Agent** (`src/agent/SolverAgent.ts`):
- Executes mathematical optimization using HiGHS
- Handles multiple optimization formats (LP, MIP, QP)
- Provides solution validation and metrics
- Publishes `SOLUTION_FOUND` events

**Response Agent** (`src/agent/ResponseAgent.ts`):
- Assembles final responses from multiple agents
- Handles multiple execution paths
- Aggregates metadata and results
- Publishes `RESPONSE_GENERATED` events

#### Advanced Agentic Agents

**Knowledge Agent** (`src/agent/KnowledgeAgent.ts`):
- Handles RAG (Retrieval-Augmented Generation)
- Manages document retrieval and context
- Provides knowledge-based responses
- Publishes `KNOWLEDGE_RETRIEVED` events

**Explain Agent** (`src/agent/ExplainAgent.ts`):
- Generates explanations and insights
- Creates visualizations and charts
- Provides solution interpretation
- Publishes `EXPLANATION_READY` events

**Critique Agent** (`src/agent/CritiqueAgent.ts`):
- Reviews and critiques other agents' outputs
- Validates solution quality and feasibility
- Provides improvement suggestions
- Publishes `CRITIQUE_READY` events

**Debate Agent** (`src/agent/DebateAgent.ts`):
- Engages in structured debates with other agents
- Facilitates multi-agent reasoning
- Builds consensus and resolves conflicts
- Publishes `DEBATE_READY` events

**Coordinator Agent** (`src/agent/CoordinatorAgent.ts`):
- Uses LLM to dynamically route messages
- Coordinates complex multi-agent workflows
- Manages agent interactions and dependencies
- Provides intelligent workflow orchestration

### 4. Base Agent Framework

All agents inherit from the **BaseAgent** class (`src/agent/BaseAgent.ts`):

```typescript
interface BaseAgent {
  // Configuration
  config: AgentConfig;
  context: AgentContext;
  
  // Event Handling
  subscribeToEvents(): void;
  handleEvent(event: Message): Promise<void>;
  publish(event: Message): void;
  
  // Error Handling
  retryWithBackoff<T>(operation: () => Promise<T>): Promise<T>;
  handleError(error: Error, context: string): void;
  
  // Progress Tracking
  updateProgress(step: string, status: string, message: string): void;
}
```

**Key Features:**
- **Retry Logic**: Exponential backoff with configurable retries
- **Context Management**: Session and correlation ID tracking
- **Progress Tracking**: Real-time progress updates
- **Error Handling**: Comprehensive error recovery and logging

### 5. MCP (Model Context Protocol) Implementation

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

### 6. Optimization Engine

**HiGHS Solver Integration:**
- **Binary Distribution**: Self-contained solver binary
- **Multiple Formats**: LP, MIP, QP problem support
- **Performance**: High-performance mathematical optimization
- **Reliability**: Production-ready solver engine

**Template System:**
- **Construction Templates**: Pre-built optimization models
- **Domain-Specific**: Industry-tailored constraints and objectives
- **Extensible**: Easy to add new industry templates

## Choreographed Workflow Flow

### Complete Workflow Process
```
User Query → ChoreographedOrchestrator → Intent Agent → [Decision Point]
                                                          ↓
                    ┌─────────────────────────────────────┴─────────────────────────────────────┐
                    ↓                                                                             ↓
            Knowledge Retrieval Path                                              Optimization Path
                    ↓                                                                             ↓
            Knowledge Agent → Response Agent → Final Response                    Data Agent → Model Builder → Solver Agent → Response Agent → Final Response
```

### Event Flow Sequence

1. **User Query Received**
   ```
   USER_QUERY_RECEIVED → ChoreographedOrchestrator.startWorkflow()
   ```

2. **Intent Analysis**
   ```
   ChoreographedOrchestrator → Intent Agent → INTENT_IDENTIFIED
   ```

3. **Path Decision**
   ```
   INTENT_IDENTIFIED → ChoreographedOrchestrator.routeToPath()
   ```

4. **Optimization Path** (if optimization required)
   ```
   OPTIMIZATION_REQUESTED → Data Agent → DATA_PREPARED
   DATA_PREPARED → Model Builder → MODEL_BUILT
   MODEL_BUILT → Solver Agent → SOLUTION_FOUND
   SOLUTION_FOUND → Response Agent → RESPONSE_GENERATED
   ```

5. **Knowledge Path** (if knowledge retrieval required)
   ```
   KNOWLEDGE_RETRIEVAL_REQUESTED → Knowledge Agent → KNOWLEDGE_RETRIEVED
   KNOWLEDGE_RETRIEVED → Response Agent → RESPONSE_GENERATED
   ```

6. **Workflow Completion**
   ```
   RESPONSE_GENERATED → ChoreographedOrchestrator.completeWorkflow()
   WORKFLOW_COMPLETED → Final Response to User
   ```

## Agent Communication & Collaboration

### Event-Driven Communication
- **Publish/Subscribe Pattern**: Agents publish events, others subscribe
- **Correlation ID Tracking**: All events linked to workflow sessions
- **Real-time Updates**: Live progress and status updates
- **Error Propagation**: Comprehensive error handling across agents

### Multi-Agent Debates
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

### Agent Critique System
```typescript
interface CritiqueAgent {
  async critique(agentOutput: any, criteria: string[]): Promise<CritiqueResult> {
    // Quality assessment
    // Feasibility validation
    // Improvement suggestions
    // Confidence scoring
  }
}
```

## UI/UX & API Integration

### Agentic Chat API
- **Endpoint**: `/api/dcisionai/agentic/chat`
- **Response Format**: Agentic response with multiple execution paths
- **Real-time Progress**: Live workflow and agent status updates

### UI Components
- **Agent Response Tab**: Final optimized response
- **Agent Collaboration Tab**: Multi-agent debate and critique
- **Solution Details Tab**: Mathematical solution and constraints
- **Explanation Tab**: AI-generated explanations and insights
- **Agent Progress**: Real-time workflow progress visualization

### Test Endpoints
- **Simple Intent Test**: `/api/test-simple-intent`
- **Choreographed Workflow Test**: `/api/test-choreographed-workflow`
- **Agent Status**: Real-time agent and workflow monitoring

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
- **Message Bus**: Event-driven communication system
- **Agent Orchestration**: Choreographed workflow coordination

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

## Current Development Status

### ✅ Fully Functional Components
- **IntentAgent**: Intent analysis and routing
- **Event System**: Message bus and event routing
- **BaseAgent Framework**: Retry logic and error handling
- **Mock Intent Analysis**: Fallback when external services unavailable

### ⚠️ Partially Working Components
- **ChoreographedOrchestrator**: Intent analysis works, workflow orchestration needs fixes
- **DataAgent**: Complete but not integrated in simplified workflow
- **ModelBuilderAgent**: Fixed errors but not integrated
- **SolverAgent**: Functional but has looping issues
- **ResponseAgent**: Complete but not receiving proper events

### ❌ Issues to Address
- **Complete Workflow Orchestration**: Workflow times out after intent analysis
- **Event Flow**: Response generation not completing
- **Agent Looping**: Multiple event processing causing loops
- **Agno Backend Integration**: External service not available

## Next Steps

### Priority 1: Fix Event Flow
1. Debug ResponseAgent event reception
2. Fix SolverAgent looping issues
3. Complete workflow integration

### Priority 2: Production Readiness
1. Agno backend setup and integration
2. Comprehensive error handling
3. Monitoring and alerting

### Priority 3: Advanced Features
1. Agent memory and learning
2. Dynamic workflow adaptation
3. Self-assessment capabilities