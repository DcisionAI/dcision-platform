# Cloud Run Deployment Guide for DcisionAI Platform

## Overview

This guide covers deploying the DcisionAI Platform to Google Cloud Run. The platform consists of two main components:
1. **Frontend (Next.js)** - Deployed to Cloud Run
2. **Backend (Agno Python)** - Should be deployed separately or handled through external APIs

## Prerequisites

- Google Cloud Project with billing enabled
- Google Cloud CLI installed and configured
- Docker installed locally (for testing)

## Architecture

For Cloud Run deployment, we use a simplified architecture:
- **Frontend Container**: Next.js application listening on port 8080
- **Backend**: External service (can be deployed separately or use external APIs)

## Deployment Steps

### 1. Build and Deploy Frontend

```bash
# Build the container
docker build -t gcr.io/YOUR_PROJECT_ID/dcisionai-frontend:latest .

# Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/dcisionai-frontend:latest

# Deploy to Cloud Run
gcloud run deploy dcisionai-frontend \
  --image gcr.io/YOUR_PROJECT_ID/dcisionai-frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "AGNO_BACKEND_URL=https://your-agno-backend-url.com"
```

### 2. Environment Variables

Set these environment variables in Cloud Run:

```bash
# Required
NODE_ENV=production
PORT=8080

# Database
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# Security
JWT_SECRET=your-secure-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# AI Services
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Backend URL (if using external Agno backend)
AGNO_BACKEND_URL=https://your-agno-backend-url.com

# Optional
LOG_LEVEL=info
DEBUG=false
```

### 3. Using Cloud Build (Recommended)

Create a `cloudbuild.yaml` file:

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/dcisionai-frontend:latest'
      - '.'

  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'gcr.io/$PROJECT_ID/dcisionai-frontend:latest'

  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk:slim'
    args:
      - 'run'
      - 'deploy'
      - 'dcisionai-frontend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/dcisionai-frontend:latest'
      - '--platform'
      - 'managed'
      - '--region'
      - 'us-central1'
      - '--allow-unauthenticated'
      - '--port'
      - '8080'
      - '--set-env-vars'
      - 'NODE_ENV=production,AGNO_BACKEND_URL=${_AGNO_BACKEND_URL}'

images:
  - 'gcr.io/$PROJECT_ID/dcisionai-frontend:latest'

substitutions:
  _AGNO_BACKEND_URL: 'https://your-agno-backend-url.com'
```

Deploy using:
```bash
gcloud builds submit --config cloudbuild.yaml
```

## Troubleshooting

### Common Issues

1. **Container fails to start**
   - Check logs: `gcloud logs read --filter resource.type="cloud_run_revision"`
   - Ensure PORT=8080 is set
   - Verify the startup script is executable

2. **Port binding issues**
   - The container must listen on the PORT environment variable (8080)
   - Next.js should be configured to use `process.env.PORT`

3. **Environment variables**
   - All required environment variables must be set in Cloud Run
   - Use `gcloud run services update` to add missing variables

### Health Checks

The application should respond to health checks at the root path (`/`). Ensure your Next.js app has a proper health check endpoint.

### Logs

View logs in real-time:
```bash
gcloud logs tail --filter resource.type="cloud_run_revision"
```

## Backend Options

### Option 1: Deploy Agno Backend Separately
Deploy the Agno backend as a separate Cloud Run service and set `AGNO_BACKEND_URL` to point to it.

### Option 2: Use External APIs
Modify the frontend to use external APIs instead of the local Agno backend.

### Option 3: Disable Backend Features
Temporarily disable features that require the Agno backend for initial deployment.

## Security Considerations

1. **Environment Variables**: Never commit sensitive values to version control
2. **CORS**: Configure CORS properly if frontend and backend are on different domains
3. **Authentication**: Implement proper authentication for production use
4. **HTTPS**: Cloud Run provides HTTPS by default

## Monitoring

Set up monitoring and alerting:
```bash
# Enable monitoring
gcloud services enable monitoring.googleapis.com

# Set up alerts for error rates
gcloud alpha monitoring policies create --policy-from-file=alert-policy.yaml
```

## Cost Optimization

1. **Minimal instances**: Set to 0 for cost savings (cold starts expected)
2. **Max instances**: Limit to prevent runaway costs
3. **Memory allocation**: Optimize based on actual usage

## Next Steps

After successful deployment:
1. Set up custom domain
2. Configure SSL certificates
3. Set up monitoring and alerting
4. Implement CI/CD pipeline
5. Add performance monitoring 