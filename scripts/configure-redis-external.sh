#!/bin/bash

set -e

REGION=${REGION:-us-central1}
PROJECT_ID=$(gcloud config get-value project)

if [ -z "$REGION" ]; then
  echo "❌ REGION is not set. Please set REGION at the top of this script or export REGION in your environment."
  exit 1
fi

echo "🔧 Configuring minimal Redis proxy for Cloud Run in region: $REGION ..."

# Build minimal Redis proxy image
cp Dockerfile.redis-proxy Dockerfile

echo "🏗️ Building Redis proxy container..."
# Simplified build command without custom storage buckets
gcloud builds submit --tag gcr.io/$PROJECT_ID/redis-proxy . --timeout=15m

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy redis-proxy \
  --image gcr.io/$PROJECT_ID/redis-proxy \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 6379 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 2

# Get the Cloud Run URL
CLOUD_RUN_URL=$(gcloud run services describe redis-proxy --region=$REGION --format="value(status.url)")

echo "✅ Redis proxy deployed to: $CLOUD_RUN_URL"
echo "🔑 Use this URL as your REDIS_HOST (with port 6379) in your platform .env"

# Option 2: Create a Compute Engine instance with Redis
echo "🖥️ Alternative: Creating Compute Engine instance with Redis..."

# Create startup script
cat > startup-script.sh << 'EOF'
#!/bin/bash
# Install Redis
apt-get update
apt-get install -y redis-server

# Configure Redis for external access
sed -i 's/bind 127.0.0.1/bind 0.0.0.0/' /etc/redis/redis.conf
sed -i 's/protected-mode yes/protected-mode no/' /etc/redis/redis.conf

# Start Redis
systemctl enable redis-server
systemctl start redis-server

# Install firewall rules
gcloud compute firewall-rules create redis-external \
  --allow tcp:6379 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow Redis external access"
EOF

# Create Compute Engine instance
echo "🖥️ Creating Compute Engine instance..."
gcloud compute instances create redis-external \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=debian-11 \
  --image-project=debian-cloud \
  --metadata-from-file startup-script=startup-script.sh \
  --tags=redis-server

# Get external IP
EXTERNAL_IP=$(gcloud compute instances describe redis-external --zone=us-central1-a --format="value(networkInterfaces[0].accessConfigs[0].natIP)")

echo "✅ Redis instance created with external IP: $EXTERNAL_IP"

# Create environment file template
cat > .env.redis-external << EOF
# Redis External Access Configuration
# Choose one of the following options:

# Option 1: Cloud Run Redis Proxy
REDIS_HOST_CLOUD_RUN=$CLOUD_RUN_URL
REDIS_PORT_CLOUD_RUN=6379

# Option 2: Compute Engine Redis
REDIS_HOST_COMPUTE=$EXTERNAL_IP
REDIS_PORT_COMPUTE=6379

# Current configuration (GCP internal)
REDIS_HOST=10.129.255.12
REDIS_PORT=6379

# Recommended for development:
# REDIS_HOST=\$REDIS_HOST_COMPUTE
# REDIS_PORT=\$REDIS_PORT_COMPUTE
EOF

echo "📝 Environment configuration saved to .env.redis-external"
echo "🔧 To use external Redis, update your .env.local with the external IP"
echo "🌐 External Redis IP: $EXTERNAL_IP"
echo "☁️ Cloud Run URL: $CLOUD_RUN_URL"

# Cleanup temporary files
rm -f Dockerfile.redis-proxy redis.conf startup-script.sh

echo "✅ Redis external access configuration complete!" 