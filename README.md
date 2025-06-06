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

## Deployment Options

### 1. Vercel Deployment (Demo Environment)

The platform is configured for deployment on Vercel, which is used primarily for demos and development.

```bash
# Deploy to Vercel
vercel
```

### 2. Docker Deployment (Local/On-Premises)

To run the platform locally or on-premises using Docker:

1. Copy `.env.local` to `.env` and fill in the required environment variables:
   ```bash
   cp .env.local .env
   ```

2. Build and start the containers:
   ```bash
   docker-compose up --build
   ```

3. Access the application at `http://localhost:3000`

### 3. AWS Deployment (Production)

To deploy the platform to AWS using Terraform:

1. Configure AWS credentials:
   ```bash
   aws configure
   ```

2. Create a `terraform.tfvars` file with your configuration:
   ```hcl
   aws_region = "us-west-2"
   vpc_id = "vpc-xxxxxx"
   public_subnet_ids = ["subnet-xxxxxx", "subnet-yyyyyy"]
   private_subnet_ids = ["subnet-zzzzzz", "subnet-wwwwww"]
   ecr_repository_url = "123456789012.dkr.ecr.us-west-2.amazonaws.com/dcisionai-platform"
   database_url = "postgresql://user:password@host:5432/dbname"
   supabase_url = "https://your-project.supabase.co"
   supabase_anon_key = "your-anon-key"
   supabase_service_role_key = "your-service-role-key"
   openai_api_key = "your-openai-key"
   anthropic_api_key = "your-anthropic-key"
   ```

3. Initialize and apply Terraform:
   ```bash
   cd terraform
   terraform init
   terraform plan
   terraform apply
   ```

4. The application will be available at the ALB DNS name (output after Terraform apply).

## Development

### Prerequisites

- Node.js 18+
- Yarn
- Docker and Docker Compose
- AWS CLI (for AWS deployment)
- Terraform (for AWS deployment)

### Local Development

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Start the development server:
   ```bash
   yarn dev
   ```

3. Access the application at `http://localhost:3000`

### Building

```bash
# Build for production
yarn build:prod

# Build for development
yarn build:dev
```

### Testing

```bash
# Run tests
yarn test

# Run tests in watch mode
yarn test:watch
```

## Environment Variables

Required environment variables (in `.env.local`):

- `DATABASE_URL`: PostgreSQL connection URL
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `OPENAI_API_KEY`: OpenAI API key
- `ANTHROPIC_API_KEY`: Anthropic API key

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# DcisionAI Platform - Customer Deployment

## Quick Start (Docker Compose)

1. Pull the image:
   ```bash
   docker pull ghcr.io/<your-org>/<your-repo>:latest
   ```
2. Create a `.env` file with your configuration:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   POSTGRES_HOST=your_db_host
   POSTGRES_PORT=5432
   POSTGRES_DB=your_db_name
   POSTGRES_USER=your_db_user
   POSTGRES_PASSWORD=your_db_password
   ```
3. Start the app:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## AWS Deployment (Terraform)

1. Clone this repo and set your variables in `terraform.tfvars`.
2. Run:
   ```bash
   terraform init
   terraform apply
   ```
3. Access your app via the Load Balancer URL.

## Onboarding

- On first launch, enter your DcisionAI API key.
- No database setup required if your DB is pre-initialized.

## Environment Variables

- All configuration is via environment variables (see `.env` example above).
- No code changes required.

## Support

For help, contact support@dcisionai.com or open an issue on GitHub.
