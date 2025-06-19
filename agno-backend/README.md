# Agno Backend API

A FastAPI-based backend that integrates with the Agno framework to provide AI agent capabilities with support for both Anthropic and OpenAI models.

## Features

- 🤖 **Multi-Model Support**: Choose between Anthropic Claude and OpenAI GPT models
- 🔧 **Flexible Configuration**: Easy model switching and parameter tuning
- 📡 **RESTful API**: Clean HTTP endpoints for agent interactions
- 🐳 **Docker Ready**: Containerized deployment with health checks
- 🔒 **Environment-Based**: Secure API key management
- 📊 **Health Monitoring**: Built-in health checks and logging

## Quick Start

### 1. Prerequisites

- Python 3.11+
- Docker (optional)
- API keys from Anthropic and/or OpenAI

### 2. Local Development

```bash
# Clone and navigate to the agno-backend directory
cd agno-backend

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp env.example .env
# Edit .env with your API keys

# Run the server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Docker Deployment

```bash
# Build the image
docker build -t agno-backend .

# Run with environment variables
docker run -p 8000:8000 \
  -e ANTHROPIC_API_KEY=your_key \
  -e OPENAI_API_KEY=your_key \
  agno-backend
```

### 4. Docker Compose (Recommended)

Add to your existing `docker-compose.yml`:

```yaml
services:
  agno-backend:
    build: ./agno-backend
    ports:
      - "8000:8000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./agno-backend:/app
    restart: unless-stopped
```

## API Endpoints

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
- `GET /api/models/{provider}` - Get available models for a provider

## Usage Examples

### Chat with Anthropic Claude

```bash
curl -X POST "http://localhost:8000/api/agent/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how are you?",
    "model_provider": "anthropic",
    "model_name": "claude-3-sonnet-20240229"
  }'
```

### Chat with OpenAI GPT

```bash
curl -X POST "http://localhost:8000/api/agent/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain quantum computing",
    "model_provider": "openai",
    "model_name": "gpt-4-turbo-preview"
  }'
```

### Create a Custom Agent

```bash
curl -X POST "http://localhost:8000/api/agent/create" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Finance Advisor",
    "instructions": "You are a professional financial advisor. Provide clear, accurate financial advice.",
    "model_provider": "anthropic",
    "model_name": "claude-3-opus-20240229",
    "temperature": 0.1
  }'
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Anthropic API key | Yes (if using Anthropic) |
| `OPENAI_API_KEY` | OpenAI API key | Yes (if using OpenAI) |
| `HOST` | Server host | No (default: 0.0.0.0) |
| `PORT` | Server port | No (default: 8000) |
| `LOG_LEVEL` | Logging level | No (default: INFO) |

## Available Models

### Anthropic
- `claude-3-opus-20240229` (Most capable)
- `claude-3-sonnet-20240229` (Balanced)
- `claude-3-haiku-20240307` (Fastest)

### OpenAI
- `gpt-4-turbo-preview` (Latest GPT-4)
- `gpt-4` (Standard GPT-4)
- `gpt-3.5-turbo` (Fast and cost-effective)

## Integration with Node.js Frontend

Replace your placeholder agno calls with HTTP requests:

```typescript
// Example: Replace placeholder agent calls
const response = await fetch('http://localhost:8000/api/agent/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Your message here',
    model_provider: 'anthropic', // or 'openai'
    model_name: 'claude-3-sonnet-20240229'
  })
});

const data = await response.json();
console.log(data.response);
```

## Development

### Running Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest
```

### API Documentation
Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Production Considerations

1. **Security**: Configure CORS properly for production
2. **Rate Limiting**: Add rate limiting middleware
3. **Authentication**: Implement API key authentication
4. **Monitoring**: Add proper logging and monitoring
5. **Scaling**: Consider using Redis for session management
6. **Database**: Add persistent storage for agent sessions

## Troubleshooting

### Common Issues

1. **Import Error: No module named 'agno'**
   - Ensure you have the latest version of Agno installed
   - Check if Agno is available in your Python environment

2. **API Key Errors**
   - Verify your API keys are correctly set in environment variables
   - Check that the keys have sufficient credits/permissions

3. **Model Not Found**
   - Verify the model name is correct and available
   - Check the `/api/models/{provider}` endpoint for available models

## License

This project is part of the DcisionAI platform. 