# Agno Integration Guide

This guide explains how to integrate your Node.js/TypeScript platform with the real Agno (Python) backend for advanced AI agent capabilities.

## 🎯 What We've Built

### 1. **Agno Python Backend** (`agno-backend/`)
- **FastAPI server** with full Agno framework integration
- **Multi-model support**: Anthropic Claude and OpenAI GPT models
- **RESTful API** for agent management and chat
- **Docker-ready** with health checks
- **Environment-based** configuration

### 2. **TypeScript Client Library** (`src/lib/agno-client.ts`)
- **Clean interface** to communicate with the Python backend
- **Type-safe** API calls with full TypeScript support
- **Convenience methods** for common operations
- **Specialized agents** for construction, finance, and data analysis

### 3. **Integration Examples** (`src/lib/agno-integration-example.ts`)
- **Drop-in replacements** for your existing agent code
- **Real Agno functionality** instead of placeholder implementations
- **Error handling** and response validation

## 🚀 Quick Start

### Option 1: Local Development

1. **Start the Agno backend:**
   ```bash
   ./start-agno-backend.sh
   ```
   This script will:
   - Check Python installation
   - Create virtual environment
   - Install dependencies
   - Set up environment variables
   - Start the server

2. **Configure API keys:**
   Edit `agno-backend/.env`:
   ```env
   ANTHROPIC_API_KEY=your_anthropic_key_here
   OPENAI_API_KEY=your_openai_key_here
   ```

3. **Test the integration:**
   ```typescript
   import { agnoClient } from '@/lib/agno-client';
   
   // Simple chat
   const response = await agnoClient.simpleChat(
     "Hello, how are you?", 
     "anthropic"
   );
   console.log(response);
   ```

### Option 2: Docker Compose

1. **Add API keys to your environment:**
   ```bash
   export ANTHROPIC_API_KEY=your_key_here
   export OPENAI_API_KEY=your_key_here
   ```

2. **Start all services:**
   ```bash
   docker-compose up
   ```

3. **Access the services:**
   - Frontend: http://localhost:3000
   - Agno Backend: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 📚 API Endpoints

### Health Check
- `GET /` - Basic health check
- `GET /health` - Detailed health status

### Agent Management
- `POST /api/agent/create` - Create a new agent
- `GET /api/agent/list` - List all active agents
- `DELETE /api/agent/{agent_id}` - Delete an agent

### Chat
- `POST /api/agent/chat` - Chat with an agent

### Models
- `GET /api/models/{provider}` - Get available models

## 🔄 Migration from Placeholder to Real Agno

### Before (Placeholder)
```typescript
import { Agent, UrlKnowledge } from 'agno'; // Placeholder package

const agent = new Agent({...});
const response = await agent.chat("Hello");
```

### After (Real Agno)
```typescript
import { agnoClient } from '@/lib/agno-client';

const response = await agnoClient.simpleChat("Hello", "anthropic");
```

### Replace Your Existing Agents

1. **Data Agent:**
   ```typescript
   // Replace agnoDataAgent.enrichData()
   import { enrichDataWithAgno } from '@/lib/agno-integration-example';
   
   const result = await enrichDataWithAgno(customerData, sessionId);
   ```

2. **Intent Agent:**
   ```typescript
   // Replace agnoIntentAgent.interpretIntent()
   import { interpretIntentWithAgno } from '@/lib/agno-integration-example';
   
   const result = await interpretIntentWithAgno(userInput, sessionId);
   ```

3. **Explain Agent:**
   ```typescript
   // Replace agnoExplainAgent.explainSolution()
   import { explainSolutionWithAgno } from '@/lib/agno-integration-example';
   
   const result = await explainSolutionWithAgno(mcpSolution, sessionId);
   ```

## 🎛️ Available Models

### Anthropic
- `claude-3-opus-20240229` (Most capable)
- `claude-3-sonnet-20240229` (Balanced)
- `claude-3-haiku-20240307` (Fastest)

### OpenAI
- `gpt-4-turbo-preview` (Latest GPT-4)
- `gpt-4` (Standard GPT-4)
- `gpt-3.5-turbo` (Fast and cost-effective)

## 🔧 Configuration

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Anthropic API key | Yes (if using Anthropic) |
| `OPENAI_API_KEY` | OpenAI API key | Yes (if using OpenAI) |
| `AGNO_BACKEND_URL` | Backend URL | No (default: http://localhost:8000) |

### Client Configuration
```typescript
import { AgnoClient } from '@/lib/agno-client';

// Custom configuration
const client = new AgnoClient(
  'http://your-agno-backend:8000', 
  'openai' // default provider
);
```

## 🧪 Testing

### Health Check
```typescript
import { agnoClient } from '@/lib/agno-client';

const health = await agnoClient.healthCheck();
console.log('Backend health:', health);
```

### Available Models
```typescript
const anthropicModels = await agnoClient.getAvailableModels('anthropic');
const openaiModels = await agnoClient.getAvailableModels('openai');
```

### Create Specialized Agents
```typescript
// Construction agent
const constructionAgentId = await agnoClient.createConstructionAgent();

// Finance agent
const financeAgentId = await agnoClient.createFinanceAgent();

// Data analysis agent
const dataAgentId = await agnoClient.createDataAnalysisAgent();
```

## 🚀 Deployment

### Local Development
```bash
# Terminal 1: Start Agno backend
./start-agno-backend.sh

# Terminal 2: Start your Node.js app
npm run dev
```

### Docker Compose
```bash
docker-compose up -d
```

### Production
1. **Deploy Agno backend** to your preferred cloud platform
2. **Update client configuration** to point to production URL
3. **Configure CORS** for production domains
4. **Add authentication** if needed

## 🔍 Troubleshooting

### Common Issues

1. **"Module not found: agno"**
   - ✅ **Fixed**: We've replaced the placeholder with real HTTP calls
   - The real Agno package is now running in Python

2. **"Connection refused"**
   - Check if Agno backend is running: `curl http://localhost:8000/health`
   - Verify Docker containers are up: `docker-compose ps`

3. **"API key not configured"**
   - Set your API keys in `agno-backend/.env`
   - Or set environment variables: `export ANTHROPIC_API_KEY=your_key`

4. **"Model not found"**
   - Check available models: `curl http://localhost:8000/api/models/anthropic`
   - Use a supported model name

### Debug Mode
```typescript
// Enable detailed logging
const client = new AgnoClient('http://localhost:8000');
const response = await client.chat({
  message: "Test message",
  model_provider: "anthropic"
});
console.log('Full response:', response);
```

## 📈 Benefits

### ✅ What You Get
- **Real Agno functionality** with advanced agent capabilities
- **Multi-model support** (Anthropic + OpenAI)
- **Production-ready** API with health checks
- **Type-safe** TypeScript integration
- **Docker support** for easy deployment
- **Comprehensive documentation** and examples

### 🔄 Migration Benefits
- **No more placeholder errors**
- **Real AI agent capabilities**
- **Better performance** and reliability
- **Access to Agno's advanced features** (memory, knowledge, reasoning)
- **Future-proof** architecture

## 📞 Support

- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Agno Framework**: https://docs.agno.com/introduction

---

**🎉 Congratulations!** You now have a fully integrated Agno backend with real AI agent capabilities, replacing the placeholder implementation with production-ready functionality. 