# DcisionAI Services Architecture & Design Decisions

## Overview

DcisionAI is built on a microservices architecture with multiple specialized services working together to provide enterprise-grade decision support. This document outlines all services, their design decisions, and how they interact.

## Core Services

### 1. Agno Backend Service

**Purpose**: Advanced AI agent orchestration and LLM management
**Technology**: Python FastAPI
**Location**: `agno-backend/`

#### Design Decisions

**Why Agno?**
- **Agent Management**: Provides sophisticated agent creation, management, and conversation handling
- **Multi-Provider Support**: Supports both Anthropic (Claude) and OpenAI models with automatic fallback
- **Session Management**: Maintains conversation context across interactions
- **Scalability**: Designed for horizontal scaling with Redis-based state management

**Architecture Patterns**:
- **FastAPI**: Modern, high-performance Python web framework with automatic OpenAPI documentation
- **Agent Registry**: Centralized agent management with configuration persistence
- **Provider Abstraction**: Clean interface for multiple LLM providers
- **Health Monitoring**: Built-in health checks and status endpoints

**Key Features**:
```python
# Agent creation with custom instructions
agent_config = {
    "name": "Construction Expert",
    "instructions": "Specialized construction domain knowledge...",
    "model_provider": "anthropic",
    "temperature": 0.1
}

# Multi-provider chat with fallback
response = await agno_client.chat({
    "message": "Analyze this optimization problem...",
    "model_provider": "anthropic",
    "session_id": "session-123"
})
```

**Configuration**:
- Environment-based configuration for API keys
- Automatic provider detection and fallback
- Configurable model selection per request
- Session persistence with Redis

### 2. Solver Service (HiGHS Integration)

**Purpose**: Mathematical optimization engine
**Technology**: HiGHS solver with Docker containerization
**Location**: `Dockerfile.solver`, `docker-compose.solver.yml`

#### Design Decisions

**Why HiGHS?**
- **Production-Grade**: Industry-standard solver used by major optimization platforms
- **Multiple Formats**: Supports LP, MIP, QP, and NLP problem types
- **Performance**: High-performance C++ implementation
- **Reliability**: Proven solver with extensive testing and validation

**Architecture Patterns**:
- **Containerized Service**: Isolated Docker container for solver operations
- **REST API Interface**: Clean HTTP interface for problem submission and solution retrieval
- **Format Flexibility**: Accepts multiple optimization problem formats
- **Result Caching**: Caches solutions for repeated problems

**Key Features**:
```bash
# Solver service deployment
docker-compose -f docker-compose.solver.yml up -d

# Problem submission
curl -X POST http://localhost:8080/solve \
  -H "Content-Type: application/json" \
  -d '{"problem": "minimize x + y subject to x + y >= 1"}'
```

**Configuration**:
- Resource limits and memory allocation
- Timeout settings for complex problems
- Logging and monitoring integration
- Health check endpoints

### 3. Redis Service

**Purpose**: Distributed message bus and caching layer
**Technology**: Redis with Node.js client
**Location**: `src/agent/MessageBus.ts`, `src/lib/redis.ts`

#### Design Decisions

**Why Redis?**
- **Pub/Sub**: Native publish/subscribe for event-driven architecture
- **Persistence**: Data persistence across service restarts
- **Performance**: In-memory operations with sub-millisecond latency
- **Scalability**: Horizontal scaling with Redis Cluster support

**Architecture Patterns**:
- **Event-Driven Communication**: All agent communication via Redis pub/sub
- **Message Bus Pattern**: Centralized event routing and distribution
- **Correlation IDs**: Request tracing across distributed services
- **Fallback Mechanism**: In-memory message bus when Redis unavailable

**Key Features**:
```typescript
// Message bus with Redis backend
const messageBus = new RedisMessageBus({
  redisUrl: process.env.REDIS_URL,
  fallbackToMemory: true
});

// Event publishing with correlation
messageBus.publish({
  type: 'call_intent_agent',
  payload: { query: 'optimize crew assignment' },
  correlationId: 'session-123'
});

// Event subscription
messageBus.subscribe('intent_identified', (msg) => {
  console.log('Intent identified:', msg.payload);
});
```

**Configuration**:
- Connection pooling and retry logic
- Message serialization/deserialization
- Error handling and recovery
- Monitoring and metrics collection

### 4. Next.js Platform Service

**Purpose**: Main application platform and API gateway
**Technology**: Next.js with TypeScript
**Location**: `src/`, `pages/api/`

#### Design Decisions

**Why Next.js?**
- **Full-Stack**: Server-side rendering and API routes in one framework
- **TypeScript**: Type-safe development with excellent IDE support
- **Performance**: Optimized React rendering and API handling
- **Deployment**: Easy deployment to Vercel, AWS, or other platforms

**Architecture Patterns**:
- **API-First Design**: RESTful API endpoints for all functionality
- **Agent Orchestration**: Centralized agent coordination and workflow management
- **Real-Time Updates**: WebSocket-like updates via Server-Sent Events
- **Modular Components**: Reusable React components for UI

**Key Features**:
```typescript
// API route with agent orchestration
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query, sessionId } = req.body;
  
  // Start agentic workflow
  messageBus.publish({
    type: 'start',
    payload: { query, sessionId },
    correlationId: sessionId
  });
  
  // Return streaming response
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Transfer-Encoding': 'chunked'
  });
}
```

**Configuration**:
- Environment-based configuration
- API rate limiting and authentication
- CORS and security headers
- Performance monitoring and logging

## Agentic AI Architecture

### Message Bus Pattern

**Design Decision**: Event-driven communication between agents
**Benefits**:
- **Loose Coupling**: Agents don't need direct references to each other
- **Scalability**: Easy to add new agents without modifying existing code
- **Testability**: Agents can be tested in isolation
- **Flexibility**: Dynamic routing and workflow adaptation

**Implementation**:
```typescript
// Agent subscription pattern
messageBus.subscribe('call_intent_agent', async (msg) => {
  const intent = await analyzeIntent(msg.payload.query);
  messageBus.publish({
    type: 'intent_identified',
    payload: intent,
    correlationId: msg.correlationId
  });
});
```

### Agent Types

#### Core Decision Agents
1. **Intent Agent**: Analyzes user queries and determines execution path
2. **Data Agent**: Prepares and validates data for optimization
3. **Model Builder Agent**: Creates optimization models and constraints
4. **Solver Agent**: Executes mathematical optimization
5. **Explain Agent**: Generates explanations and insights

#### Advanced Agentic Agents
1. **Coordinator Agent**: LLM-powered workflow orchestration
2. **Critique Agent**: Reviews and critiques other agents' outputs
3. **Debate Agent**: Engages in structured debates with other agents
4. **Multi-Agent Debate**: Facilitates group discussions and consensus

### Agentic Levels

**Current Level: 2.5/5 (Agentic-Ready)**

**Level 1**: Basic multi-agent system
**Level 2**: Event-driven communication ✅
**Level 3**: Agent memory and learning 🔄
**Level 4**: True agent autonomy ❌
**Level 5**: Emergent behaviors ❌

## Data Architecture

### Vector Database (Pinecone)

**Purpose**: Semantic search and knowledge retrieval
**Technology**: Pinecone vector database
**Location**: `src/lib/pinecone.ts`

#### Design Decisions

**Why Pinecone?**
- **Managed Service**: No infrastructure management required
- **Semantic Search**: Advanced vector similarity search
- **Scalability**: Handles millions of vectors with sub-second latency
- **Integration**: Easy integration with OpenAI embeddings

**Architecture Patterns**:
- **Embedding Pipeline**: Text → OpenAI embeddings → Pinecone storage
- **Semantic Search**: Query → embedding → similarity search → results
- **Metadata Filtering**: Filter results by document type, date, etc.
- **Hybrid Search**: Combine vector search with keyword filtering

### Database (Supabase)

**Purpose**: User data, sessions, and application state
**Technology**: PostgreSQL with Supabase
**Location**: `supabase/`

#### Design Decisions

**Why Supabase?**
- **PostgreSQL**: Robust, ACID-compliant database
- **Real-Time**: Built-in real-time subscriptions
- **Authentication**: Integrated auth with multiple providers
- **API Generation**: Automatic REST and GraphQL API generation

**Schema Design**:
```sql
-- Users and authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Optimization sessions
CREATE TABLE optimization_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  query TEXT NOT NULL,
  intent JSONB,
  solution JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Deployment Architecture

### Container Orchestration

**Technology**: Docker Compose for development, Kubernetes for production
**Location**: `docker-compose.yml`, `cloudbuild.yaml`

#### Design Decisions

**Why Docker?**
- **Consistency**: Same environment across development and production
- **Isolation**: Services don't interfere with each other
- **Scalability**: Easy horizontal scaling
- **Portability**: Run anywhere Docker is supported

**Service Configuration**:
```yaml
# docker-compose.yml
services:
  agno-backend:
    build: ./agno-backend
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  solver-service:
    build: .
    dockerfile: Dockerfile.solver
    ports:
      - "8080:8080"
    environment:
      - SOLVER_TIMEOUT=300

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
```

### Cloud Deployment

**Platform**: Google Cloud Platform (GCP)
**Services**: Cloud Run, Cloud SQL, Redis Enterprise Cloud
**Location**: `cloudbuild.yaml`, `terraform/`

#### Design Decisions

**Why GCP?**
- **Serverless**: Cloud Run for automatic scaling
- **Managed Services**: Cloud SQL, Redis Enterprise Cloud
- **Integration**: Native integration with other GCP services
- **Cost Efficiency**: Pay-per-use pricing model

**Deployment Pipeline**:
```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/dcisionai', '.']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/dcisionai']
  
  - name: 'gcr.io/cloud-builders/gcloud'
    args: ['run', 'deploy', 'dcisionai', '--image', 'gcr.io/$PROJECT_ID/dcisionai']
```

## Security Architecture

### Authentication & Authorization

**Technology**: Supabase Auth with JWT tokens
**Location**: `src/lib/auth.ts`, `src/middleware.ts`

#### Design Decisions

**Why JWT?**
- **Stateless**: No server-side session storage required
- **Scalability**: Works across multiple services
- **Security**: Signed tokens with expiration
- **Integration**: Easy integration with frontend frameworks

**Implementation**:
```typescript
// Middleware for API protection
export function withAuth(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
      const user = await supabase.auth.getUser(token);
      req.user = user;
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}
```

### API Security

**Rate Limiting**: Redis-based rate limiting with sliding windows
**CORS**: Configured for specific origins
**Input Validation**: Zod schema validation for all API inputs
**Error Handling**: Sanitized error messages without sensitive data

## Monitoring & Observability

### Logging

**Technology**: Structured logging with correlation IDs
**Location**: Throughout codebase

#### Design Decisions

**Why Structured Logging?**
- **Searchability**: Easy to search and filter logs
- **Correlation**: Track requests across services
- **Analysis**: Automated log analysis and alerting
- **Compliance**: Audit trail for enterprise customers

**Implementation**:
```typescript
// Structured logging with correlation
logger.info('Intent analysis started', {
  sessionId: 'session-123',
  query: 'optimize crew assignment',
  timestamp: new Date().toISOString(),
  correlationId: 'corr-456'
});
```

### Metrics

**Technology**: Custom metrics with Prometheus format
**Location**: `src/pages/api/metrics/`

#### Metrics Collected
- API request rates and latencies
- Agent processing times
- Solver performance metrics
- Redis connection health
- Error rates and types

### Health Checks

**Endpoints**:
- `/api/health` - Overall system health
- `/api/redis-status` - Redis connection status
- `/api/rate-limit-status` - Rate limiting status
- `/api/metrics/openai` - OpenAI API status

## Performance Optimization

### Caching Strategy

**Redis Caching**:
- Agent responses for similar queries
- Solver results for repeated problems
- User session data
- API rate limiting counters

**CDN Caching**:
- Static assets (CSS, JS, images)
- API responses where appropriate
- Documentation and help content

### Database Optimization

**Indexing Strategy**:
- Primary keys on all tables
- Composite indexes for common queries
- Full-text search indexes for content
- Vector indexes for embeddings

**Query Optimization**:
- Prepared statements for repeated queries
- Connection pooling
- Query result caching
- Pagination for large result sets

## Testing Strategy

### Unit Testing

**Technology**: Jest with TypeScript
**Location**: `src/**/*.test.ts`

**Coverage Areas**:
- Agent logic and decision making
- API endpoint functionality
- Message bus communication
- Data validation and transformation

### Integration Testing

**Technology**: Jest with test containers
**Location**: `tests/`

**Test Scenarios**:
- End-to-end workflow testing
- Service communication testing
- Database integration testing
- External API integration testing

### Load Testing

**Technology**: Artillery or k6
**Location**: `scripts/load-test/`

**Test Scenarios**:
- Concurrent user simulation
- API endpoint performance
- Database query performance
- Redis pub/sub performance

## Future Architecture Considerations

### Scalability Improvements

**Horizontal Scaling**:
- Redis Cluster for message bus scaling
- Database read replicas
- CDN for global content delivery
- Load balancers for service distribution

**Microservices Evolution**:
- Service mesh for inter-service communication
- API Gateway for request routing
- Circuit breakers for fault tolerance
- Distributed tracing for observability

### AI/ML Enhancements

**Model Serving**:
- Dedicated ML model serving infrastructure
- Model versioning and A/B testing
- Automated model retraining pipelines
- Model performance monitoring

**Advanced Agentic Features**:
- Persistent agent memory with vector databases
- Agent learning and self-improvement
- Multi-modal agent capabilities
- Federated learning for privacy

## Conclusion

The DcisionAI platform architecture is designed for scalability, reliability, and maintainability. The microservices approach with event-driven communication provides flexibility for future enhancements while maintaining clear separation of concerns.

Key architectural principles:
1. **Event-Driven**: All communication via message bus
2. **Containerized**: Services isolated in containers
3. **API-First**: Clean interfaces for all services
4. **Observable**: Comprehensive monitoring and logging
5. **Secure**: Multi-layer security approach
6. **Scalable**: Designed for horizontal scaling

This architecture supports the platform's growth from construction optimization to a horizontal enterprise decision support platform. 