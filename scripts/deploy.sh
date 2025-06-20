#!/bin/bash
# Deploys both the Frontend and Solver services to GCP Cloud Run.

set -e

# Configuration
PROJECT_ID=${PROJECT_ID:-"dcisionai"}
REGION=${REGION:-"us-central1"}

echo "🚀 Deploying DcisionAI Platform to GCP..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"

# Authenticate with gcloud
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with gcloud. Please run 'gcloud auth login'."
    exit 1
fi

gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com

# Submit the build to Cloud Build
echo "🏗️ Starting Cloud Build to deploy both services..."
gcloud builds submit --config cloudbuild.yaml .

echo "✅ Cloud Build pipeline started successfully."
echo "Monitor progress at: https://console.cloud.google.com/cloud-build/builds?project=$PROJECT_ID"
echo "🎉 Deployment will complete shortly." 