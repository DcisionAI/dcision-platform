// Simple test to check if highs-mcp is working
const { createClient } = require('highs-mcp');

console.log('Testing highs-mcp package...');

// Simple linear programming problem
const problem = {
  sense: 'minimize',
  objective: {
    linear: [1, 1] // Minimize x + y
  },
  variables: [
    { name: 'x', lb: 0, ub: Infinity, type: 'cont' },
    { name: 'y', lb: 0, ub: Infinity, type: 'cont' }
  ],
  constraints: {
    dense: [
      [1, 1] // x + y >= 1
    ],
    sense: ['>='],
    rhs: [1]
  }
};

console.log('Problem:', JSON.stringify(problem, null, 2));

async function run() {
  const highs = createClient();
  try {
    const result = await highs.solve(problem);
    console.log('✅ HiGHS solver result:', result);
    console.log('Status:', result.status);
    console.log('Objective value:', result.objective_value);
    console.log('Solution:', result.solution);
  } catch (error) {
    console.log('❌ HiGHS solver error:', error.message);
  }
}

run(); 