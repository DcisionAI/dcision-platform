#!/bin/bash

# Test MCP submit endpoint with a sample payload
API_URL="http://localhost:3000/api/mcp/submit"
PAYLOAD_FILE="scripts/sample-mcp.json"

if [ ! -f "$PAYLOAD_FILE" ]; then
  cat > "$PAYLOAD_FILE" <<EOL
{
  "sessionId": "test-session-001",
  "version": "1.0",
  "status": "pending",
  "created": "2024-06-01T10:00:00Z",
  "lastModified": "2024-06-01T10:00:00Z",
  "model": {
    "variables": [],
    "constraints": [],
    "objective": {
      "type": "minimize",
      "field": "cost",
      "description": "Minimize total cost",
      "weight": 1
    }
  },
  "context": {
    "environment": {},
    "dataset": {
      "internalSources": [],
      "metadata": {
        "userInput": "I want to optimize my delivery fleet for cost and time."
      }
    },
    "problemType": "fleet_scheduling"
  },
  "protocol": {
    "steps": [
      {
        "action": "interpret_intent",
        "description": "Interpret user intent and select the right optimization model.",
        "required": true,
        "agent": "Intent Interpreter Agent"
      },
      {
        "action": "productionalize_workflow",
        "description": "Deploy the workflow as a live endpoint.",
        "required": true,
        "agent": "Process Automation Agent"
      }
    ],
    "allowPartialSolutions": false,
    "explainabilityEnabled": false,
    "humanInTheLoop": {
      "required": false,
      "approvalSteps": []
    }
  }
}
EOL
  echo "Sample payload created at $PAYLOAD_FILE"
fi

echo "Testing MCP submit endpoint..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d @$PAYLOAD_FILE
echo # Add newline after response 