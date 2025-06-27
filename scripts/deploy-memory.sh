#!/bin/bash

# Memory (Redis) Service Deployment Script
set -e

echo "🚀 Deploying Redis (Memorystore) to GCP..."

# Load environment variables
if [ -f "config.memory.env" ]; then
    export $(cat config.memory.env | grep -v '^#' | xargs)
fi

# Set default values
PROJECT_ID=${PROJECT_ID:-"dcisionai"}
REGION=${REGION:-"us-central1"}
REDIS_INSTANCE_NAME=${REDIS_INSTANCE_NAME:-"dcisionai-redis"}
REDIS_TIER=${REDIS_TIER:-"standard"}
REDIS_SIZE_GB=${REDIS_SIZE_GB:-1}
VPC_NETWORK=${VPC_NETWORK:-"default"}

echo "📋 Project ID: $PROJECT_ID"
echo "🔧 Enabling required APIs..."

gcloud services enable redis.googleapis.com --project=$PROJECT_ID

echo "🏗️ Creating Redis instance..."

gcloud redis instances create $REDIS_INSTANCE_NAME \
    --size=$REDIS_SIZE_GB \
    --region=$REGION \
    --tier=$REDIS_TIER \
    --network=$VPC_NETWORK \
    --project=$PROJECT_ID

echo "✅ Redis instance deployed successfully!"
echo ""
echo "🔗 To view instance details:"
echo "   gcloud redis instances describe $REDIS_INSTANCE_NAME --region=$REGION --project=$PROJECT_ID"
echo "" 