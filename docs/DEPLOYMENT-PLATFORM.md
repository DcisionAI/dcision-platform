# DcisionAI Platform Deployment Guide

This guide covers deploying the DcisionAI Platform service to Google Cloud Platform (GCP) with the custom domain `platform.dcisionai.com`.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Production Architecture              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │   Platform      │    │   Solver        │    │   Agent Backend │            │
│  │   Service       │    │   Service       │    │   Service       │            │
│  │                 │    │                 │    │                 │            │
│  │ • Next.js App   │    │ • Optimization  │    │ • LLM Agents    │            │
│  │ • UI/UX         │    │ • HiGHS Solver  │    │ • Intent, Data, │            │
│  │ • API Gateway   │    │ • MCP Protocol  │    │   ModelBuilder, │            │
│  │ • Agent Logic   │    │ • Problem       │    │   Explain       │            │
│  │ • RAG System    │    │   Processing    │    │ • FastAPI       │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
│           │                       │                    │                      │
│           │                       │                    │                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │ platform.       │    │ solver.         │    │ agents.         │            │
│  │ dcisionai.com   │    │ dcisionai.com   │    │ dcisionai.com   │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **GCP Project**: `dcisionai` project with billing enabled
2. **Domain**: `platform.dcisionai.com` configured in Cloud DNS
3. **Solver Service**: Already deployed at `solver.dcisionai.com`
4. **gcloud CLI**: Authenticated and configured

## Quick Deployment

### 1. Deploy Platform Service

```bash
# Set environment variables
export PROJECT_ID=dcisionai
export REGION=us-central1

# Deploy using the deployment script
npm run deploy:platform

# Or manually
./scripts/deploy-platform.sh
```

### 2. Verify Deployment

```bash
# Check service status
gcloud run services describe platform-dcisionai --region=us-central1

# Test health endpoint
curl https://platform.dcisionai.com/api/health

# Test solver integration
curl https://platform.dcisionai.com/api/solver/solve \
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

## Manual Deployment Steps

### 1. Build and Deploy

```bash
# Build the Docker image
docker build -t gcr.io/dcisionai/platform-dcisionai:latest .

# Push to Google Container Registry
docker push gcr.io/dcisionai/platform-dcisionai:latest

# Deploy to Cloud Run
gcloud run deploy platform-dcisionai \
  --image gcr.io/dcisionai/platform-dcisionai:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production,SOLVER_SERVICE_URL=https://solver.dcisionai.com
```

### 2. Map Custom Domain

```bash
# Map the custom domain
gcloud run domain-mappings create \
  --service platform-dcisionai \
  --domain platform.dcisionai.com \
  --region us-central1 \
  --force-override
```

### 3. Configure DNS

Ensure your domain `platform.dcisionai.com` points to the Cloud Run service:

```bash
# Add CNAME record in your DNS provider
platform.dcisionai.com CNAME ghs.googlehosted.com.
```

## Environment Variables

### Required Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Node.js environment |
| `SOLVER_SERVICE_URL` | `https://solver.dcisionai.com` | Solver service endpoint |

### Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Service port |
| `LOG_LEVEL` | `info` | Logging level |

### Set Environment Variables

```bash
# Update environment variables
gcloud run services update platform-dcisionai \
  --region=us-central1 \
  --set-env-vars NODE_ENV=production,SOLVER_SERVICE_URL=https://solver.dcisionai.com
```

## Service Configuration

### Resource Limits

- **Memory**: 2GB
- **CPU**: 2 cores
- **Max Instances**: 10
- **Timeout**: 300 seconds
- **Concurrency**: 80 requests per instance

### Scaling Configuration

```bash
# Update scaling configuration
gcloud run services update platform-dcisionai \
  --region=us-central1 \
  --max-instances=10 \
  --min-instances=0 \
  --concurrency=80
```

## Monitoring and Logging

### View Logs

```bash
# View real-time logs
gcloud logs tail --filter resource.type="cloud_run_revision" \
  --filter resource.labels.service_name="platform-dcisionai"

# View specific log entries
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=platform-dcisionai" \
  --limit=50 --format="table(timestamp,severity,textPayload)"
```

### Health Monitoring

```bash
# Test health endpoint
curl https://platform.dcisionai.com/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "dcisionai-platform",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 3600,
  "memory": {...},
  "solver_service_url": "https://solver.dcisionai.com",
  "solver_service": "healthy"
}
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   gcloud builds log [BUILD_ID]
   
   # Rebuild with verbose output
   docker build --progress=plain -t gcr.io/dcisionai/platform-dcisionai:latest .
   ```

2. **Service Not Starting**
   ```bash
   # Check service logs
   gcloud logs tail --filter resource.type="cloud_run_revision" \
     --filter resource.labels.service_name="platform-dcisionai"
   
   # Check service status
   gcloud run services describe platform-dcisionai --region=us-central1
   ```

3. **Domain Mapping Issues**
   ```bash
   # Check domain mapping status
   gcloud run domain-mappings list --region=us-central1
   
   # Verify DNS propagation
   dig platform.dcisionai.com
   nslookup platform.dcisionai.com
   ```

4. **Solver Integration Issues**
   ```bash
   # Test solver service directly
   curl https://solver.dcisionai.com/health
   
   # Check environment variables
   gcloud run services describe platform-dcisionai \
     --region=us-central1 --format="value(spec.template.spec.containers[0].env[].name,spec.template.spec.containers[0].env[].value)"
   ```

### Performance Optimization

1. **Enable CDN**
   ```bash
   # Enable Cloud CDN for static assets
   gcloud compute backend-buckets create platform-static \
     --gcs-bucket-name=your-static-bucket
   ```

2. **Optimize Docker Image**
   ```bash
   # Use multi-stage build (already implemented)
   # Consider using distroless images for smaller size
   ```

3. **Database Connection Pooling**
   ```bash
   # Configure connection pooling in your database settings
   # Use connection pooling libraries like pg-pool
   ```

## Security Considerations

### 1. Authentication (Future Enhancement)

```bash
# Enable authentication (when needed)
gcloud run services update platform-dcisionai \
  --region=us-central1 \
  --no-allow-unauthenticated
```

### 2. HTTPS Enforcement

```bash
# HTTPS is automatically enforced by Cloud Run
# All traffic is redirected to HTTPS
```

### 3. CORS Configuration

The platform service includes CORS headers for cross-origin requests:

```typescript
// Configured in API endpoints
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
```

## Rollback Strategy

### 1. Rollback to Previous Version

```bash
# List revisions
gcloud run revisions list --service=platform-dcisionai --region=us-central1

# Rollback to specific revision
gcloud run services update-traffic platform-dcisionai \
  --region=us-central1 \
  --to-revisions=REVISION_NAME=100
```

### 2. Emergency Rollback

```bash
# Quick rollback to previous version
gcloud run services update-traffic platform-dcisionai \
  --region=us-central1 \
  --to-latest
```

## Cost Optimization

### 1. Resource Optimization

```bash
# Adjust resource limits based on usage
gcloud run services update platform-dcisionai \
  --region=us-central1 \
  --memory=1Gi \
  --cpu=1 \
  --max-instances=5
```

### 2. Scaling Configuration

```bash
# Set minimum instances to 0 for cost savings
gcloud run services update platform-dcisionai \
  --region=us-central1 \
  --min-instances=0
```

## Integration Testing

### 1. End-to-End Testing

```bash
# Test complete workflow
curl -X POST https://platform.dcisionai.com/api/dcisionai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Solve a simple optimization problem",
    "session_id": "test-session"
  }'
```

### 2. Solver Integration Test

```bash
# Test solver service integration
curl -X POST https://platform.dcisionai.com/api/solver/solve \
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

## Support and Maintenance

### 1. Regular Maintenance

- Monitor resource usage and costs
- Update dependencies regularly
- Review and rotate secrets
- Monitor security advisories

### 2. Backup Strategy

- Database backups (if applicable)
- Configuration backups
- Code repository backups

### 3. Incident Response

- Monitor service health
- Set up alerting for critical issues
- Document incident response procedures
- Maintain runbooks for common issues

## Next Steps

1. **Set up monitoring and alerting**
2. **Configure CI/CD pipeline**
3. **Implement authentication and authorization**
4. **Add rate limiting and security measures**
5. **Set up automated testing**
6. **Configure backup and disaster recovery**

---

For additional support, refer to:
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [DcisionAI Architecture Guide](docs/architecture/architecture.md)
- [Solver Service Deployment](docs/DEPLOYMENT.md)

## Agent Backend (Agno) Service Deployment

### 1. Build & Deploy

```bash
# Build and push Docker image
gcloud builds submit --tag gcr.io/dcisionai/agno-backend ./agno-backend

# Deploy to Cloud Run
gcloud run deploy agno-backend \
  --image gcr.io/dcisionai/agno-backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8000
```

### 2. Map Custom Domain

```bash
gcloud beta run domain-mappings create \
  --service agno-backend \
  --domain agents.dcisionai.com \
  --region us-central1 \
  --force-override
```

### 3. DNS Configuration

Add this CNAME record with your DNS provider:
```
agents  CNAME  ghs.googlehosted.com.
```

### 4. Health Check

```bash
curl https://agents.dcisionai.com/health
```

## Required Environment Variables (Platform)

| Variable             | Value                                 | Description                        |
|----------------------|---------------------------------------|------------------------------------|
| `AGNO_BACKEND_URL`   | `https://agents.dcisionai.com`        | Agent backend endpoint             |
| `SOLVER_SERVICE_URL` | `https://solver.dcisionai.com`        | Solver service endpoint            |
| `OPENAI_API_KEY`     | `<your-openai-api-key>`               | LLM API key                        |
| `JWT_SECRET`         | `<your-jwt-secret>`                   | JWT secret                         |
| `ENCRYPTION_KEY`     | `<your-encryption-key>`               | Encryption key                     |
| `SUPABASE_URL`       | `<your-supabase-url>`                 | Supabase project URL               |
| `SUPABASE_ANON_KEY`  | `<your-supabase-anon-key>`            | Supabase anon key                  |
| `SUPABASE_SERVICE_KEY`| `<your-supabase-service-key>`        | Supabase service key               |

## Troubleshooting (Agent Backend)

- If agent flows fail with errors like `ECONNREFUSED 127.0.0.1:8000`, ensure `AGNO_BACKEND_URL` is set and points to the correct domain.
- If `agents.dcisionai.com` fails SSL, wait for certificate provisioning after DNS is set.
- Check agent backend logs:
  ```bash
  gcloud run services logs read agno-backend --region=us-central1
  ```
- Test health endpoint:
  ```bash
  curl https://agents.dcisionai.com/health
  ``` 