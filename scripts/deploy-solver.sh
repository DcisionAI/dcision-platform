#!/bin/bash

# Solver Service Deployment Script
set -e

echo "🚀 Deploying Solver Service to GCP..."

# Load environment variables
if [ -f "config.solver.env" ]; then
    export $(cat config.solver.env | grep -v '^#' | xargs)
fi

# Set default values
PROJECT_ID=${PROJECT_ID:-"dcisionai"}
REGION=${REGION:-"us-central1"}
SERVICE_NAME=${SERVICE_NAME:-"solver-service"}
IMAGE_NAME=${IMAGE_NAME:-"gcr.io/$PROJECT_ID/$SERVICE_NAME"}

# Get current git commit hash for COMMIT_SHA
COMMIT_SHA=$(git rev-parse --short HEAD)

echo "📋 Project ID: $PROJECT_ID"
echo "🔧 Enabling required APIs..."

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID
gcloud services enable run.googleapis.com --project=$PROJECT_ID
gcloud services enable containerregistry.googleapis.com --project=$PROJECT_ID

echo "🏗️ Building and deploying solver service..."

# Build and deploy using Cloud Build
gcloud builds submit \
    --config cloudbuild-solver.yaml \
    --project=$PROJECT_ID \
    --substitutions=_PROJECT_ID=$PROJECT_ID,_REGION=$REGION,_SERVICE_NAME=$SERVICE_NAME,_IMAGE_NAME=$IMAGE_NAME,_COMMIT_SHA=$COMMIT_SHA

echo "✅ Solver service deployed successfully!"
echo ""
echo "🌐 Service URL: https://$SERVICE_NAME-$PROJECT_ID.a.run.app"
echo ""
echo "🔗 To map custom domain (run once manually):"
echo "   gcloud alpha run domain-mappings create \\"
echo "     --service $SERVICE_NAME \\"
echo "     --region $REGION \\"
echo "     --domain solver.dcisionai.com \\"
echo "     --project $PROJECT_ID"
echo ""
echo "🧪 Test the service:"
echo "   curl https://$SERVICE_NAME-$PROJECT_ID.a.run.app/health"
echo ""
echo "📊 View logs:"
echo "   gcloud logs tail --service=$SERVICE_NAME --project=$PROJECT_ID" 