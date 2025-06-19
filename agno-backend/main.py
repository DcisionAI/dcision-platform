from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Agno Backend API",
    description="Agno-powered AI agents with support for Anthropic and OpenAI models",
    version="1.0.0"
)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    model_provider: str = "anthropic"  # "anthropic" or "openai"
    model_name: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str
    session_id: Optional[str] = None
    model_used: str
    timestamp: str

class AgentConfig(BaseModel):
    name: str
    instructions: str
    model_provider: str = "anthropic"
    model_name: Optional[str] = None
    temperature: float = 0.1
    markdown: bool = True

# Global agent registry
agents = {}

def get_model_config(provider: str, model_name: Optional[str] = None):
    """Get model configuration based on provider preference"""
    if provider.lower() == "anthropic":
        # Check for Anthropic API key
        if not os.getenv("ANTHROPIC_API_KEY"):
            raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")
        
        # Default Anthropic models
        default_model = "claude-3-sonnet-20240229"
        available_models = {
            "claude-3-opus-20240229": "claude-3-opus-20240229",
            "claude-3-sonnet-20240229": "claude-3-sonnet-20240229",
            "claude-3-haiku-20240307": "claude-3-haiku-20240307"
        }
        
        model_id = model_name or default_model
        if model_id not in available_models:
            logger.warning(f"Model {model_id} not found, using default")
            model_id = default_model
            
        return {
            "provider": "anthropic",
            "model_id": model_id,
            "api_key": os.getenv("ANTHROPIC_API_KEY")
        }
    
    elif provider.lower() == "openai":
        # Check for OpenAI API key
        if not os.getenv("OPENAI_API_KEY"):
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
        
        # Default OpenAI models
        default_model = "gpt-4-turbo-preview"
        available_models = {
            "gpt-4-turbo-preview": "gpt-4-turbo-preview",
            "gpt-4": "gpt-4",
            "gpt-3.5-turbo": "gpt-3.5-turbo"
        }
        
        model_id = model_name or default_model
        if model_id not in available_models:
            logger.warning(f"Model {model_id} not found, using default")
            model_id = default_model
            
        return {
            "provider": "openai",
            "model_id": model_id,
            "api_key": os.getenv("OPENAI_API_KEY")
        }
    
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported model provider: {provider}")

def create_agent(config: AgentConfig):
    """Create an Agno agent with the specified configuration"""
    try:
        model_config = get_model_config(config.model_provider, config.model_name)
        
        # Import Agno components
        from agno.agent import Agent
        
        if model_config["provider"] == "anthropic":
            from agno.models.anthropic import Claude
            model = Claude(id=model_config["model_id"])
        else:  # openai
            from agno.models.openai import OpenAI
            model = OpenAI(id=model_config["model_id"])
        
        # Create the agent
        agent = Agent(
            name=config.name,
            model=model,
            instructions=config.instructions,
            temperature=config.temperature,
            markdown=config.markdown
        )
        
        return agent
        
    except Exception as e:
        logger.error(f"Error creating agent: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create agent: {str(e)}")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Agno Backend API is running",
        "version": "1.0.0",
        "available_providers": ["anthropic", "openai"]
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "anthropic_configured": bool(os.getenv("ANTHROPIC_API_KEY")),
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "active_agents": len(agents)
    }

@app.post("/api/agent/create", response_model=Dict[str, str])
async def create_agent_endpoint(config: AgentConfig):
    """Create a new agent"""
    try:
        agent = create_agent(config)
        agent_id = f"{config.name}_{len(agents)}"
        agents[agent_id] = agent
        
        return {
            "agent_id": agent_id,
            "message": f"Agent '{config.name}' created successfully",
            "model_provider": config.model_provider,
            "model_name": config.model_name or "default"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agent/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest):
    """Chat with an agent"""
    try:
        # For now, create a temporary agent for each request
        # In production, you'd want to manage agent sessions properly
        config = AgentConfig(
            name="Temporary Agent",
            instructions="You are a helpful AI assistant. Provide clear, accurate, and helpful responses.",
            model_provider=request.model_provider,
            model_name=request.model_name
        )
        
        agent = create_agent(config)
        
        # Add context to the message if provided
        full_message = request.message
        if request.context:
            context_str = "\n".join([f"{k}: {v}" for k, v in request.context.items()])
            full_message = f"Context:\n{context_str}\n\nUser message:\n{request.message}"
        
        # Get response from agent
        response = agent.chat(full_message)
        
        return ChatResponse(
            response=response,
            session_id=request.session_id,
            model_used=f"{request.model_provider}:{request.model_name or 'default'}",
            timestamp=__import__("datetime").datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/agent/list")
async def list_agents():
    """List all active agents"""
    return {
        "agents": [
            {
                "id": agent_id,
                "name": agent.name if hasattr(agent, 'name') else "Unknown",
                "model_provider": getattr(agent, 'model_provider', 'unknown')
            }
            for agent_id, agent in agents.items()
        ],
        "total": len(agents)
    }

@app.delete("/api/agent/{agent_id}")
async def delete_agent(agent_id: str):
    """Delete an agent"""
    if agent_id not in agents:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    del agents[agent_id]
    return {"message": f"Agent {agent_id} deleted successfully"}

@app.get("/api/models/{provider}")
async def get_available_models(provider: str):
    """Get available models for a provider"""
    if provider.lower() == "anthropic":
        return {
            "provider": "anthropic",
            "models": [
                "claude-3-opus-20240229",
                "claude-3-sonnet-20240229", 
                "claude-3-haiku-20240307"
            ]
        }
    elif provider.lower() == "openai":
        return {
            "provider": "openai",
            "models": [
                "gpt-4-turbo-preview",
                "gpt-4",
                "gpt-3.5-turbo"
            ]
        }
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception handler: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 