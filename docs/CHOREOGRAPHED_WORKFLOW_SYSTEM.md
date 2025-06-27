# Choreographed Workflow System

**Date:** January 2025  
**Status:** Partially Working - Core Intent Analysis Functional, Workflow Orchestration Needs Fixes

## 🎯 Overview

The **Choreographed Workflow System** is DcisionAI's central multi-agent orchestration engine that manages complex decision support workflows. It uses an event-driven architecture with a central orchestrator to coordinate specialized AI agents for optimization and knowledge retrieval tasks.

## 🏗️ System Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│              Choreographed Workflow System              │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │            ChoreographedOrchestrator                │ │
│  │                                                     │ │
│  │ • Workflow Session Management                      │ │
│  │ • Event Routing & Coordination                     │ │
│  │ • Timeout Handling & Error Recovery                │ │
│  │ • Progress Tracking & Status Updates               │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Event-Driven Message Bus               │ │
│  │                                                     │ │
│  │ • Event Publishing & Subscription                  │ │
│  │ • Correlation ID Tracking                          │ │
│  │ • Real-time Event Routing                          │ │
│  │ • Agent Communication Coordination                 │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                Specialized Agents                   │ │
│  │                                                     │ │
│  │ • Intent Agent (Intent Analysis)                   │ │
│  │ • Data Agent (Data Preparation)                    │ │
│  │ • Model Builder Agent (Model Creation)             │ │
│  │ • Solver Agent (Mathematical Optimization)         │ │
│  │ • Response Agent (Response Assembly)               │ │
│  │ • Knowledge Agent (RAG & Retrieval)                │ │
│  │ • Explain Agent (Solution Explanation)             │ │
│  │ • Critique Agent (Output Validation)               │ │
│  │ • Debate Agent (Multi-Agent Reasoning)             │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 🔄 Workflow Process

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

### Detailed Event Flow Sequence

#### 1. User Query Reception
```typescript
// User submits query
POST /api/dcisionai/agentic/chat
{
  "query": "Optimize crew assignments for our 3-story office building project",
  "sessionId": "session-123",
  "customerData": { ... }
}

// ChoreographedOrchestrator receives USER_QUERY_RECEIVED event
USER_QUERY_RECEIVED → ChoreographedOrchestrator.startWorkflow()
```

#### 2. Intent Analysis
```typescript
// Orchestrator triggers intent analysis
ChoreographedOrchestrator → Intent Agent → INTENT_IDENTIFIED

// Intent Agent publishes result
{
  "type": "intent_identified",
  "payload": {
    "primaryIntent": "optimization",
    "confidence": 0.7,
    "keywords": ["optimize", "assign", "crew", "project"],
    "decisionType": "resource-allocation",
    "requiresOptimization": true,
    "requiresKnowledgeRetrieval": false
  },
  "correlationId": "session-123"
}
```

#### 3. Path Decision & Routing
```typescript
// Orchestrator routes based on intent
INTENT_IDENTIFIED → ChoreographedOrchestrator.routeToPath()

// For optimization requests:
OPTIMIZATION_REQUESTED → Data Agent
// For knowledge requests:
KNOWLEDGE_RETRIEVAL_REQUESTED → Knowledge Agent
```

#### 4. Optimization Path Execution
```typescript
// Data Preparation
OPTIMIZATION_REQUESTED → Data Agent → DATA_PREPARED

// Model Building
DATA_PREPARED → Model Builder → MODEL_BUILT

// Mathematical Optimization
MODEL_BUILT → Solver Agent → SOLUTION_FOUND

// Response Assembly
SOLUTION_FOUND → Response Agent → RESPONSE_GENERATED
```

#### 5. Knowledge Path Execution
```typescript
// Knowledge Retrieval
KNOWLEDGE_RETRIEVAL_REQUESTED → Knowledge Agent → KNOWLEDGE_RETRIEVED

// Response Assembly
KNOWLEDGE_RETRIEVED → Response Agent → RESPONSE_GENERATED
```

#### 6. Workflow Completion
```typescript
// Final response generation
RESPONSE_GENERATED → ChoreographedOrchestrator.completeWorkflow()

// Workflow completion event
WORKFLOW_COMPLETED → Final Response to User
```

## 🎭 Agent Implementations

### ChoreographedOrchestrator

**Location:** `src/agent/ChoreographedOrchestrator.ts`

**Key Responsibilities:**
- **Workflow Management**: Initiates and coordinates workflows
- **Session Management**: Tracks workflow sessions with correlation IDs
- **Event Routing**: Routes events between agents based on workflow state
- **Timeout Handling**: 5-minute timeout with graceful cleanup
- **Error Recovery**: Comprehensive error handling and fallback mechanisms

**Core Methods:**
```typescript
class ChoreographedOrchestrator extends BaseAgent {
  // Workflow lifecycle
  async startWorkflow(event: UserQueryEvent): Promise<void>
  async completeWorkflow(session: WorkflowSession): Promise<void>
  async failWorkflow(session: WorkflowSession, error: any): Promise<void>
  
  // Event handling
  handleAgentEvent(event: AgentEvent): void
  private async handleIntentIdentified(event: Message, session: any): Promise<void>
  private async handleDataPrepared(event: Message, session: any): Promise<void>
  private async handleModelBuilt(event: Message, session: any): Promise<void>
  private async handleSolutionFound(event: Message, session: any): Promise<void>
  private async handleResponseGenerated(event: Message, session: any): Promise<void>
  
  // Event triggering
  private async triggerIntentAnalysis(event: Message): Promise<void>
  private async triggerDataPreparation(event: Message): Promise<void>
  private async triggerModelBuilding(event: Message): Promise<void>
  private async triggerResponseGeneration(event: Message): Promise<void>
}
```

### Intent Agent

**Location:** `src/agent/IntentAgent.ts`

**Status:** ✅ **FULLY FUNCTIONAL**

**Capabilities:**
- Analyzes user queries using keyword heuristics and AI
- Identifies optimization vs knowledge retrieval requests
- Provides confidence scores and decision types
- Publishes `INTENT_IDENTIFIED` events

**Test Endpoint:** `POST /api/test-simple-intent`

**Response Example:**
```json
{
  "success": true,
  "sessionId": "test-simple-1751003316220-zoqg08j8q",
  "intent": {
    "primaryIntent": "optimization",
    "confidence": 0.7,
    "keywords": ["optimize", "assign", "assignment", "crew", "worker", "timeline"],
    "decisionType": "resource-allocation",
    "requiresOptimization": true,
    "requiresKnowledgeRetrieval": false,
    "originalQuery": "Optimize crew assignments...",
    "fullIntentAnalysis": {
      "optimizationType": "project_scheduling",
      "modelType": "MIP",
      "problemComplexity": "basic",
      "templateRecommendations": ["project_scheduling_basic"]
    }
  }
}
```

### Data Agent

**Location:** `src/agent/DataAgent.ts`

**Status:** ⚠️ **FUNCTIONAL BUT NOT INTEGRATED**

**Capabilities:**
- Handles data preparation and validation
- Extracts parameters from user queries
- Generates resource data and constraints
- Publishes `DATA_PREPARED` events

**Key Methods:**
```typescript
class DataAgent extends BaseAgent {
  async prepareData(event: Message): Promise<void>
  async extractParameters(query: string): Promise<any>
  async generateResourceData(customerData: any): Promise<any>
  async validateData(enrichedData: any): Promise<any>
}
```

### Model Builder Agent

**Location:** `src/agent/ModelBuilderAgent.ts`

**Status:** ⚠️ **FIXED BUT NOT INTEGRATED**

**Capabilities:**
- Creates optimization models and constraints
- Generates MCP protocol configurations
- Validates model configurations
- Publishes `MODEL_BUILT` events

**Recent Fixes:**
- Fixed undefined `.reduce()` errors with null checks
- Added proper error handling for missing data
- Improved variable and constraint generation

### Solver Agent

**Location:** `src/agent/SolverAgent.ts`

**Status:** ⚠️ **FUNCTIONAL BUT HAS LOOPING ISSUES**

**Capabilities:**
- Executes mathematical optimization using HiGHS
- Handles multiple optimization formats (LP, MIP, QP)
- Provides solution validation and metrics
- Publishes `SOLUTION_FOUND` events

**Issues:**
- Multiple event processing causing loops
- "Already processing" warnings
- Duplicate solution publishing

### Response Agent

**Location:** `src/agent/ResponseAgent.ts`

**Status:** ⚠️ **FUNCTIONAL BUT NOT RECEIVING EVENTS**

**Capabilities:**
- Assembles final responses from multiple agents
- Handles multiple execution paths
- Aggregates metadata and results
- Publishes `RESPONSE_GENERATED` events

**Issues:**
- Not receiving `RESPONSE_GENERATION_STARTED` events
- Event subscription mismatch

## 📊 Event System

### Event Types

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

### Event Structure

```typescript
interface BaseEvent {
  type: string;
  payload: any;
  correlationId: string;
  from?: string;
  to?: string;
  timestamp?: string;
  metadata?: {
    agent?: string;
    step?: string;
    status?: 'started' | 'completed' | 'error';
    duration?: number;
    retryCount?: number;
  };
}
```

### Message Bus Implementation

**Location:** `src/agent/MessageBus.ts`

**Features:**
- Event publishing and subscription
- Correlation ID tracking
- Event routing between agents
- Comprehensive event type definitions

## 🔧 Current Development Status

### ✅ Fully Functional Components

1. **IntentAgent** - FULLY FUNCTIONAL ✅
   - Intent analysis and routing
   - Keyword heuristics and AI analysis
   - Robust fallback when external services unavailable
   - Publishes `INTENT_IDENTIFIED` events correctly

2. **Event System** - FUNCTIONAL ✅
   - Event publishing and subscription
   - Correlation ID tracking
   - Event routing between agents
   - Comprehensive event type definitions

3. **Mock Intent Analysis** - FUNCTIONAL ✅
   - Keyword-based intent detection
   - Optimization type classification
   - Robust error handling when Agno service unavailable
   - Automatic fallback to heuristic analysis

4. **BaseAgent Framework** - FUNCTIONAL ✅
   - Retry logic with exponential backoff
   - Context management
   - Progress tracking
   - Error handling and recovery

### ⚠️ Partially Working Components

1. **ChoreographedOrchestrator** - PARTIALLY WORKING ⚠️
   - **Working:** Session management, event routing, intent analysis triggering, timeout handling
   - **Issues:** Workflow gets stuck after intent analysis, response generation not completing, event flow breaks in complex workflows

2. **DataAgent** - FUNCTIONAL BUT NOT INTEGRATED ⚠️
   - **Status:** Code is complete but not being used in simplified workflow
   - **Features:** Data enrichment, parameter extraction, resource data generation, constraint generation

3. **ModelBuilderAgent** - FIXED BUT NOT INTEGRATED ⚠️
   - **Status:** Fixed reduce errors, but not used in simplified workflow
   - **Recent Fixes:** Fixed undefined `.reduce()` errors with null checks, added proper error handling for missing data, improved variable and constraint generation

4. **SolverAgent** - FUNCTIONAL BUT HAS LOOPING ISSUES ⚠️
   - **Status:** Working but causing infinite loops
   - **Issues:** Multiple event processing causing loops, "Already processing" warnings, duplicate solution publishing

5. **ResponseAgent** - FUNCTIONAL BUT NOT RECEIVING EVENTS ⚠️
   - **Status:** Code is complete but not receiving proper events
   - **Features:** Response assembly, multiple execution path support, metadata aggregation
   - **Issues:** Not receiving `RESPONSE_GENERATION_STARTED` events, event subscription mismatch

### ❌ Issues to Address

1. **Complete Workflow Orchestration** - BROKEN ❌
   - **Issue:** Workflow times out after intent analysis
   - **Root Cause:** Event flow breaks between orchestrator and response agent
   - **Symptoms:** Intent analysis completes successfully, workflow gets stuck waiting for response generation, timeout after 5 minutes

2. **Agno Backend Integration** - NOT AVAILABLE ❌
   - **Location:** `agno-backend/`
   - **Status:** Backend exists but not running
   - **Issue:** 404 errors when trying to connect to `https://agents.dcisionai.com`
   - **Workaround:** Mock fallback system is working

## 🧪 Testing & Debugging

### Test Endpoints

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

### Debug Logging

The system includes comprehensive logging throughout:
- Event tracking and correlation
- Agent status monitoring
- Error context preservation
- Workflow progress tracking

### Test Results

**✅ Successful Tests:**
- Simple Intent Analysis: 100% success rate
- Mock Fallback System: Working correctly
- Event Publishing: Functional
- Agent Initialization: All agents start correctly

**❌ Failed Tests:**
- Complete Workflow: Always times out
- Response Generation: Never completes
- Complex Optimization: Gets stuck in loops

## 🚀 Next Steps to Fix

### Priority 1: Fix Event Flow

1. **Debug ResponseAgent Event Reception**
   - Verify `RESPONSE_GENERATION_STARTED` events are being received
   - Check event subscription registration
   - Add more detailed logging

2. **Fix SolverAgent Looping**
   - Implement proper event deduplication
   - Add processing state management
   - Prevent duplicate event handling

### Priority 2: Complete Workflow Integration

1. **Re-enable Full Workflow**
   - Integrate DataAgent back into workflow
   - Fix ModelBuilderAgent integration
   - Complete SolverAgent integration

2. **Add Response Generation**
   - Ensure ResponseAgent completes workflow
   - Add proper error handling
   - Implement fallback responses

### Priority 3: Production Readiness

1. **Agno Backend Setup**
   - Start local Agno backend
   - Configure proper URLs
   - Test real AI integration

2. **Error Handling**
   - Add comprehensive error recovery
   - Implement graceful degradation
   - Add monitoring and alerting

## 📁 File Structure

```
src/
├── agent/
│   ├── BaseAgent.ts              ✅ Working
│   ├── IntentAgent.ts            ✅ Working
│   ├── ChoreographedOrchestrator.ts ⚠️ Partially Working
│   ├── DataAgent.ts              ⚠️ Not Integrated
│   ├── ModelBuilderAgent.ts      ⚠️ Fixed, Not Integrated
│   ├── SolverAgent.ts            ⚠️ Functional, Has Looping Issues
│   ├── ResponseAgent.ts          ⚠️ Functional, Not Receiving Events
│   ├── KnowledgeAgent.ts         ⚠️ Not Integrated
│   ├── ExplainAgent.ts           ⚠️ Not Integrated
│   ├── CritiqueAgent.ts          ⚠️ Not Integrated
│   ├── DebateAgent.ts            ⚠️ Not Integrated
│   ├── CoordinatorAgent.ts       ⚠️ Not Integrated
│   ├── EventTypes.ts             ✅ Working
│   ├── MessageBus.ts             ✅ Working
│   └── EventStore.ts             ✅ Working
├── pages/api/
│   ├── test-simple-intent.ts     ✅ Working
│   └── test-choreographed-workflow.ts ⚠️ Partially Working
```

## 🎯 Success Metrics

### Technical Metrics
- **Workflow Completion Rate**: Percentage of workflows that complete successfully
- **Event Flow Efficiency**: Time between events in the workflow
- **Agent Response Time**: Time for each agent to process and respond
- **Error Recovery Rate**: Percentage of errors that are automatically recovered

### Quality Metrics
- **Intent Accuracy**: Accuracy of intent classification
- **Solution Quality**: Quality and feasibility of generated solutions
- **Response Relevance**: Relevance of final responses to user queries
- **User Satisfaction**: User feedback on workflow results

## 🔮 Future Enhancements

### Short-term (1-3 months)
- **Agent Memory**: Persistent agent experience storage
- **Dynamic Workflow Adaptation**: Adaptive workflow based on context
- **Self-Assessment**: Agent performance evaluation and improvement

### Medium-term (3-6 months)
- **Agent Learning**: Experience-based improvement and workflow adaptation
- **Advanced Debates**: More sophisticated multi-agent reasoning
- **Real-time Collaboration**: Live agent collaboration and debate

### Long-term (6+ months)
- **Level 4 Agentic**: True agent autonomy and self-improvement
- **Emergent Behavior**: Self-organizing systems and emergent capabilities
- **Platform APIs**: Developer-friendly horizontal APIs

## 📚 Related Documentation

- [Architecture Overview](architecture/architecture.md)
- [Platform Overview](platform-overview.md)
- [Agentic Testing Guide](AGENTIC_TESTING_GUIDE.md)
- [MCP Integration Guide](architecture/mcp-overview.md)
- [Solver Service Deployment](architecture/SOLVER-SERVICE-DEPLOYMENT.md) 