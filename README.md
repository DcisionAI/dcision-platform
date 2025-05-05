# DcisionAI Platform

A platform for AI-powered decision making and optimization.

## Local Development Setup

### Prerequisites
- Docker and Docker Compose
- Node.js (v18 or later)
- Yarn package manager

### Environment Variables
Create a `.env.local` file in the root directory by copying `config.example.env`, then update the values:
```bash
cp config.example.env .env.local
```
Open `.env.local` and fill in at minimum:
```bash
# JWT
JWT_SECRET=your-secure-random-jwt-secret

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# Airbyte (optional if running Airbyte locally)
AIRBYTE_API_URL=http://localhost:8000
```

### Running the Services
docker-compose up --build
1. Start all services using Docker Compose (including Airbyte core for data integration):
```bash
# Optionally override default host ports:
#   export FRONTEND_PORT=3005
#   export SOLVER_SERVICE_PORT=8005
#   export PLUGIN_SERVICE_PORT=8006
# Then bring up the stack:
docker-compose up --build
```
This will start:
  - Frontend on http://localhost:3000
  - Solver Service on http://localhost:8003 (maps to container port 8001)
  - Plugin Service on http://localhost:8004 (maps to container port 8002)
  - Airbyte core services (server on localhost:8000, webapp on localhost:8001, DB, Redis, Temporal)
  - After building & solving the model, retrieve the final decision via:
    GET http://localhost:3000/api/decision/{sessionId}

Alternatively, if you only want to work on the front-end without spinning up Airbyte, you can run:
```bash
yarn dev
```
Any calls to `/api/airbyte` will return an empty list stub in development mode unless the Airbyte server is running.

This will start:
- Frontend on http://localhost:3000
- Solver Service on http://localhost:8001
- Plugin Service on http://localhost:8002

### Development Workflow
1. For frontend development:
```bash
cd frontend
yarn install
yarn dev
```

2. For solver service development:
```bash
cd solver-service
yarn install
yarn dev
```

3. For plugin service development:
```bash
cd plugin-service
yarn install
yarn dev
```

## Project Structure
- `frontend/` - Next.js frontend application
- `solver-service/` - Optimization solver service
- `plugin-service/` - Plugin management service

## Testing
Run tests for each service:
```bash
# Frontend tests
cd frontend
yarn test

# Solver service tests
cd solver-service
yarn test

# Plugin service tests
cd plugin-service
yarn test
```

## Deployment
The platform is designed to be deployed using Docker containers. Each service has its own Dockerfile and can be built and deployed independently.

## Infrastructure as Code

We maintain Terraform configurations in the `terraform/` directory to manage Cloud Run domain mappings. See `terraform/README.md` for setup, import commands, and deployment instructions.

## License
[Add your license information here]
