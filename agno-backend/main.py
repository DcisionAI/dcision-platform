from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List, Union
import os
from dotenv import load_dotenv
import logging
import anthropic
import openai
from datetime import datetime
import re
import json

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def format_sources(sources):
    """Format sources into a readable string"""
    if not sources:
        return "No sources found"
    
    formatted_sources = []
    for idx, source in enumerate(sources, 1):
        source_text = f"{idx}. "
        if "metadata" in source:
            metadata = source["metadata"]
            if "source" in metadata:
                source_text += f"Source: {metadata['source']}"
            if "type" in metadata:
                source_text += f" (Type: {metadata['type']})"
            if "text" in metadata:
                source_text += f"\nRelevant text: {metadata['text'][:200]}..."
        formatted_sources.append(source_text)
    
    return "\n\n".join(formatted_sources)

def clean_json_response(response: str) -> Union[str, dict]:
    """Clean JSON response and format it properly"""
    try:
        # If it's already a JSON object, return it as is
        if isinstance(response, dict):
            return response
        
        # Try to parse as JSON first
        try:
            parsed = json.loads(response)
            return parsed
        except json.JSONDecodeError:
            pass
        
        # If not JSON, clean up markdown formatting
        cleaned = response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        
        # Try to parse again after cleaning
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            # If still not JSON, return as is
            return cleaned
    except Exception as e:
        logger.error(f"Error cleaning JSON response: {str(e)}")
        return response

def format_rag_response(answer: str, sources: list) -> str:
    """Format RAG response with properly formatted sources"""
    formatted_sources = format_sources(sources)
    return f"# Knowledge Response\n\n{answer}\n\n**Sources:**\n{formatted_sources}"

app = FastAPI(
    title="Agno Backend API",
    description="AI agents with support for Anthropic and OpenAI models",
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

# Initialize API clients
anthropic_client = None
openai_client = None

if os.getenv("ANTHROPIC_API_KEY"):
    anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

if os.getenv("OPENAI_API_KEY"):
    openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Pydantic models for request/response
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    model_provider: str = "anthropic"  # "anthropic" or "openai"
    model_name: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    """Response from a chat request"""
    response: Union[str, dict]
    session_id: Optional[str] = None
    model_used: Optional[str] = None
    timestamp: Optional[datetime] = Field(default_factory=lambda: datetime.now())

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

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
        if not anthropic_client:
            raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")
        
        # For latest Anthropic API, use the correct model names
        default_model = "claude-3-haiku-20240307"
        available_models = {
            # Latest Claude 3 models (verified working)
            "claude-3-haiku-20240307": "claude-3-haiku-20240307",
            "claude-3-sonnet-20240229": "claude-3-sonnet-20240229",
            "claude-3-opus-20240229": "claude-3-opus-20240229",
            # Simplified model names
            "claude-3-haiku": "claude-3-haiku-20240307",
            "claude-3-sonnet": "claude-3-sonnet-20240229",
            "claude-3-opus": "claude-3-opus-20240229",
            # Claude 2 models (legacy)
            "claude-2.1": "claude-2.1",
            "claude-2.0": "claude-2.0",
            # Claude Instant models (legacy)
            "claude-instant-1.2": "claude-instant-1.2",
            "claude-instant-1": "claude-instant-1"
        }
        
        model_id = model_name or default_model
        if model_id not in available_models:
            logger.warning(f"Model {model_id} not found, using default")
            model_id = default_model
            
        return {
            "provider": "anthropic",
            "model_id": model_id
        }
    
    elif provider.lower() == "openai":
        if not openai_client:
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
        
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
            "model_id": model_id
        }
    
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported model provider: {provider}")

class Agent:
    def __init__(self, instructions: str, model_config: dict, temperature: float = 0.7):
        """Initialize an agent with instructions and model configuration"""
        self.instructions = instructions
        self.model_config = model_config
        self.temperature = temperature
    
    def chat(self, message: str) -> str:
        """Send a message to the agent and get a response"""
        try:
            if self.model_config["provider"] == "anthropic":
                # For latest Anthropic API, use messages endpoint
                # Add instruction to return clean JSON without markdown
                system_instruction = f"{self.instructions}\n\nIMPORTANT: If the user asks for JSON output, return ONLY the JSON object without any markdown formatting, code blocks, or additional text."
                
                response = anthropic_client.messages.create(
                    model=self.model_config["model_id"],
                    max_tokens=1000,
                    temperature=self.temperature,
                    system=system_instruction,
                    messages=[
                        {"role": "user", "content": message}
                    ]
                )
                return clean_json_response(response.content[0].text)
            
            else:  # openai
                # Add instruction to return clean JSON without markdown
                system_instruction = f"{self.instructions}\n\nIMPORTANT: If the user asks for JSON output, return ONLY the JSON object without any markdown formatting, code blocks, or additional text."
                response = openai_client.chat.completions.create(
                    model=self.model_config["model_id"],
                    max_tokens=1000,
                    temperature=self.temperature,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": message}
                    ]
                )
                return clean_json_response(response.choices[0].message.content)
                
        except Exception as e:
            logger.error(f"Error in agent chat: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

def create_agent(config: AgentConfig):
    """Create a simple agent with the specified configuration"""
    try:
        model_config = get_model_config(config.model_provider, config.model_name)
        
        # Create the agent
        agent = Agent(
            instructions=config.instructions,
            model_config=model_config,
            temperature=config.temperature
        )
        
        return agent
        
    except Exception as e:
        logger.error(f"Error creating agent: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create agent: {str(e)}")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "AI Backend API is running",
        "version": "1.0.0",
        "available_providers": ["anthropic", "openai"]
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "anthropic_configured": bool(anthropic_client),
        "openai_configured": bool(openai_client),
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

@app.post("/api/agent/chat")
async def chat(request: ChatRequest):
    """Chat with an agent"""
    try:
        # Get model configuration
        model_config = get_model_config(request.model_provider, request.model_name)
        
        # Create agent with instructions
        agent = Agent(
            instructions="You are a helpful AI assistant. Please provide clear and concise responses.",
            model_config=model_config,
            temperature=0.7
        )
        
        # Get response from agent
        response = agent.chat(request.message)
        
        # Format the response if it's a RAG result
        if isinstance(response, dict) and "ragResult" in response:
            rag_result = response["ragResult"]
            if "answer" in rag_result and "sources" in rag_result:
                response = format_rag_response(rag_result["answer"], rag_result["sources"])
        
        # Create response object
        chat_response = ChatResponse(
            response=response,
            model_used=f"{model_config['provider']}:{model_config['model_id']}"
        )
        
        # Convert to dict for JSON serialization
        return chat_response.dict()
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
                "name": agent.instructions,
                "model_provider": agent.model_config["provider"],
                "model_id": agent.model_config["model_id"]
            }
            for agent_id, agent in agents.items()
        ]
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
                {"id": "claude-3-opus-20240229", "name": "Claude 3 Opus"},
                {"id": "claude-3-sonnet-20240229", "name": "Claude 3 Sonnet"},
                {"id": "claude-3-haiku-20240307", "name": "Claude 3 Haiku"}
            ]
        }
    elif provider.lower() == "openai":
        return {
            "provider": "openai",
            "models": [
                {"id": "gpt-4-turbo-preview", "name": "GPT-4 Turbo"},
                {"id": "gpt-4", "name": "GPT-4"},
                {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo"}
            ]
        }
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 