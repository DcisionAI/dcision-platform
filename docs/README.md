# DcisionAI Platform Documentation

## Overview

DcisionAI is building the **world's first horizontal agentic AI platform for enterprise decision support**, using construction optimization as a strategic wedge to expand into multiple industries. Our platform combines sophisticated multi-agent AI with mathematical optimization to solve complex business problems.

## Platform Architecture

### Agentic AI Layer

Our platform features a **true agentic multi-agent system** with **event-driven communication** via a message bus:

- **Core Decision Agents**: Intent, Data, Model Builder, Solver, Explain
- **Advanced Agentic Agents**: Critique, Debate, Coordinator
- **Message Bus System**: Event-driven communication between agents (publish/subscribe)
- **LLM-Powered Coordination**: Dynamic routing and decision making
- **Agent Debate & Critique**: Agents can debate, critique, and collaborate
- **UI/UX**: Palantir-style tabs for Agent Response, Collaboration, Solution, and Explanation

### Current Agentic Level: 2.5/5 (Agentic-Ready)

**✅ Implemented:**
- Multi-agent architecture
- Event-driven message bus
- LLM-powered coordination
- Agent debate and critique
- Modular UI with agentic tabs

**🔄 In Progress:**
- Agent memory and learning
- Dynamic workflow adaptation
- Self-assessment capabilities

**❌ Planned:**
- True agent autonomy
- Self-improvement mechanisms
- Emergent behaviors

## Key Features

### 1. Agentic AI System
- **Event-Driven Communication**: Agents publish and subscribe to events via the message bus
- **Dynamic Routing**: LLM-powered message routing between agents
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

## API & UI Integration

- **Agentic Chat API**: `/api/dcisionai/agentic/chat` (returns agentic response format)
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
- [MCP Overview](./architecture/mcp-overview.md) - Model Context Protocol implementation
- [HiGHS Integration](./architecture/HIGHS-INTEGRATION_GUIDE.md) - Solver integration guide
- [Adding New Solvers](./architecture/adding-new-solvers.md) - Extending solver capabilities

### Agentic AI
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

3. **Set up environment**
   ```bash
   cp config.example.env .env.local
   # Edit .env.local with your API keys
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Development Workflow
1. **Agent Development**: Create new agents by subscribing to message bus events
2. **MCP Extension**: Add new optimization types and constraints
3. **Horizontal Expansion**: Add industry-specific templates and agents
4. **Testing**: Comprehensive test suite for all components

### Testing
1. **Quick Test**: Run the automated test script for all use cases
   ```bash
   ./scripts/test-all-use-cases.sh
   ```
2. **Individual Testing**: Test specific use cases via API endpoints
   ```bash
   curl -X POST http://localhost:3000/api/test-simple-agent \
     -H "Content-Type: application/json" \
     -d '{"query": "test query", "useCase": "rag"}'
   ```
3. **Complete Workflow**: Test full agentic workflow
   ```bash
   curl -X POST http://localhost:3000/api/test-workflow-steps \
     -H "Content-Type: application/json" \
     -d '{"query": "optimize supply chain", "useCase": "optimization"}'
   ```

## Contributing

### Development Standards
- Use the message bus for all agent communication
- Implement agent debate, critique, and collaboration
- Add tests for new features
- Document all public APIs and agentic flows

### Code Review Process
1. Create feature branch from main
2. Implement changes with tests
3. Update documentation
4. Submit pull request
5. Code review and approval
6. Merge to main

## Support

### Documentation
- [API Reference](./api/README.md) - Complete API documentation
- [Architecture Guide](./architecture/architecture.md) - System design
- [Development Guide](./onboarding/DEVELOPMENT.md) - Development setup

### Community
- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: Questions and community support
- Email: support@dcisionai.com

## License

This project is proprietary software. All rights reserved by DcisionAI.

---

**DcisionAI Platform** - Building the future of enterprise decision support with agentic AI.

## Session Context & Next Steps

### Current State (as of last session)
- **Agentic Architecture**: Fully event-driven, message bus-based, with agents subscribing/publishing to events. No central orchestrator; Coordinator Agent (LLM-powered) handles dynamic routing.
- **Agent Types**: Core (Intent, Data, Model Builder, Solver, Explain) and Advanced (Critique, Debate, Coordinator, MultiAgentDebate). All agents interact via the message bus.
- **Debate & Critique**: DebateAgent and MultiAgentDebate enable structured, LLM-powered agent-to-agent debates and group discussions. CritiqueAgent reviews outputs. All are coordinated via the message bus.
- **UI/UX**: Agent Collaboration tab shows agent thinking (cards per agent), Agent Response tab shows only the final answer. Progress logs are streamed post-response for now.
- **MCP Protocol**: Remains the universal interface for optimization, with rich context and extensibility.

### Recent Technical Changes
- Refactored all agent communication to use the message bus (no direct calls or central orchestration).
- Implemented CoordinatorAgent for LLM-based dynamic routing and workflow control.
- Added CritiqueAgent and DebateAgent for output review and agent-to-agent debate.
- MultiAgentDebate supports group debates, consensus, and winner determination.
- UI/UX improvements: Palantir-style tabs, agent cards, and clear separation of agent thinking vs. final answer.
- Bug fixes: Hooks in render, ReactMarkdown errors, correct property mapping for agent responses.

### Open Questions / Next Steps
- How to enable persistent agent memory and learning (Level 3+ agentic maturity)?
- Should agents be allowed to self-initiate or self-improve (true autonomy)?
- How to support real-time, in-progress streaming of agent logs (not just post-response)?
- What are the best practices for agent self-assessment and emergent behavior?
- Security, scalability, and test coverage need further investment.

**For the next agent session:**
- Review this section for full context before making changes.
- Consider the open questions above and document any architectural or design decisions.
- Ensure all new agents or features use the message bus and follow the agentic event-driven pattern.
