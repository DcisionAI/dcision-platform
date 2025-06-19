#!/bin/bash

# Cloud Run Deployment Script for DcisionAI Platform
# This script helps deploy the frontend to Google Cloud Run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${PROJECT_ID:-$(gcloud config get-value project)}
REGION=${REGION:-us-central1}
SERVICE_NAME=${SERVICE_NAME:-dcisionai-frontend}
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

echo -e "${GREEN}🚀 DcisionAI Platform Cloud Run Deployment${NC}"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Name: $SERVICE_NAME"
echo "Image: $IMAGE_NAME"
echo ""

# Check if gcloud is configured
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}❌ Error: gcloud is not authenticated. Please run 'gcloud auth login'${NC}"
    exit 1
fi

# Check if project is set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: PROJECT_ID is not set. Please set it or run 'gcloud config set project YOUR_PROJECT_ID'${NC}"
    exit 1
fi

# Build the Docker image
echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build -t "$IMAGE_NAME" .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi

# Push the image to Google Container Registry
echo -e "${YELLOW}📤 Pushing image to Google Container Registry...${NC}"
docker push "$IMAGE_NAME"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker push failed${NC}"
    exit 1
fi

# Deploy to Cloud Run
echo -e "${YELLOW}🚀 Deploying to Cloud Run...${NC}"

# Check if service exists
if gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(name)" >/dev/null 2>&1; then
    echo "Updating existing service..."
    gcloud run services update "$SERVICE_NAME" \
        --image="$IMAGE_NAME" \
        --region="$REGION" \
        --port=8080 \
        --set-env-vars="NODE_ENV=production" \
        --set-env-vars="AGNO_BACKEND_URL=${AGNO_BACKEND_URL:-https://your-agno-backend-url.com}"
else
    echo "Creating new service..."
    gcloud run deploy "$SERVICE_NAME" \
        --image="$IMAGE_NAME" \
        --platform=managed \
        --region="$REGION" \
        --allow-unauthenticated \
        --port=8080 \
        --set-env-vars="NODE_ENV=production" \
        --set-env-vars="AGNO_BACKEND_URL=${AGNO_BACKEND_URL:-https://your-agno-backend-url.com}"
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Cloud Run deployment failed${NC}"
    exit 1
fi

# Get the service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.url)")

echo -e "${GREEN}✅ Deployment successful!${NC}"
echo -e "${GREEN}🌐 Service URL: $SERVICE_URL${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Set up environment variables in Cloud Run console"
echo "2. Configure your Agno backend URL"
echo "3. Set up monitoring and alerting"
echo "4. Configure custom domain (optional)"
echo ""
echo -e "${YELLOW}🔧 Useful commands:${NC}"
echo "View logs: gcloud logs tail --filter resource.type=\"cloud_run_revision\""
echo "Update env vars: gcloud run services update $SERVICE_NAME --region=$REGION --set-env-vars=KEY=VALUE"
echo "Delete service: gcloud run services delete $SERVICE_NAME --region=$REGION" 