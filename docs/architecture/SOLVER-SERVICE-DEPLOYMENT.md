# Solver Service Deployment Guide

## Overview

This guide explains how to deploy the DcisionAI solver service (HiGHS + OR-Tools) to Google Cloud Platform as a separate service accessible at `solver.dcisionai.com`.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                Main Platform (Next.js)                  │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │   Frontend UI   │  │   API Routes    │              │
│  │                 │  │                 │              │
│  │ • React Pages   │  │ • /api/agno     │              │
│  │ • Components    │  │ • /api/docs     │              │
│  │ • Workflows     │  │ • /api/metrics  │              │
│  │ • Chat Interface│  │                 │              │
│  └─────────────────┘  └─────────────────┘              │
└─────────────────────────────────────────────────────────┘
                                │
                                │ HTTP Requests
                                ▼
┌─────────────────────────────────────────────────────────┐
│              Solver Service (Cloud Run)                 │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Optimization Engine                   │   │
│  │                                               │   │
│  │ • HiGHS Solver (Binary)                       │   │
│  │ • OR-Tools (Python)                           │   │
│  │ • Express.js API Server                       │   │
│  │ • Health Checks                               │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Google Cloud SDK**: Install and authenticate with `gcloud`
2. **Docker**: For local testing
3. **Domain**: `solver.dcisionai.com` should be configured in your DNS

## Quick Deployment

### 1. One-Command Deployment

```bash
# Deploy solver service to GCP
./scripts/deploy-solver.sh
```

This script will:
- Build the Docker image with HiGHS and OR-Tools
- Deploy to Google Cloud Run
- Map the custom domain `solver.dcisionai.com`
- Test the deployment

### 2. Manual Deployment

```bash
# Build and deploy using Cloud Build
gcloud builds submit --config cloudbuild-solver.yaml .

# Deploy to Cloud Run
gcloud run deploy solver-service \
  --image gcr.io/YOUR_PROJECT_ID/solver-service:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production,SOLVER_TIMEOUT=300,HIGHS_THREADS=4

# Map custom domain
gcloud run domain-mappings create \
  --service solver-service \
  --domain solver.dcisionai.com \
  --region us-central1 \
  --force-override
```

## Local Development

### 1. Build and Run Locally

```bash
# Build the solver service
docker build -f Dockerfile.solver -t solver-service .

# Run locally
docker run -p 8081:8080 solver-service

# Or use docker-compose
docker-compose -f docker-compose.solver.yml up
```

### 2. Test the Service

```bash
# Health check
curl http://localhost:8081/health

# Test solver
curl -X POST http://localhost:8081/solve \
  -H "Content-Type: application/json" \
  -d '{
    "problem": {
      "objective": {"sense": "minimize", "linear": [1, 1]},
      "variables": [
        {"name": "x", "type": "cont", "lb": 0, "ub": 10},
        {"name": "y", "type": "cont", "lb": 0, "ub": 10}
      ],
      "constraints": [
        {"coefficients": [1, 1], "sense": ">=", "rhs": 1}
      ]
    },
    "solver": "highs"
  }'
```

## API Reference

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "solvers": {
    "highs": true,
    "orTools": true
  }
}
```

### Solve Problem

```http
POST /solve
Content-Type: application/json
```

**Request Body:**
```json
{
  "problem": {
    "objective": {
      "sense": "minimize",
      "linear": [1, 1, 1, 1]
    },
    "variables": [
      { "name": "carpenters", "type": "int", "lb": 0, "ub": 5 },
      { "name": "electricians", "type": "int", "lb": 0, "ub": 5 },
      { "name": "plumbers", "type": "int", "lb": 0, "ub": 3 },
      { "name": "hvac_techs", "type": "int", "lb": 0, "ub": 2 }
    ],
    "constraints": [
      { "coefficients": [1, 1, 1, 1], "sense": "<=", "rhs": 15 }
    ]
  },
  "solver": "highs"
}
```

**Response:**
```json
{
  "status": "optimal",
  "objectiveValue": -55.0,
  "variables": {
    "carpentr": 5,
    "electr": 5,
    "plumbers": 3,
    "hvac": 2
  },
  "solveTime": 0.001,
  "iterations": 0,
  "solver": "highs",
  "message": "HiGHS solver solution"
}
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node.js environment |
| `PORT` | `8080` | Service port |
| `SOLVER_TIMEOUT` | `300` | Solver timeout in seconds |
| `HIGHS_THREADS` | `4` | Number of HiGHS threads |
| `HIGHS_LOG_LEVEL` | `info` | HiGHS logging level |

### Resource Limits

- **Memory**: 2GB
- **CPU**: 2 cores
- **Max Instances**: 10
- **Timeout**: 300 seconds

## Integration with Main Platform

### 1. Update Environment Variables

Add to your main platform's `.env` file:

```bash
# Solver service URL
SOLVER_URL=https://solver.dcisionai.com
```

### 2. Update API Calls

Modify your frontend to call the solver service instead of local solver:

```typescript
// Before (local solver)
const response = await fetch('/api/solver/solve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ problem, solver: 'highs' })
});

// After (remote solver service)
const response = await fetch('https://solver.dcisionai.com/solve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ problem, solver: 'highs' })
});
```

### 3. Add Solver Service Client

Create a client utility for the solver service:

```typescript
// src/utils/solverClient.ts
export class SolverClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.SOLVER_URL || 'https://solver.dcisionai.com') {
    this.baseUrl = baseUrl;
  }

  async solve(problem: any, solver: string = 'highs') {
    const response = await fetch(`${this.baseUrl}/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problem, solver })
    });

    if (!response.ok) {
      throw new Error(`Solver error: ${response.statusText}`);
    }

    return response.json();
  }

  async health() {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }
}
```

## Monitoring and Logging

### Cloud Run Logs

```bash
# View logs
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=solver-service" --limit=50

# Stream logs
gcloud logs tail "resource.type=cloud_run_revision AND resource.labels.service_name=solver-service"
```

### Metrics

Monitor the service in Google Cloud Console:
- Request count
- Response time
- Error rate
- Memory usage
- CPU usage

## Troubleshooting

### Common Issues

1. **HiGHS not found**: Ensure HiGHS is properly installed in the Docker image
2. **Domain not accessible**: Check DNS configuration and domain mapping
3. **Timeout errors**: Increase timeout or optimize problem size
4. **Memory issues**: Increase memory allocation for large problems

### Debug Commands

```bash
# Check service status
gcloud run services describe solver-service --region=us-central1

# Test health endpoint
curl https://solver.dcisionai.com/health

# Check domain mapping
gcloud run domain-mappings list --region=us-central1

# View build logs
gcloud builds log BUILD_ID
```

## Security Considerations

1. **Authentication**: Consider adding API key authentication
2. **Rate Limiting**: Implement rate limiting for production use
3. **CORS**: Configure CORS for your domain
4. **Input Validation**: Validate problem input before solving

## Cost Optimization

1. **Instance Scaling**: Adjust max instances based on usage
2. **Memory Allocation**: Optimize memory allocation for your problem sizes
3. **Timeout Settings**: Set appropriate timeouts to avoid unnecessary costs
4. **Monitoring**: Monitor usage and adjust resources accordingly

## Next Steps

1. **Deploy the solver service** using the provided scripts
2. **Test the deployment** with the health and solver endpoints
3. **Update the main platform** to use the solver service
4. **Monitor performance** and adjust resources as needed
5. **Add OR-Tools implementation** for additional solver capabilities 