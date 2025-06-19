#!/bin/bash

# Complete Deployment Script for DcisionAI Platform
# Deploys both frontend and backend services to Cloud Run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 DcisionAI Platform - Complete Deployment${NC}"
echo "This script will deploy both frontend and backend services to Cloud Run"
echo ""

# Check if gcloud is configured
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}❌ Error: gcloud is not authenticated. Please run 'gcloud auth login'${NC}"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: PROJECT_ID is not set. Please run 'gcloud config set project YOUR_PROJECT_ID'${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Current Configuration:${NC}"
echo "Project ID: $PROJECT_ID"
echo ""

# Check for required environment variables
echo -e "${YELLOW}🔧 Environment Variables Setup${NC}"
echo "Please provide the following values:"
echo ""

# Supabase URL
if [ -z "$SUPABASE_URL" ]; then
    read -p "Enter your Supabase URL: " SUPABASE_URL
    export SUPABASE_URL
fi

# Supabase Anon Key
if [ -z "$SUPABASE_ANON_KEY" ]; then
    read -p "Enter your Supabase Anon Key: " SUPABASE_ANON_KEY
    export SUPABASE_ANON_KEY
fi

# Anthropic API Key
if [ -z "$ANTHROPIC_API_KEY" ]; then
    read -p "Enter your Anthropic API Key: " ANTHROPIC_API_KEY
    export ANTHROPIC_API_KEY
fi

echo ""
echo -e "${GREEN}✅ Environment variables configured${NC}"
echo ""

# Confirm deployment
echo -e "${YELLOW}⚠️  Deployment Summary:${NC}"
echo "• Frontend Service: dcisionai-frontend"
echo "• Backend Service: dcisionai-backend"
echo "• Region: us-central1"
echo "• Both services will be publicly accessible"
echo ""

read -p "Proceed with deployment? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🚀 Starting deployment...${NC}"

# Deploy using Cloud Build
echo -e "${YELLOW}📦 Building and deploying services...${NC}"
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_SUPABASE_URL="$SUPABASE_URL",_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY",_ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo ""

# Get service URLs
echo -e "${BLUE}🌐 Service URLs:${NC}"
FRONTEND_URL=$(gcloud run services describe dcisionai-frontend --region=us-central1 --format="value(status.url)")
BACKEND_URL=$(gcloud run services describe dcisionai-backend --region=us-central1 --format="value(status.url)")

echo "Frontend: $FRONTEND_URL"
echo "Backend: $BACKEND_URL"
echo ""

# Health check
echo -e "${YELLOW}🔍 Running health checks...${NC}"
echo "Checking frontend..."
if curl -f -s "$FRONTEND_URL" > /dev/null; then
    echo -e "${GREEN}✅ Frontend is responding${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
fi

echo "Checking backend..."
if curl -f -s "$BACKEND_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ Backend is responding${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check failed (this might be normal if /health endpoint doesn't exist)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Visit your frontend: $FRONTEND_URL"
echo "2. Test the backend API: $BACKEND_URL/docs"
echo "3. Set up monitoring and alerting"
echo "4. Configure custom domain (optional)"
echo ""
echo -e "${BLUE}🔧 Useful commands:${NC}"
echo "View logs: gcloud logs tail --filter resource.type=\"cloud_run_revision\""
echo "Update frontend: gcloud run services update dcisionai-frontend --region=us-central1"
echo "Update backend: gcloud run services update dcisionai-backend --region=us-central1"
echo "Delete services: gcloud run services delete dcisionai-frontend dcisionai-backend --region=us-central1" 