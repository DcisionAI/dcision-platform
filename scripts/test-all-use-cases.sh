#!/bin/bash

# Test All Use Cases Script
# This script tests all three use cases (RAG, Optimization, Hybrid) for the agentic workflow system

echo "🧪 Testing DcisionAI Agentic Workflow System"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test a use case
test_use_case() {
    local use_case=$1
    local query=$2
    local description=$3
    
    echo -e "\n${BLUE}Testing $description (Use Case: $use_case)${NC}"
    echo "Query: $query"
    echo "----------------------------------------"
    
    # Make the API call
    response=$(curl -s -X POST http://localhost:3000/api/test-simple-agent \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$query\", \"useCase\": \"$use_case\"}" \
        --max-time 15)
    
    # Check if the request was successful
    if [ $? -eq 0 ]; then
        # Extract success status from JSON response
        success=$(echo "$response" | grep -o '"success":[^,]*' | cut -d':' -f2 | tr -d ' ')
        
        if [ "$success" = "true" ]; then
            echo -e "${GREEN}✅ SUCCESS${NC}"
            echo "Response: $response" | jq '.' 2>/dev/null || echo "Response: $response"
        else
            echo -e "${RED}❌ FAILED${NC}"
            echo "Response: $response" | jq '.' 2>/dev/null || echo "Response: $response"
        fi
    else
        echo -e "${RED}❌ TIMEOUT or ERROR${NC}"
        echo "Request failed or timed out"
    fi
}

# Function to test complete workflow
test_complete_workflow() {
    echo -e "\n${BLUE}Testing Complete Workflow${NC}"
    echo "Query: Optimize supply chain for cost reduction"
    echo "----------------------------------------"
    
    response=$(curl -s -X POST http://localhost:3000/api/test-workflow-steps \
        -H "Content-Type: application/json" \
        -d '{"query": "Optimize supply chain for cost reduction", "useCase": "optimization"}' \
        --max-time 35)
    
    if [ $? -eq 0 ]; then
        success=$(echo "$response" | grep -o '"success":[^,]*' | cut -d':' -f2 | tr -d ' ')
        
        if [ "$success" = "true" ]; then
            echo -e "${GREEN}✅ WORKFLOW COMPLETED SUCCESSFULLY${NC}"
            echo "Events count: $(echo "$response" | jq '.events | length' 2>/dev/null || echo 'N/A')"
        else
            echo -e "${YELLOW}⚠️  WORKFLOW PARTIALLY COMPLETED${NC}"
            echo "Events count: $(echo "$response" | jq '.events | length' 2>/dev/null || echo 'N/A')"
        fi
        echo "Response preview: $(echo "$response" | jq '.events[0:2]' 2>/dev/null || echo 'N/A')"
    else
        echo -e "${RED}❌ WORKFLOW TIMEOUT${NC}"
        echo "Workflow test timed out (expected in some cases)"
    fi
}

# Check if server is running
echo "Checking server status..."
server_status=$(curl -s http://localhost:3000/api/health 2>/dev/null)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Server is not running. Please start the development server first:${NC}"
    echo "npm run dev"
    exit 1
else
    echo -e "${GREEN}✅ Server is running${NC}"
fi

# Test all three use cases
test_use_case "rag" "What is the capital of France?" "RAG (Retrieval-Augmented Generation)"
test_use_case "optimization" "Optimize production schedule for maximum efficiency" "Optimization"
test_use_case "hybrid" "Analyze market data and optimize pricing strategy" "Hybrid"

# Test complete workflow
test_complete_workflow

echo -e "\n${GREEN}🎉 Testing Complete!${NC}"
echo "=============================================="
echo "All three use cases have been tested."
echo "Check the results above for any issues."
echo ""
echo "For detailed testing information, see:"
echo "docs/AGENTIC_TESTING_GUIDE.md" 