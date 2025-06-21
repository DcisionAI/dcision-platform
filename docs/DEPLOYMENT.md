# DcisionAI Solver Deployment Guide

This guide covers deploying the DcisionAI Solver service to Google Cloud Platform (GCP) with the custom domain `solver.dcisionai.com`.

## 🚀 Quick Deploy

### Prerequisites
1. **Google Cloud SDK** installed and authenticated
2. **GCP Project** with billing enabled
3. **Domain** `solver.dcisionai.com` configured in Cloud DNS

### One-Command Deployment
```bash
npm run deploy
```

This will:
- Build the Docker image
- Deploy to Cloud Run
- Map the custom domain
- Verify the deployment

## 🔧 Manual Deployment

### 1. Set Environment Variables
```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"
```

### 2. Enable Required APIs
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 3. Deploy with Cloud Build
```bash
gcloud builds submit --config cloudbuild.yaml .
```

### 4. Map Custom Domain
```bash
gcloud run domain-mappings create \
  --service dcisionai-solver \
  --domain solver.dcisionai.com \
  --region us-central1 \
  --force-override
```

## 🌐 Domain Configuration

### DNS Setup
Ensure your domain `solver.dcisionai.com` points to the Cloud Run service:

1. **Add CNAME record** in your DNS provider:
   ```
   solver.dcisionai.com CNAME ghs.googlehosted.com.
   ```

2. **Verify domain ownership** in Google Cloud Console

3. **SSL certificate** will be automatically provisioned

## 🔒 Environment Variables

Set these in Cloud Run or via the deployment script:

```bash
NODE_ENV=production
SOLVER_URL=https://solver.dcisionai.com
SOLVER_API_KEY=your-solver-api-key
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-pinecone-environment
PINECONE_INDEX_NAME=dcisionai-knowledge
```

## 📊 Monitoring

### Cloud Run Metrics
- **CPU Usage**: Monitor in Cloud Console
- **Memory Usage**: Set to 2Gi for optimal performance
- **Request Count**: Track API usage
- **Response Time**: Monitor solver performance

### Logs
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=dcisionai-solver"
```

## 🔄 Updates

### Rolling Updates
```bash
npm run deploy
```

### Blue-Green Deployment
1. Deploy to staging service
2. Test thoroughly
3. Update production service
4. Switch traffic

## 🛠️ Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   gcloud builds log [BUILD_ID]
   ```

2. **Domain Not Accessible**
   ```bash
   # Verify DNS propagation
   dig solver.dcisionai.com
   ```

3. **Service Not Starting**
   ```bash
   # Check service logs
   gcloud run services logs read dcisionai-solver --region=us-central1
   ```

### Performance Tuning
- **Memory**: Increase to 4Gi for complex optimizations
- **CPU**: Scale to 4 cores for high throughput
- **Instances**: Set max instances based on expected load

## 💰 Cost Optimization

- **CPU Allocation**: Use 1-2 cores for most workloads
- **Memory**: Start with 2Gi, scale as needed
- **Instances**: Set appropriate min/max instance counts
- **Region**: Choose closest to your users

## 🔐 Security

- **HTTPS**: Automatically enabled with custom domain
- **Authentication**: Implement API key validation
- **CORS**: Configure for your frontend domains
- **Rate Limiting**: Implement in your API routes

## 📞 Support

For deployment issues:
1. Check Cloud Build logs
2. Verify environment variables
3. Test locally first
4. Review Cloud Run service logs 