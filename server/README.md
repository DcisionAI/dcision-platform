# DcisionAI Platform Server

This directory contains the core backend logic for the DcisionAI platform, including the MCP (Model-Context-Protocol) server and all its components.

## Directory Structure

- `api/`: REST API endpoints for problem submission, session management, and solution retrieval
- `orchestrator/`: Core MCP orchestration engine for executing protocol steps
- `agents/`: Pluggable agent implementations for various tasks
- `mcp/`: Core MCP definitions, types, and validation logic
- `plugins/`: External and internal plugin integrations
- `sessions/`: Session state management and persistence
- `storage/`: Storage utilities for MCPs, sessions, and results
- `auth/`: Authentication and authorization middleware
- `errors/`: Centralized error handling and custom error types
- `utils/`: Shared utility functions and helpers

## Key Components

1. **MCP Server**: Manages the lifecycle of optimization problems
2. **Orchestrator**: Executes protocol steps and manages agent interactions
3. **Agents**: Pluggable components for specific tasks (data collection, optimization, etc.)
4. **Session Management**: Handles user sessions and state persistence

## Development

- Use TypeScript for all implementations
- Follow the error handling patterns in `errors/`
- Add tests for new functionality in `tests/server/`
- Document API changes in OpenAPI format 