# DcisionAI Platform Documentation

## Overview

DcisionAI is building the **world's first horizontal agentic AI platform for enterprise decision support**, using construction optimization as a strategic wedge to expand into multiple industries. Our platform combines sophisticated multi-agent AI with mathematical optimization to solve complex business problems.

## Platform Architecture

### Choreographed Agentic AI Layer

Our platform features a **choreographed multi-agent system** with **event-driven communication** via a message bus:

- **ChoreographedOrchestrator**: Central workflow coordinator managing multi-agent decision processes
- **Core Decision Agents**: Intent, Data, Model Builder, Solver, Response
- **Advanced Agentic Agents**: Knowledge, Explain, Critique, Debate, Coordinator
- **Event-Driven Message Bus**: Real-time communication between agents (publish/subscribe)
- **Session Management**: Workflow session tracking with correlation IDs and timeout handling
- **Agent Debate & Critique**: Agents can debate, critique, and collaborate
- **UI/UX**: Palantir-style tabs for Agent Response, Collaboration, Solution, and Explanation

### Current Agentic Level: 2.5/5 (Agentic-Ready)

**✅ Implemented:**
- Choreographed multi-agent architecture
- Event-driven message bus system
- Intent analysis and routing
- Base agent framework with retry logic
- Mock fallback systems

**🔄 In Progress:**
- Complete workflow orchestration
- Agent memory and learning
- Dynamic workflow adaptation
- Self-assessment capabilities

**❌ Planned:**
- True agent autonomy
- Self-improvement mechanisms
- Emergent behaviors

## Key Features

### 1. Choreographed Workflow System
- **Event-Driven Communication**: Agents publish and subscribe to events via the message bus
- **Workflow Orchestration**: Centralized coordination with ChoreographedOrchestrator
- **Session Management**: Workflow session tracking with correlation IDs and timeout handling
- **Agent Debates & Collaboration**: Structured multi-agent discussions, critique, and consensus
- **Quality Assurance**: Built-in critique and validation system
- **UI/UX**: Agent Response, Collaboration, Solution, and Explanation tabs

### 2. MCP (Model Context Protocol)
- **Standardized Optimization**: Universal protocol across industries
- **HiGHS Solver Integration**: Production-grade mathematical optimization
- **Rich Context Management**: Comprehensive problem context and metadata
- **Extensible Design**: Easy to add new solvers and domains

### 3. Horizontal Platform Strategy
- **Construction Wedge**: $1.6T market with proven ROI
- **Horizontal Expansion**: Manufacturing, logistics, energy, healthcare, finance, retail

## Choreographed Workflow Process

### Complete Workflow Flow
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
1. **User Query Received** → ChoreographedOrchestrator.startWorkflow()
2. **Intent Analysis** → Intent Agent → INTENT_IDENTIFIED
3. **Path Decision** → ChoreographedOrchestrator.routeToPath()
4. **Optimization Path** → Data Agent → Model Builder → Solver Agent → Response Agent
5. **Knowledge Path** → Knowledge Agent → Response Agent
6. **Workflow Completion** → Final Response to User

## API & UI Integration

- **Agentic Chat API**: `/api/dcisionai/agentic/chat` (returns agentic response format)
- **Test Endpoints**: `/api/test-simple-intent` and `/api/test-choreographed-workflow`
- **UI Tabs**: Agent Response, Agent Collaboration, Solution Details, Explanation
- **Real-Time Progress**: Live workflow and agent status updates

## Use Cases

### Construction (Primary Wedge)
- Resource allocation optimization
- Project scheduling and risk management
- Cost optimization and quality control
- Multi-stakeholder decision support

### Adjacent Markets
- **Manufacturing**: Supply chain and production optimization
- **Logistics**: Route optimization and fleet management
- **Energy**: Grid optimization and renewable energy planning
- **Healthcare**: Resource allocation and patient scheduling
- **Finance**: Portfolio optimization and risk management

## Technical Documentation

### Architecture
- [Platform Architecture](./architecture/architecture.md) - System design and components
- [Choreographed Workflow System](./CHOREOGRAPHED_WORKFLOW_SYSTEM.md) - Multi-agent orchestration engine
- [Services Architecture](./SERVICES_ARCHITECTURE.md) - Comprehensive service design and decisions
- [MCP Overview](./architecture/mcp-overview.md) - Model Context Protocol implementation
- [HiGHS Integration](./architecture/HIGHS-INTEGRATION_GUIDE.md) - Solver integration guide
- [Adding New Solvers](./architecture/adding-new-solvers.md) - Extending solver capabilities

### Agentic AI
- [Choreographed Workflow Status](./CHOREOGRAPHED_WORKFLOW_STATUS.md) - Current development status and issues
- [Orchestration Improvements](./ORCHESTRATION_IMPROVEMENTS.md) - Message bus and agentic architecture
- [Intent Agent Routing](./INTENT_AGENT_ROUTING_GUIDE.md) - Dynamic agent routing
- [Model Builder Improvements](./MODEL_BUILDER_IMPROVEMENTS.md) - Enhanced model generation
- [Explain Agent Improvements](./EXPLAIN_AGENT_IMPROVEMENTS.md) - Solution explanation capabilities
- [Agentic Testing Guide](./AGENTIC_TESTING_GUIDE.md) - Comprehensive testing procedures for all use cases

### Platform Features
- [GPT-4o-mini Integration](./GPT4O_MINI_INTEGRATION.md) - LLM integration and optimization
- [Robust Flow Improvements](./ROBUST_FLOW_IMPROVEMENTS.md) - Error handling and reliability
- [Static Dashboard](./static-dashboard.md) - Dashboard capabilities
- [Code Hygiene](./CodeHygiene.md) - Development standards and practices

## Business Documentation

### Investment & Strategy
- [VC Due Diligence Report](./VC_DUE_DILIGENCE_REPORT.md) - Comprehensive investment assessment
- [Investment Thesis](./dcision-investment-thesis.md) - Business strategy and market opportunity
- [Market Analysis](./dcision-market-analysis.md) - Market size and competitive landscape
- [409A Valuation](./409A.md) - Company valuation analysis

### Platform Overview
- [Platform Overview](./platform-overview.md) - High-level platform description
- [Deployment Guide](./DEPLOYMENT.md) - Platform deployment instructions
- [Platform Deployment](./DEPLOYMENT-PLATFORM.md) - Production deployment guide

## API Documentation

### Core APIs
- [API Reference](./api/README.md) - Complete API documentation
- [Authentication](./api/authentication.md) - API authentication and security
- [Rate Limiting](./api/rate-limiting.md) - API usage limits and quotas
- [Webhooks](./api/webhooks.md) - Real-time event notifications
- [SDK Documentation](./api/sdk.md) - Client library documentation

### SDK
- [JavaScript SDK](./sdk/README.md) - JavaScript/TypeScript client library
- [SDK Examples](./sdk/) - Code examples and integration guides

## Development Documentation

### Onboarding
- [Development Guide](./onboarding/DEVELOPMENT.md) - Development environment setup
- [Onboarding Guide](./onboarding/ONBOARDING.md) - New team member onboarding

### Architecture Guides
- [MCP Overview](./architecture/mcp-overview.md) - Model Context Protocol
- [Solver Service Deployment](./architecture/SOLVER-SERVICE-DEPLOYMENT.md) - Solver deployment
- [Solver Status](./architecture/solver-status.md) - Solver monitoring and health

## Project Management

### Development
- [Standup Notes](./standup.md) - Daily development updates
- [TODO List](./todo.md) - Development tasks and priorities
- [ODC](./ODC.md) - Operational decision context

## Current Development Status

### ✅ Fully Functional Components
- **IntentAgent**: Intent analysis and routing with keyword heuristics
- **Event System**: Message bus and event routing with correlation IDs
- **BaseAgent Framework**: Retry logic, error handling, and progress tracking
- **Mock Intent Analysis**: Robust fallback when external services unavailable
- **Session Management**: Workflow session tracking and timeout handling

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

## Getting Started

### Quick Start
1. **Clone the repository**
   ```bash
   git clone https://github.com/dcisionai/dcisionai-platform.git
   cd dcisionai-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Test the choreographed workflow**
   ```bash
   curl -X POST http://localhost:3000/api/test-simple-intent \
     -H "Content-Type: application/json" \
     -d '{"query": "Optimize crew assignments for our 3-story office building project"}'
   ```

### Testing the Choreographed Workflow

1. **Simple Intent Test**
   ```bash
   curl -X POST http://localhost:3000/api/test-simple-intent \
     -H "Content-Type: application/json" \
     -d '{"query": "Optimize crew assignments for our 3-story office building project with 20 workers available and a 6-month timeline"}'
   ```

2. **Choreographed Workflow Test**
   ```bash
   curl -X POST http://localhost:3000/api/test-choreographed-workflow \
     -H "Content-Type: application/json" \
     -d '{"query": "Optimize crew assignments for our 3-story office building project"}'
   ```

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