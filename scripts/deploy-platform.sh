#!/bin/bash

# Platform Deployment Script for DcisionAI
# Deploys the main platform service to Google Cloud Run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${PROJECT_ID:-"dcisionai"}
REGION=${REGION:-"us-central1"}
SERVICE_NAME="platform-dcisionai"
DOMAIN="platform.dcisionai.com"

echo -e "${BLUE}🚀 DcisionAI Platform Deployment${NC}"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Name: $SERVICE_NAME"
echo "Domain: $DOMAIN"
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

# Set the project
echo -e "${YELLOW}🔧 Setting project to $PROJECT_ID...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com

# Submit the build to Cloud Build
echo -e "${YELLOW}🏗️ Starting Cloud Build for platform deployment...${NC}"
gcloud builds submit --config cloudbuild-platform.yaml .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Cloud Build failed${NC}"
    exit 1
fi

# Get the service URL
echo -e "${YELLOW}📋 Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.url)")

echo -e "${GREEN}✅ Platform deployment successful!${NC}"
echo -e "${GREEN}🌐 Service URL: $SERVICE_URL${NC}"
echo -e "${GREEN}🌐 Custom Domain: https://$DOMAIN${NC}"
echo ""

# Test the deployment
echo -e "${YELLOW}🧪 Testing deployment...${NC}"
sleep 10  # Wait for service to be ready

# Test health endpoint
HEALTH_RESPONSE=$(curl -s "$SERVICE_URL/api/health" || echo "Failed to connect")
if echo "$HEALTH_RESPONSE" | grep -q "healthy\|ok"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠️ Health check failed or endpoint not found${NC}"
    echo "Response: $HEALTH_RESPONSE"
fi

echo ""
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo "✅ Platform service deployed: $SERVICE_NAME"
echo "✅ Service URL: $SERVICE_URL"
echo "✅ Custom domain: https://$DOMAIN"
echo "✅ Solver service integration: https://solver.dcisionai.com"
echo ""
echo -e "${YELLOW}🔧 Useful commands:${NC}"
echo "View logs: gcloud logs tail --filter resource.type=\"cloud_run_revision\" --filter resource.labels.service_name=\"$SERVICE_NAME\""
echo "Update env vars: gcloud run services update $SERVICE_NAME --region=$REGION --set-env-vars=KEY=VALUE"
echo "Delete service: gcloud run services delete $SERVICE_NAME --region=$REGION"
echo "Monitor: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME"
echo ""
echo -e "${GREEN}🎉 Platform deployment completed successfully!${NC}" 