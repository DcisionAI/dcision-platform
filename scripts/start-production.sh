#!/bin/bash

# Production startup script for DcisionAI Platform
# For Cloud Run deployment - runs only Next.js frontend

set -e

echo "🚀 Starting DcisionAI Platform (Production Mode)"

# Set the port for Cloud Run
export PORT=${PORT:-8080}
export HOSTNAME=0.0.0.0

echo "📋 Environment:"
echo "   - PORT: $PORT"
echo "   - HOSTNAME: $HOSTNAME"
echo "   - NODE_ENV: production"

# Start Next.js application directly (no background process)
echo "⚛️  Starting Next.js application on $HOSTNAME:$PORT..."
exec NODE_ENV=production npx next start -H $HOSTNAME -p $PORT 