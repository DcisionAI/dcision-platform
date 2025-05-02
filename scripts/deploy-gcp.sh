#!/bin/bash

# Check if project ID is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <project-id>"
  exit 1
fi

PROJECT_ID=$1
REGION="us-central1"
SERVICE_ACCOUNT="dcisionai-compute@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Starting deployment to project: $PROJECT_ID"

# Grant Secret Manager Secret Accessor role to the service account
echo "Granting Secret Manager Secret Accessor role to service account..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

# Deploy all services using the single Cloud Build configuration
echo "Deploying services..."
gcloud builds submit --config=gcp/cloudbuild.yaml \
  --substitutions=_REGION="$REGION",_PLUGIN_SERVICE_URL="https://plugin-service-${REGION}-${PROJECT_ID}.a.run.app",_SOLVER_SERVICE_URL="https://solver-service-${REGION}-${PROJECT_ID}.a.run.app"

echo "Deployment complete!"
echo "Frontend URL: https://frontend-${REGION}-${PROJECT_ID}.a.run.app"
echo "Solver Service URL: https://solver-service-${REGION}-${PROJECT_ID}.a.run.app"
echo "Plugin Service URL: https://plugin-service-${REGION}-${PROJECT_ID}.a.run.app" 