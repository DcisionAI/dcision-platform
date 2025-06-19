#!/bin/bash

# Agno Backend Startup Script
# This script helps you get the Agno Python backend running

echo "🚀 Starting Agno Backend Setup..."

# Check if Python 3.11+ is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11 or higher."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "✅ Python version: $PYTHON_VERSION"

# Navigate to agno-backend directory
cd agno-backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your API keys:"
    echo "   - ANTHROPIC_API_KEY=your_anthropic_key_here"
    echo "   - OPENAI_API_KEY=your_openai_key_here"
    echo ""
    echo "📁 Edit: agno-backend/.env"
    echo ""
    read -p "Press Enter after you've added your API keys..."
fi

# Check if API keys are set
if ! grep -q "your_anthropic_api_key_here" .env && ! grep -q "your_openai_api_key_here" .env; then
    echo "✅ API keys appear to be configured"
else
    echo "⚠️  Please configure your API keys in .env file"
    exit 1
fi

# Start the server
echo "🌟 Starting Agno Backend server..."
echo "📡 Server will be available at: http://localhost:8000"
echo "📚 API docs will be available at: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

uvicorn main:app --host 0.0.0.0 --port 8000 --reload 