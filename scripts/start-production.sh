#!/bin/bash

# Production startup script for DcisionAI Platform
# Runs both Agno backend (Python) and Next.js frontend

set -e

echo "🚀 Starting DcisionAI Platform (Production Mode)"

# Function to handle shutdown gracefully
cleanup() {
    echo "🛑 Shutting down services..."
    kill $AGNO_PID $NEXT_PID 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Start Agno backend in the background
echo "🐍 Starting Agno backend (Python)..."
cd agno-backend
python3 main.py &
AGNO_PID=$!
cd ..

# Wait a moment for Agno to start
sleep 3

# Check if Agno backend is running
if ! kill -0 $AGNO_PID 2>/dev/null; then
    echo "❌ Failed to start Agno backend"
    exit 1
fi

echo "✅ Agno backend started (PID: $AGNO_PID)"

# Start Next.js application
echo "⚛️  Starting Next.js application..."
yarn start &
NEXT_PID=$!

# Wait a moment for Next.js to start
sleep 5

# Check if Next.js is running
if ! kill -0 $NEXT_PID 2>/dev/null; then
    echo "❌ Failed to start Next.js application"
    kill $AGNO_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Next.js application started (PID: $NEXT_PID)"
echo "🎉 DcisionAI Platform is running!"
echo "   - Frontend: http://localhost:8080"
echo "   - Agno Backend: http://localhost:8000"

# Wait for either process to exit
wait $AGNO_PID $NEXT_PID

# If we get here, one of the processes has exited
echo "⚠️  One of the services has stopped"
cleanup 