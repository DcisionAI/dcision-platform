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

### Running Locally
Install dependencies and start the Next.js development server:
```bash
yarn install
cp config.example.env .env.local
yarn dev
```

### Development Workflow
1. For frontend development:
```bash
cd frontend
yarn install
yarn dev
```

2. Clone and run backend services from the dedicated services repository:
```bash
# Clone the services repo as a sibling directory
git clone git@github.com:DcisionAI/dcision-services.git ../dcision-services

# Solver Service (Python/FastAPI)
cd ../dcision-services/solver-service
pip install -r requirements.txt
uvicorn src.api.routes:app --reload

# Plugin Service (Node.js)
cd ../dcision-services/plugin-service
yarn install
yarn dev

# Airbyte Wrapper Service (Node.js)
cd ../dcision-services/airbyte-service
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
