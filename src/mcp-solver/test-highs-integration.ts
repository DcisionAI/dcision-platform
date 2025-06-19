// Test script for highs-mcp integration
// This script verifies that the ConstructionMCPSolver works with highs-mcp

import ConstructionMCPSolver from './ConstructionMCPSolver';

async function testHighsIntegration() {
  console.log('🧪 Testing HiGHS MCP Integration\n');

  const solver = new ConstructionMCPSolver();

  // Test 1: Check HiGHS availability
  console.log('1. Checking HiGHS availability...');
  const highsAvailable = solver.isHighsAvailable();
  console.log(`   HiGHS available: ${highsAvailable ? '✅ Yes' : '⚠️ No (using fallback)'}\n`);

  // Test 2: Simple workforce scheduling problem
  console.log('2. Testing workforce scheduling problem...');
  try {
    const workforceProblem = {
      problem_type: 'scheduling' as const,
      sense: 'minimize' as const,
      objective: {
        linear: [1, 1, 1, 1] // Minimize total worker hours
      },
      variables: [
        { name: 'carpenters', type: 'int' as const, category: 'worker' as const, description: 'Number of carpenters' },
        { name: 'electricians', type: 'int' as const, category: 'worker' as const, description: 'Number of electricians' },
        { name: 'plumbers', type: 'int' as const, category: 'worker' as const, description: 'Number of plumbers' },
        { name: 'overtime_hours', type: 'cont' as const, category: 'time' as const, description: 'Overtime hours needed' }
      ],
      constraints: {
        dense: [
          [1, 0, 0, 0], // Carpenter requirement
          [0, 1, 0, 0], // Electrician requirement
          [0, 0, 1, 0], // Plumber requirement
          [1, 1, 1, 0]  // Total worker constraint
        ],
        sense: ['>=' as const, '>=' as const, '>=' as const, '<=' as const],
        rhs: [5, 3, 2, 15], // Requirements and total limit
        categories: ['capacity' as const, 'capacity' as const, 'capacity' as const, 'capacity' as const]
      }
    };

    const result = await solver.solveConstructionOptimization(workforceProblem);
    console.log('   ✅ Workforce scheduling solved successfully');
    console.log(`   Status: ${result.status}`);
    console.log(`   Objective value: ${result.objective_value}`);
    console.log(`   Variables: ${result.solution.length}`);
    console.log(`   Solver used: ${result.metadata.solver_used}`);
    console.log(`   Solve time: ${result.metadata.solve_time_ms}ms\n`);

  } catch (error: any) {
    console.log(`   ❌ Workforce scheduling failed: ${error.message}\n`);
  }

  // Test 3: Resource allocation problem
  console.log('3. Testing resource allocation problem...');
  try {
    const resourceProblem = {
      problem_type: 'resource_allocation' as const,
      sense: 'maximize' as const,
      objective: {
        linear: [100, 150, 80, 120] // Maximize project value
      },
      variables: [
        { name: 'project_a', type: 'bin' as const, category: 'project' as const, description: 'Select Project A' },
        { name: 'project_b', type: 'bin' as const, category: 'project' as const, description: 'Select Project B' },
        { name: 'project_c', type: 'bin' as const, category: 'project' as const, description: 'Select Project C' },
        { name: 'project_d', type: 'bin' as const, category: 'project' as const, description: 'Select Project D' }
      ],
      constraints: {
        dense: [
          [5, 8, 3, 6],   // Budget constraint
          [2, 3, 1, 2]    // Time constraint
        ],
        sense: ['<=' as const, '<=' as const],
        rhs: [20, 8], // Available budget and time
        categories: ['budget' as const, 'timeline' as const]
      }
    };

    const result = await solver.solveConstructionOptimization(resourceProblem);
    console.log('   ✅ Resource allocation solved successfully');
    console.log(`   Status: ${result.status}`);
    console.log(`   Objective value: ${result.objective_value}`);
    console.log(`   Selected projects: ${result.solution.filter(s => s.value > 0.5).map(s => s.variable_name).join(', ')}\n`);

  } catch (error: any) {
    console.log(`   ❌ Resource allocation failed: ${error.message}\n`);
  }

  // Test 4: Template generation
  console.log('4. Testing template generation...');
  try {
    const templates = ['workforce_scheduling', 'resource_allocation', 'cost_optimization', 'supply_chain', 'risk_management'] as const;
    
    for (const templateType of templates) {
      const template = await solver.getConstructionTemplate(templateType);
      console.log(`   ✅ ${templateType} template generated`);
      console.log(`      Variables: ${template.variables.length}`);
      console.log(`      Constraints: ${template.constraints.rhs.length}`);
    }
    console.log('');

  } catch (error: any) {
    console.log(`   ❌ Template generation failed: ${error.message}\n`);
  }

  // Test 5: Solution analysis
  console.log('5. Testing solution analysis...');
  try {
    const testProblem = {
      problem_type: 'scheduling' as const,
      sense: 'minimize' as const,
      objective: { linear: [1, 1] },
      variables: [
        { name: 'worker_a', type: 'int' as const, category: 'worker' as const },
        { name: 'worker_b', type: 'int' as const, category: 'worker' as const }
      ],
      constraints: {
        dense: [[1, 1]],
        sense: ['>=' as const],
        rhs: [10]
      }
    };

    const testSolution = {
      status: 'optimal' as const,
      objective_value: 10,
      solution: [
        { variable_name: 'worker_a', value: 5, category: 'worker', description: 'Worker A' },
        { variable_name: 'worker_b', value: 5, category: 'worker', description: 'Worker B' }
      ],
      dual_solution: [1],
      variable_duals: [0, 0],
      metadata: {
        solve_time_ms: 50,
        iterations: 10,
        solver_used: 'test',
        construction_insights: []
      }
    };

    const analysis = await solver.analyzeConstructionSolution(testSolution, testProblem);
    console.log('   ✅ Solution analysis completed');
    console.log(`   Analysis type: ${typeof analysis}\n`);

  } catch (error: any) {
    console.log(`   ❌ Solution analysis failed: ${error.message}\n`);
  }

  console.log('🎉 HiGHS MCP Integration Test Completed!');
  console.log(`📊 Summary:`);
  console.log(`   - HiGHS Available: ${highsAvailable ? 'Yes' : 'No'}`);
  console.log(`   - Fallback Solver: ${!highsAvailable ? 'Active' : 'Not needed'}`);
  console.log(`   - Ready for Production: ${highsAvailable ? 'Yes' : 'Install highs-mcp first'}`);
}

// Run test if this file is executed directly
if (require.main === module) {
  testHighsIntegration().catch(console.error);
}

export { testHighsIntegration }; 