#!/bin/bash

# Deploy DcisionAI Solver to GCP Cloud Run
# This script deploys the Next.js app to Cloud Run with the solver.dcisionai.com domain

set -e

# Configuration
PROJECT_ID=${PROJECT_ID:-"dcisionai"}
REGION=${REGION:-"us-central1"}
SERVICE_NAME="solver-service"
DOMAIN="solver.dcisionai.com"

echo "🚀 Deploying DcisionAI Solver to GCP..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo "Domain: $DOMAIN"

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with gcloud. Please run 'gcloud auth login' first."
    exit 1
fi

# Set the project
echo "📋 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy using Cloud Build
echo "🏗️ Building and deploying with Cloud Build..."
gcloud builds submit --config cloudbuild.yaml .

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo "✅ Deployment complete!"
echo "Service URL: $SERVICE_URL"
echo "Custom Domain: https://$DOMAIN"

# Verify the deployment
echo "🔍 Verifying deployment..."
sleep 10
curl -f -s "https://$DOMAIN" > /dev/null && echo "✅ Domain is accessible" || echo "⚠️ Domain may not be accessible yet (DNS propagation)"

echo "🎉 DcisionAI Solver is now live at https://$DOMAIN" 