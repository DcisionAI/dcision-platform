#!/bin/bash

# Test Solver Service
# This script tests the solver service endpoints

set -e

echo "🧪 Testing Solver Service..."

# Default URL (can be overridden)
SOLVER_URL=${SOLVER_URL:-"http://localhost:8081"}

echo "📋 Testing solver service at: $SOLVER_URL"

# Test 1: Health Check
echo ""
echo "1️⃣ Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$SOLVER_URL/health" || echo "Failed to connect")
echo "Health response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

# Test 2: Simple Linear Programming Problem
echo ""
echo "2️⃣ Testing simple LP problem..."
LP_RESPONSE=$(curl -s -X POST "$SOLVER_URL/solve" \
  -H "Content-Type: application/json" \
  -d '{
    "problem": {
      "objective": {"sense": "minimize", "linear": [1, 1]},
      "variables": [
        {"name": "x", "type": "cont", "lb": 0, "ub": 10},
        {"name": "y", "type": "cont", "lb": 0, "ub": 10}
      ],
      "constraints": [
        {"coefficients": [1, 1], "sense": ">=", "rhs": 1}
      ]
    },
    "solver": "highs"
  }' || echo "Failed to solve LP problem")

echo "LP response: $LP_RESPONSE"

if echo "$LP_RESPONSE" | grep -q "optimal"; then
    echo "✅ LP problem solved successfully"
else
    echo "❌ LP problem failed"
    exit 1
fi

# Test 3: Construction Crew Assignment Problem
echo ""
echo "3️⃣ Testing construction crew assignment problem..."
CREW_RESPONSE=$(curl -s -X POST "$SOLVER_URL/solve" \
  -H "Content-Type: application/json" \
  -d '{
    "problem": {
      "objective": {"sense": "minimize", "linear": [-3, -4, -4, -4]},
      "variables": [
        {"name": "carpenters", "type": "int", "lb": 0, "ub": 5},
        {"name": "electricians", "type": "int", "lb": 0, "ub": 5},
        {"name": "plumbers", "type": "int", "lb": 0, "ub": 3},
        {"name": "hvac_techs", "type": "int", "lb": 0, "ub": 2}
      ],
      "constraints": [
        {"coefficients": [1, 1, 1, 1], "sense": "<=", "rhs": 15}
      ]
    },
    "solver": "highs"
  }' || echo "Failed to solve crew assignment problem")

echo "Crew assignment response: $CREW_RESPONSE"

if echo "$CREW_RESPONSE" | grep -q "optimal"; then
    echo "✅ Crew assignment problem solved successfully"
else
    echo "❌ Crew assignment problem failed"
    exit 1
fi

# Test 4: Unsupported Solver
echo ""
echo "4️⃣ Testing unsupported solver..."
UNSUPPORTED_RESPONSE=$(curl -s -X POST "$SOLVER_URL/solve" \
  -H "Content-Type: application/json" \
  -d '{
    "problem": {
      "objective": {"sense": "minimize", "linear": [1, 1]},
      "variables": [
        {"name": "x", "type": "cont", "lb": 0, "ub": 10},
        {"name": "y", "type": "cont", "lb": 0, "ub": 10}
      ],
      "constraints": [
        {"coefficients": [1, 1], "sense": ">=", "rhs": 1}
      ]
    },
    "solver": "or-tools"
  }' || echo "Failed to test unsupported solver")

echo "Unsupported solver response: $UNSUPPORTED_RESPONSE"

if echo "$UNSUPPORTED_RESPONSE" | grep -q "not yet implemented"; then
    echo "✅ Unsupported solver handled correctly"
else
    echo "❌ Unsupported solver not handled correctly"
    exit 1
fi

echo ""
echo "🎉 All tests passed!"
echo ""
echo "📊 Test Summary:"
echo "• Health check: ✅"
echo "• Simple LP problem: ✅"
echo "• Crew assignment problem: ✅"
echo "• Unsupported solver handling: ✅"
echo ""
echo "🚀 Solver service is working correctly!" 