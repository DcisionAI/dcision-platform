# DcisionAI Platform

A platform for AI-powered decision making and optimization.

## Local Development Setup

### Prerequisites
- Docker and Docker Compose
- Node.js (v18 or later)
- Yarn package manager

### Environment Variables
Create a `.env.local` file in the root directory with the following variables:
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# JWT Configuration
JWT_SECRET=your_jwt_secret

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
```

### Running the Services
1. Start all services using Docker Compose:
```bash
docker-compose up --build
```

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

## License
[Add your license information here]
